/**
 * Remove QA / screenshot seed data (Ravi Sharma demo customer, verification projects, etc.).
 * Run once: node scripts/cleanup-demo-seed-data.mjs
 * Dry run:  node scripts/cleanup-demo-seed-data.mjs --dry-run
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

const DEMO_DETAIL_MARKERS = [
  "phase3a2-seed",
  "Phase 3A-4 Step",
  "stage advance demo",
  "Hub Step 2 Demo",
  "Step 3 Advance Demo",
  "Design Empty Demo",
  "Survey Empty Demo",
  "Comments Empty Demo",
  "API Smoke Test",
  "via POST — will delete",
];

const DEMO_OFFICIAL_NAMES = [
  "Ravi Sharma — 5kW Rooftop",
  "Green Valley Apartments — 25kW",
  "Patel Industries — 50kW",
  "Hub Step 2 Demo",
  "Step 3 Advance Demo",
  "Design Empty Demo",
  "Survey Empty Demo",
  "Comments Empty Demo",
  "API Smoke Test",
];

/** Seed script demo customers — only removed when no real project still references them. */
const DEMO_LEAD_NAMES = ["Ravi Sharma", "Amit Verma"];
const DEMO_LEAD_CITIES = { "Ravi Sharma": "Udaipur", "Amit Verma": "Jaipur" };

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

function isDemoProject(row, demoLeadIds) {
  const detail = String(row.detail ?? "");
  if (DEMO_DETAIL_MARKERS.some((m) => detail.includes(m))) return true;
  const name = String(row.official_name ?? row.customer_name ?? "");
  if (DEMO_OFFICIAL_NAMES.some((n) => name === n || name.startsWith(n))) return true;
  if (name === "Ravi Sharma" || name.startsWith("Ravi Sharma —")) return true;
  const code = String(row.project_code ?? "");
  if (/^SOL-\d{6}-00[123]$/.test(code)) return true;
  if (code === "SOL-HUB-S3") return true;
  const leadId = row.lead_id != null ? String(row.lead_id) : "";
  if (leadId && demoLeadIds?.has(leadId)) return true;
  return false;
}

function isDemoSeedPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return /^9876[56]\d{5}$/.test(digits);
}

function isDemoLead(row, leadIdsFromDeletedProjects) {
  const id = row.id;
  if (leadIdsFromDeletedProjects.has(id)) return true;
  if (isDemoSeedPhone(row.phone)) return true;
  const name = String(row.name ?? "").trim();
  const city = String(row.city ?? "").trim();
  if (!DEMO_LEAD_NAMES.includes(name)) return false;
  return city === DEMO_LEAD_CITIES[name];
}

async function deleteProjectChildren(admin, projectId) {
  const tables = [
    "project_tasks",
    "project_activity",
    "project_comments",
    "project_surveys",
    "project_designs",
    "project_bom_snapshots",
  ];
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("project_id", projectId);
    if (error && !/does not exist|Could not find/i.test(error.message)) {
      console.warn(`  ${table}:`, error.message);
    }
  }
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let leadsTable = "leads";
  const probe = await admin.from("leads").select("id").limit(1);
  if (probe.error) {
    const probe2 = await admin.from("customers").select("id").limit(1);
    if (!probe2.error) leadsTable = "customers";
    else {
      console.error("No leads/customers table:", probe.error.message);
      process.exit(1);
    }
  }

  const { data: leads, error: leadErr } = await admin.from(leadsTable).select("*");
  if (leadErr) {
    console.error(`${leadsTable} select failed:`, leadErr.message);
    process.exit(1);
  }

  const demoLeadIds = new Set(
    (leads ?? []).filter((row) => isDemoLead(row, new Set())).map((row) => row.id)
  );

  const { data: projects, error: projErr } = await admin.from("projects").select("*");
  if (projErr) {
    console.error("projects select failed:", projErr.message);
    process.exit(1);
  }

  const demoProjects = (projects ?? []).filter((p) => isDemoProject(p, demoLeadIds));
  const leadIdsFromDeleted = new Set(
    demoProjects.map((p) => p.lead_id).filter(Boolean)
  );

  console.log(DRY_RUN ? "[dry-run]" : "[delete]", "Demo projects:", demoProjects.length);
  for (const p of demoProjects) {
    console.log("  -", p.official_name ?? p.customer_name, `(${p.id})`);
    if (DRY_RUN) continue;
    await deleteProjectChildren(admin, p.id);
    const { error } = await admin.from("projects").delete().eq("id", p.id);
    if (error) console.error("    delete failed:", error.message);
  }

  const remainingProjectLeadIds = new Set(
    (projects ?? [])
      .filter((p) => !isDemoProject(p, demoLeadIds))
      .map((p) => p.lead_id)
      .filter(Boolean)
  );

  const demoLeads = (leads ?? []).filter((row) => {
    if (!isDemoLead(row, leadIdsFromDeleted)) return false;
    if (remainingProjectLeadIds.has(row.id)) {
      console.log("  skip lead (still linked to real project):", row.name, row.id);
      return false;
    }
    return true;
  });

  console.log(DRY_RUN ? "[dry-run]" : "[delete]", "Demo leads:", demoLeads.length);
  for (const row of demoLeads) {
    console.log("  -", row.name, row.city ?? "", `(${row.id})`);
    if (DRY_RUN) continue;
    const { error } = await admin.from(leadsTable).delete().eq("id", row.id);
    if (error) console.error("    delete failed:", error.message);
  }

  console.log("\nDone.", DRY_RUN ? "Re-run without --dry-run to apply." : "Refresh Customers / Projects in the app.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
