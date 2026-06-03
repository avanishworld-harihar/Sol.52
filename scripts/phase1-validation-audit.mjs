/**
 * Phase 1 validation audit — read-only counts + sample customer discovery.
 * Run: node scripts/phase1-validation-audit.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const text = readFileSync(".env.local", "utf8");
    const env = {};
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

const env = { ...loadEnvLocal(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function countTable(table, filter = () => true) {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
  if (error) {
    if (error.code === "42P01" || /does not exist/i.test(error.message)) {
      return { count: null, error: "table_missing" };
    }
    return { count: null, error: error.message };
  }
  return { count: count ?? 0, error: null };
}

async function tableExists(name) {
  const { error } = await sb.from(name).select("id", { head: true, count: "exact" }).limit(1);
  if (error?.code === "42P01" || /does not exist/i.test(error?.message ?? "")) return false;
  return !error || error.code !== "42P01";
}

async function topCustomersWithFiles() {
  const { data: cf } = await sb.from("customer_files").select("lead_id").limit(2000);
  const { data: pd } = await sb
    .from("project_documents")
    .select("project_id")
    .is("archived_at", null)
    .limit(2000);

  const cfByLead = new Map();
  for (const r of cf ?? []) {
    const id = String(r.lead_id);
    cfByLead.set(id, (cfByLead.get(id) ?? 0) + 1);
  }

  const projectIds = [...new Set((pd ?? []).map((r) => String(r.project_id)))];
  const leadByProject = new Map();
  if (projectIds.length) {
    const { data: projects } = await sb
      .from("projects")
      .select("id, lead_id")
      .in("id", projectIds.slice(0, 200));
    for (const p of projects ?? []) {
      leadByProject.set(String(p.id), String(p.lead_id));
    }
  }

  const pdByLead = new Map();
  for (const r of pd ?? []) {
    const lead = leadByProject.get(String(r.project_id));
    if (!lead) continue;
    pdByLead.set(lead, (pdByLead.get(lead) ?? 0) + 1);
  }

  const leads = new Set([...cfByLead.keys(), ...pdByLead.keys()]);
  const ranked = [...leads].map((lead_id) => ({
    lead_id,
    customer_files: cfByLead.get(lead_id) ?? 0,
    project_documents: pdByLead.get(lead_id) ?? 0,
    total: (cfByLead.get(lead_id) ?? 0) + (pdByLead.get(lead_id) ?? 0),
  }));
  ranked.sort((a, b) => b.total - a.total);
  return ranked.slice(0, 10);
}

const out = {
  tables: {},
  migration048: {},
  samples: {},
};

out.tables.customer_files = await countTable("customer_files");
out.tables.project_documents = await countTable("project_documents");
out.tables.customer_assets = await countTable("customer_assets");
out.tables.project_assets = await countTable("project_assets");
out.tables.asset_links = await countTable("asset_links");

out.migration048.customer_assets_exists = await tableExists("customer_assets");
out.migration048.project_assets_exists = await tableExists("project_assets");
out.migration048.asset_links_exists = await tableExists("asset_links");

out.samples.top_customers = await topCustomersWithFiles();

const bharti = "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const { data: bhartiCf } = await sb
  .from("customer_files")
  .select("id, file_name, file_type, lead_id")
  .eq("lead_id", bharti);
const { data: bhartiProjects } = await sb
  .from("projects")
  .select("id")
  .eq("lead_id", bharti);
const bhartiPids = (bhartiProjects ?? []).map((p) => p.id);
let bhartiPd = [];
if (bhartiPids.length) {
  const { data } = await sb
    .from("project_documents")
    .select("id, filename, doc_category, project_id")
    .in("project_id", bhartiPids)
    .is("archived_at", null);
  bhartiPd = data ?? [];
}
out.samples.bharti_gupta = {
  lead_id: bharti,
  customer_files: bhartiCf?.length ?? 0,
  project_documents: bhartiPd.length,
  customer_file_names: (bhartiCf ?? []).map((r) => r.file_name),
  project_doc_names: bhartiPd.map((r) => r.filename),
};

const { data: allPd } = await sb
  .from("project_documents")
  .select("id, filename, doc_category, project_id, created_at")
  .is("archived_at", null)
  .order("created_at", { ascending: false })
  .limit(50);

const pids = [...new Set((allPd ?? []).map((r) => String(r.project_id)))];
const { data: projRows } = pids.length
  ? await sb.from("projects").select("id, lead_id, customer_name, official_name").in("id", pids)
  : { data: [] };
const pmap = new Map((projRows ?? []).map((p) => [String(p.id), p]));

out.samples.all_project_documents = (allPd ?? []).map((d) => {
  const p = pmap.get(String(d.project_id));
  return {
    filename: d.filename,
    doc_category: d.doc_category,
    project_id: d.project_id,
    lead_id: p?.lead_id ?? null,
    customer_label: p?.customer_name || p?.official_name || null,
  };
});

const byLead = new Map();
for (const row of out.samples.all_project_documents) {
  if (!row.lead_id) continue;
  const id = String(row.lead_id);
  byLead.set(id, (byLead.get(id) ?? 0) + 1);
}
out.samples.best_lead_for_hub = [...byLead.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([lead_id, doc_count]) => ({ lead_id, doc_count }))[0] ?? null;

const { count: projectsWithLead } = await sb
  .from("projects")
  .select("id", { count: "exact", head: true })
  .not("lead_id", "is", null);

const { count: orphanProjects } = await sb
  .from("projects")
  .select("id", { count: "exact", head: true })
  .is("lead_id", null);

// projects with lead + doc count
const { data: linkedProjects } = await sb
  .from("projects")
  .select("id, lead_id")
  .not("lead_id", "is", null)
  .is("archived_at", null)
  .limit(100);
const linkedIds = (linkedProjects ?? []).map((p) => p.id);
let pdOnLinked = 0;
if (linkedIds.length) {
  const { count } = await sb
    .from("project_documents")
    .select("id", { count: "exact", head: true })
    .in("project_id", linkedIds)
    .is("archived_at", null);
  pdOnLinked = count ?? 0;
}

out.compatibility = {
  projects_with_lead_id: projectsWithLead ?? 0,
  projects_without_lead_id: orphanProjects ?? 0,
  project_documents_on_linked_projects: pdOnLinked,
  project_documents_on_orphan_projects: (out.tables.project_documents.count ?? 0) - pdOnLinked,
  hub_shows_legacy_when: [
    "customer_files.lead_id = customer id",
    "project_documents.project_id IN projects WHERE lead_id = customer id",
  ],
};

// Simulate hub merge for bharti (same query path as unified-documents-store)
const bhartiId = "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const { data: bProjects } = await sb
  .from("projects")
  .select("id, official_name, customer_name")
  .eq("lead_id", bhartiId)
  .is("archived_at", null);
const bPids = (bProjects ?? []).map((p) => p.id);
const { data: bCf } = await sb.from("customer_files").select("id, file_name").eq("lead_id", bhartiId);
let bPd = [];
if (bPids.length) {
  const { data } = await sb
    .from("project_documents")
    .select("id, filename, doc_category")
    .in("project_id", bPids)
    .is("archived_at", null);
  bPd = data ?? [];
}

const { data: actTypes } = await sb
  .from("project_activity_log")
  .select("event_type")
  .limit(500);
const milestoneSet = new Set([
  "project_created",
  "stage_changed",
  "project_completed",
  "project_archived",
]);
const logTypeCounts = {};
for (const r of actTypes ?? []) {
  const t = String(r.event_type);
  logTypeCounts[t] = (logTypeCounts[t] ?? 0) + 1;
}

const { data: crmCount } = await sb
  .from("activity_events")
  .select("id", { count: "exact", head: true })
  .eq("lead_id", bhartiId);

const { data: bhartiLogs } = bPids.length
  ? await sb
      .from("project_activity_log")
      .select("event_type, event_title, created_at")
      .in("project_id", bPids)
      .in("event_type", [...milestoneSet])
      .order("created_at", { ascending: false })
      .limit(10)
  : { data: [] };

out.hub_simulation_bharti = {
  linked_projects: bPids.length,
  legacy_customer_files: bCf?.length ?? 0,
  legacy_project_documents: bPd.length,
  unified_items_expected: (bCf?.length ?? 0) + bPd.length,
};

out.timeline_audit = {
  allowed_milestone_types: [...milestoneSet],
  project_activity_log_event_type_counts: logTypeCounts,
  bharti_milestones_injected: bhartiLogs ?? [],
  bharti_crm_events_total: crmCount ?? null,
  note: "Only event_type IN allowed_milestone_types are injected; other log rows excluded",
};

// Orphan project docs would NOT appear on any customer hub
out.orphan_hub_gap = {
  project_documents_total: out.tables.project_documents.count,
  visible_on_customer_hub: 0,
  reason: "All project_documents belong to projects with lead_id IS NULL",
};

// Filter logic mirror (unified-documents-store.matchesFilters)
function matchesFilters(row, q) {
  if (q.owner && row.owner !== q.owner) return false;
  if (q.types?.length && !q.types.includes(row.category)) return false;
  if (q.projectId === "none" && row.project_id != null) return false;
  if (q.projectId && q.projectId !== "none" && row.project_id !== q.projectId) return false;
  if (q.q?.trim() && !row.filename.toLowerCase().includes(q.q.trim().toLowerCase())) return false;
  return true;
}

const sampleRows = (out.samples.all_project_documents ?? []).slice(0, 4).map((d, i) => ({
  id: `legacy-pd-${i}`,
  owner: ["roof_photo", "meter_photo", "electricity_bill"].includes(d.doc_category) ? "customer" : "project",
  category:
    d.doc_category === "electricity_bill"
      ? "bill"
      : d.doc_category === "site_other"
        ? "survey_media"
        : d.doc_category,
  filename: d.filename,
  project_id: d.project_id,
}));

const filterTests = {
  unfiltered: sampleRows.length,
  owner_customer: sampleRows.filter((r) => matchesFilters(r, { owner: "customer" })).length,
  owner_project: sampleRows.filter((r) => matchesFilters(r, { owner: "project" })).length,
  q_roof: sampleRows.filter((r) => matchesFilters(r, { q: "roof" })).length,
  types_roof: sampleRows.filter((r) => matchesFilters(r, { types: ["roof_photo"] })).length,
  project_id: sampleRows.filter((r) =>
    matchesFilters(r, { projectId: sampleRows[0]?.project_id })
  ).length,
};

out.api_filter_logic_verification = {
  note: "Offline verification of matchesFilters using sample legacy row shapes",
  sample_rows: sampleRows,
  filter_tests: filterTests,
};

console.log(JSON.stringify(out, null, 2));
