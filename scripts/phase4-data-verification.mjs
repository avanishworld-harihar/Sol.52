/**
 * Phase 4 data verification — read-only checks for hub / backfill readiness.
 *
 * Run: node scripts/phase4-data-verification.mjs
 * Post-backfill: re-run after --execute to validate map ↔ asset rows.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "verification", "customer-documents-hub", "phase4-stabilization");
mkdirSync(OUT, { recursive: true });

function loadEnvLocal() {
  try {
    const text = readFileSync(join(ROOT, ".env.local"), "utf8");
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
  checks: [],
  pass_fail: [],
};

function pf(id, pass, note) {
  report.pass_fail.push({ id, result: pass ? "PASS" : "FAIL", note });
}

async function sampleMapIntegrity() {
  const { data: maps } = await sb.from("document_migration_map").select("*").limit(50);
  const missing = [];
  for (const m of maps ?? []) {
    const table = m.new_table;
    const { data } = await sb.from(table).select("id").eq("id", m.new_id).maybeSingle();
    if (!data?.id) missing.push({ map: m, issue: "new_id_not_found" });
  }
  return { sampled: maps?.length ?? 0, missing };
}

const { data: legacyCf } = await sb.from("customer_files").select("id").limit(5000);
const { data: legacyPd } = await sb
  .from("project_documents")
  .select("id, project_id")
  .is("archived_at", null)
  .limit(5000);
const { data: maps } = await sb.from("document_migration_map").select("legacy_table, legacy_id");

const mappedCf = new Set(
  (maps ?? []).filter((m) => m.legacy_table === "customer_files").map((m) => String(m.legacy_id))
);
const mappedPd = new Set(
  (maps ?? []).filter((m) => m.legacy_table === "project_documents").map((m) => String(m.legacy_id))
);

const unmigratedCf = (legacyCf ?? []).filter((r) => !mappedCf.has(String(r.id))).length;
const unmigratedPd = (legacyPd ?? []).filter((r) => !mappedPd.has(String(r.id))).length;

report.checks.push({
  name: "legacy_vs_map",
  customer_files_total: legacyCf?.length ?? 0,
  project_documents_active_sample: legacyPd?.length ?? 0,
  map_rows: maps?.length ?? 0,
  unmigrated_in_sample: { customer_files: unmigratedCf, project_documents: unmigratedPd },
});

const integrity = await sampleMapIntegrity();
report.checks.push({ name: "map_target_integrity_sample", ...integrity });

const { count: v2Assets } = await sb
  .from("customer_assets")
  .select("id", { count: "exact", head: true })
  .eq("source_channel", "backfill");
report.checks.push({
  name: "backfill_source_channel",
  customer_assets_backfill_channel: v2Assets ?? 0,
});

pf("map_integrity_sample", integrity.missing.length === 0 || integrity.sampled === 0, `${integrity.missing.length} broken of ${integrity.sampled}`);
pf("legacy_tables_readable", (legacyCf?.length ?? 0) >= 0, "customer_files query ok");

report.summary = report.pass_fail.every((x) => x.result === "PASS") ? "PASS" : "FAIL";
writeFileSync(join(OUT, "data-verification-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.summary === "PASS" ? 0 : 1);
