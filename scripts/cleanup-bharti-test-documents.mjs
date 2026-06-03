/**
 * Remove engineering test/audit documents for Bharti Gupta (v2 + legacy).
 *
 *   node scripts/cleanup-bharti-test-documents.mjs --dry-run
 *   node scripts/cleanup-bharti-test-documents.mjs --execute
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "verification", "customer-documents-hub", "phase5a");
mkdirSync(OUT, { recursive: true });

const BHARTI_LEAD = "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const BHARTI_PROJECT = "3cfd6369-4d9a-45d3-8c90-008de6c62a46";

function loadEnvLocal() {
  try {
    const text = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
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

const execute = process.argv.includes("--execute");
const env = { ...loadEnvLocal(), ...process.env };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Filenames from phase2/3/4 audits, backfill samples, proposal E2E — not user uploads. */
function isTestDocument(row) {
  const fn = String(row.filename ?? row.file_name ?? "").toLowerCase();
  if (!fn) return false;
  if (/phase[1234]-audit/.test(fn)) return true;
  if (fn.startsWith("p2-")) return true;
  if (fn.includes("phase2-audit") || fn.includes("phase3-audit")) return true;
  if (/^(meter-test|roof-test|mgr-upload)/.test(fn)) return true;
  if (/roof-test-customer/.test(fn)) return true;
  if (/proposal-v\d+\.pptx$/.test(fn)) return true;
  if (/bharti gupta-proposal/.test(fn)) return true;
  if (row.source_channel === "backfill") return true;
  return false;
}

const report = {
  generated_at: new Date().toISOString(),
  customer_id: BHARTI_LEAD,
  project_id: BHARTI_PROJECT,
  mode: execute ? "execute" : "dry-run",
  to_archive: { customer_assets: [], project_assets: [], proposal_assets: [] },
  to_delete_legacy: { customer_files: [], project_documents: [] },
  map_rows_removed: 0,
  asset_links_removed: 0,
};

const now = new Date().toISOString();

async function collectV2() {
  const { data: ca } = await sb
    .from("customer_assets")
    .select("id, filename, source_channel")
    .eq("customer_id", BHARTI_LEAD)
    .is("archived_at", null);
  for (const r of ca ?? []) {
    if (isTestDocument(r)) report.to_archive.customer_assets.push(r);
  }

  const { data: pa } = await sb
    .from("project_assets")
    .select("id, filename, project_id")
    .eq("customer_id", BHARTI_LEAD)
    .is("archived_at", null);
  for (const r of pa ?? []) {
    if (isTestDocument(r)) report.to_archive.project_assets.push(r);
  }

  const { data: pr } = await sb
    .from("proposal_assets")
    .select("id, filename, proposal_id")
    .eq("customer_id", BHARTI_LEAD)
    .is("archived_at", null);
  for (const r of pr ?? []) {
    if (isTestDocument(r)) report.to_archive.proposal_assets.push(r);
  }
}

async function collectLegacy() {
  const { data: cf } = await sb.from("customer_files").select("id, file_name").eq("lead_id", BHARTI_LEAD);
  for (const r of cf ?? []) {
    if (isTestDocument({ filename: r.file_name })) report.to_delete_legacy.customer_files.push(r);
  }

  const { data: pd } = await sb
    .from("project_documents")
    .select("id, filename")
    .eq("project_id", BHARTI_PROJECT)
    .is("archived_at", null);
  for (const r of pd ?? []) {
    if (isTestDocument(r)) report.to_delete_legacy.project_documents.push(r);
  }
}

await collectV2();
await collectLegacy();

const allV2Ids = [
  ...report.to_archive.customer_assets.map((r) => r.id),
  ...report.to_archive.project_assets.map((r) => r.id),
  ...report.to_archive.proposal_assets.map((r) => r.id),
];

if (execute) {
  for (const id of allV2Ids) {
    await sb.from("asset_links").delete().eq("asset_id", id);
    report.asset_links_removed += 1;
  }

  for (const id of allV2Ids) {
    await sb.from("document_migration_map").delete().eq("new_id", id);
    report.map_rows_removed += 1;
  }

  for (const r of report.to_archive.customer_assets) {
    await sb.from("customer_assets").update({ archived_at: now }).eq("id", r.id);
  }
  for (const r of report.to_archive.project_assets) {
    await sb.from("project_assets").update({ archived_at: now }).eq("id", r.id);
  }
  for (const r of report.to_archive.proposal_assets) {
    await sb.from("proposal_assets").update({ archived_at: now }).eq("id", r.id);
  }

  for (const r of report.to_delete_legacy.customer_files) {
    await sb.from("customer_files").delete().eq("id", r.id);
    await sb
      .from("document_migration_map")
      .delete()
      .eq("legacy_table", "customer_files")
      .eq("legacy_id", r.id);
  }

  for (const r of report.to_delete_legacy.project_documents) {
    await sb
      .from("project_documents")
      .update({ archived_at: now })
      .eq("id", r.id);
    await sb
      .from("document_migration_map")
      .delete()
      .eq("legacy_table", "project_documents")
      .eq("legacy_id", r.id);
  }
}

report.summary = {
  customer_assets: report.to_archive.customer_assets.length,
  project_assets: report.to_archive.project_assets.length,
  proposal_assets: report.to_archive.proposal_assets.length,
  legacy_customer_files: report.to_delete_legacy.customer_files.length,
  legacy_project_documents: report.to_delete_legacy.project_documents.length,
};

writeFileSync(join(OUT, "bharti-test-cleanup-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!execute) {
  console.log("\nDry-run only. Pass --execute to archive/remove test documents.");
}
