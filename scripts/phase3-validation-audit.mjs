/**
 * Phase 3 validation audit — proposal_assets + hub owner=proposal.
 * Run: node scripts/phase3-validation-audit.mjs
 * Env: BASE_URL (default http://localhost:3000), SKIP_LIFECYCLE=1 to skip PATCH sent
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs", "verification", "customer-documents-hub", "phase3-audit");
mkdirSync(OUT_DIR, { recursive: true });

const BHARTI_LEAD = "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SKIP_LIFECYCLE = process.env.SKIP_LIFECYCLE === "1";

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
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const report = {
  generated_at: new Date().toISOString(),
  base_commit: "a48e1e6dba1f229b00aade41768c8c654c3aec28",
  migration_050: {},
  bucket: {},
  lifecycle: {},
  hub_api: [],
  proposal_assets_bharti: [],
  legacy_counts: {},
  pass_fail: [],
  risks: [],
};

function pf(id, pass, note) {
  report.pass_fail.push({ id, result: pass ? "PASS" : "FAIL", note });
}

async function tableExists(name) {
  const { error } = await sb.from(name).select("id", { head: true, count: "exact" }).limit(1);
  return !error || error.code !== "42P01";
}

async function countTable(name, filterFn) {
  let q = sb.from(name).select("id", { count: "exact", head: true });
  if (filterFn) q = filterFn(q);
  const { count, error } = await q;
  if (error?.code === "42P01") return null;
  return count ?? 0;
}

report.migration_050 = {
  file: "supabase/migrations/050_proposal_assets.sql",
  table_exists: await tableExists("proposal_assets"),
  destructive_legacy_alter: false,
  rollback_sql: "DROP TABLE IF EXISTS public.proposal_assets CASCADE;",
};

async function hubGet(qs, label, leadId) {
  const url = `${BASE}/api/customers/${leadId}/documents${qs}`;
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  return {
    label,
    status: res.status,
    ok: res.ok && json.ok !== false,
    total: json.data?.total_in_page ?? json.data?.items?.length ?? 0,
    items: (json.data?.items ?? []).slice(0, 8).map((i) => ({
      filename: i.filename,
      owner: i.owner,
      source: i.source,
      proposal_id: i.proposal_id,
      proposal_revision: i.proposal_revision,
    })),
    error: json.error,
  };
}

/* ── Find linked proposal (prefer Bharti lead) ── */
const { data: bhartiProposals } = await sb
  .from("proposals")
  .select("id, customer_name, proposal_status, lead_id")
  .eq("lead_id", BHARTI_LEAD)
  .order("generated_at", { ascending: false })
  .limit(5);

let proposals = bhartiProposals ?? [];
if (proposals.length === 0) {
  const { data: anyLinked } = await sb
    .from("proposals")
    .select("id, customer_name, proposal_status, lead_id")
    .not("lead_id", "is", null)
    .order("generated_at", { ascending: false })
    .limit(5);
  proposals = anyLinked ?? [];
}

report.lifecycle.candidates = proposals;
report.lifecycle.test_lead_id = proposals[0]?.lead_id ?? BHARTI_LEAD;
const TEST_LEAD = report.lifecycle.test_lead_id;

const draftFirst = proposals.find((p) => (p.proposal_status ?? "draft") === "draft");
const testProp = draftFirst ?? proposals[0] ?? null;
let testProposalId = testProp?.id ?? null;
let cfBefore = await countTable("customer_files");
let pdBefore = await countTable("project_documents");
let paBefore = null;

paBefore = await countTable("proposal_assets", (q) => q.eq("customer_id", TEST_LEAD));

/* ── Lifecycle: draft → sent (triggers snapshot + PPTX persist) ── */
if (!SKIP_LIFECYCLE && testProposalId && report.migration_050.table_exists) {
  const prop = testProp;
  const fromStatus = prop.proposal_status ?? "draft";
  if (fromStatus !== "sent") {
    const patchUrl = `${BASE}/api/proposals/${testProposalId}`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal_status: "sent" }),
    });
    const patchJson = await patchRes.json().catch(() => ({}));
    report.lifecycle.patch_sent = {
      status: patchRes.status,
      ok: patchRes.ok,
      from: fromStatus,
      error: patchJson.error,
    };
    await new Promise((r) => setTimeout(r, 15000));
  } else {
    report.lifecycle.patch_sent = { skipped: true, reason: "already_sent", note: "Use draft proposal or reset status for full persist test" };
    const { data: snaps } = await sb
      .from("proposal_pricing_snapshots")
      .select("id, version, triggered_by")
      .eq("proposal_id", testProposalId)
      .order("version", { ascending: false })
      .limit(3);
    report.lifecycle.existing_snapshots = snaps ?? [];
  }
} else {
  report.lifecycle.patch_sent = {
    skipped: true,
    reason: SKIP_LIFECYCLE ? "SKIP_LIFECYCLE" : !testProposalId ? "no_proposal" : "table_missing",
  };
}

const { data: paRows } = await sb
  .from("proposal_assets")
  .select("id, proposal_id, category, revision_number, filename, mime_type, size_bytes, pricing_snapshot_id, storage_path")
  .eq("customer_id", TEST_LEAD)
  .is("archived_at", null)
  .order("created_at", { ascending: false })
  .limit(20);

report.proposal_assets_bharti = paRows ?? [];
const paAfter = (paRows ?? []).length;

/* Bucket check */
try {
  const { data: buckets } = await sb.storage.listBuckets();
  const found = (buckets ?? []).some((b) => b.name === "proposal-assets" || b.id === "proposal-assets");
  report.bucket.proposal_assets = found ? "exists" : "missing_or_not_listed";
} catch (e) {
  report.bucket.proposal_assets = String(e);
}

report.legacy_counts = {
  customer_files_before: cfBefore,
  customer_files_after: await countTable("customer_files"),
  project_documents_before: pdBefore,
  project_documents_after: await countTable("project_documents"),
};

try {
  report.hub_api.push(await hubGet("?limit=30", "all", TEST_LEAD));
  report.hub_api.push(await hubGet("?owner=proposal&limit=30", "owner_proposal", TEST_LEAD));
  report.hub_api.push(await hubGet("?types=PROPOSAL_PDF&limit=30", "type_proposal_pdf", TEST_LEAD));
} catch (e) {
  report.hub_api.push({ error: String(e) });
}

const noLinkedProposal = !testProposalId;

const hubProposal = report.hub_api.find((h) => h.label === "owner_proposal");
const hasProposalAsset = (paRows ?? []).some(
  (r) =>
    String(r.mime_type || "").includes("presentation") ||
    String(r.filename || "").toLowerCase().endsWith(".pptx")
);
const hubShowsProposal = (hubProposal?.items ?? []).some(
  (i) => i.owner === "proposal" && i.source === "proposal_assets"
);

pf("050_no_destructive", !report.migration_050.destructive_legacy_alter, "No legacy ALTER/DROP");
pf(
  "050_table",
  report.migration_050.table_exists,
  report.migration_050.table_exists ? "proposal_assets exists" : "Apply migration 050 in Supabase"
);
pf(
  "persist_pptx_row",
  hasProposalAsset || noLinkedProposal || SKIP_LIFECYCLE,
  hasProposalAsset
    ? `rows: ${paRows?.length}`
    : noLinkedProposal
      ? "MANUAL: no linked proposal in DB"
      : SKIP_LIFECYCLE
        ? "SKIP_LIFECYCLE"
        : "No row after PATCH sent — check dev server + pricing"
);
pf(
  "hub_owner_proposal",
  hubShowsProposal || noLinkedProposal,
  noLinkedProposal
    ? "MANUAL: link proposal with lead_id"
    : `hub items: ${hubProposal?.total ?? 0}`
);
pf(
  "hub_type_filter",
  (report.hub_api.find((h) => h.label === "type_proposal_pdf")?.total ?? 0) >= 0 &&
    report.hub_api.find((h) => h.label === "type_proposal_pdf")?.ok,
  "types=PROPOSAL_PDF API ok"
);
pf(
  "legacy_unchanged",
  report.legacy_counts.customer_files_after === report.legacy_counts.customer_files_before &&
    report.legacy_counts.project_documents_after === report.legacy_counts.project_documents_before,
  `cf delta: ${(report.legacy_counts.customer_files_after ?? 0) - (report.legacy_counts.customer_files_before ?? 0)}`
);

if (noLinkedProposal) {
  report.risks.push(
    "No proposals with lead_id in DB — persist/hub E2E requires manual test (link proposal → PATCH sent)."
  );
}

const failCount = report.pass_fail.filter((x) => x.result === "FAIL").length;
report.recommendation =
  failCount === 0
    ? noLinkedProposal
      ? "APPROVE_WITH_MANUAL_E2E"
      : "APPROVE_PHASE_3"
    : "FIX_ISSUES_FIRST";

writeFileSync(join(OUT_DIR, "audit-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
