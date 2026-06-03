/**
 * Phase 2 — backfill legacy file metadata into customer_assets / project_assets.
 *
 * Usage:
 *   node scripts/backfill-document-assets.mjs --dry-run
 *   node scripts/backfill-document-assets.mjs --execute
 *   node scripts/backfill-document-assets.mjs --rollback-report
 *
 * Does NOT copy blobs — reuses storage_path / file_url only.
 * Does NOT run automatically.
 */
import { readFileSync, writeFileSync } from "node:fs";
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

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || (!args.has("--execute") && !args.has("--rollback-report"));
const execute = args.has("--execute");
const rollbackReport = args.has("--rollback-report");

const env = { ...loadEnvLocal(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const LEGACY_CUSTOMER_TYPE_TO_CATEGORY = {
  bill: "bill",
  site_image: "survey_media",
  document: "survey_media",
};

const LEGACY_PROJECT_TO_CATEGORY = {
  roof_photo: "roof_photo",
  meter_photo: "meter_photo",
  db_photo: "db_photo",
  electricity_bill: "bill",
  site_other: "survey_media",
  sld: "sld",
  layout: "net_metering",
  structural_drawing: "net_metering",
  nm_application: "net_metering",
  nm_inspection: "net_metering",
  nm_letter: "net_metering",
  installation_photo: "installation_photo",
  commissioning: "installation_photo",
  warranty: "agreement",
  handover: "agreement",
  aadhaar: "aadhaar",
  pan: "pan",
  agreement: "agreement",
  advance_receipt: "advance_receipt",
  other: "agreement",
};

const CUSTOMER_OWNED = new Set([
  "bill",
  "roof_photo",
  "meter_photo",
  "db_photo",
  "survey_media",
]);

async function resolveOrgId() {
  const { data } = await sb.from("organizations").select("id").limit(1).maybeSingle();
  return data?.id ?? null;
}

async function alreadyMapped(legacyTable, legacyId) {
  const { data } = await sb
    .from("document_migration_map")
    .select("new_id")
    .eq("legacy_table", legacyTable)
    .eq("legacy_id", legacyId)
    .maybeSingle();
  return !!data?.new_id;
}

if (rollbackReport) {
  const { data } = await sb.from("document_migration_map").select("*").order("migrated_at", {
    ascending: false,
  });
  const report = {
    generated_at: new Date().toISOString(),
    total: data?.length ?? 0,
    rows: data ?? [],
    rollback_sql_hint:
      "-- Manual rollback: archive or delete new_id rows from new_table; then delete map rows",
  };
  const outPath = "docs/verification/customer-documents-hub/backfill-rollback-report.json";
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log("Wrote", outPath, "rows:", report.total);
  process.exit(0);
}

const orgId = await resolveOrgId();
if (!orgId) {
  console.error("No organization_id found");
  process.exit(1);
}

const plan = { customer_files: [], project_documents: [], skipped: [], errors: [] };

const { data: cfs } = await sb.from("customer_files").select("*").limit(5000);
for (const r of cfs ?? []) {
  const legacyId = String(r.id);
  if (await alreadyMapped("customer_files", legacyId)) {
    plan.skipped.push({ table: "customer_files", id: legacyId, reason: "already_mapped" });
    continue;
  }
  const category = LEGACY_CUSTOMER_TYPE_TO_CATEGORY[r.file_type] ?? "survey_media";
  let storagePath = String(r.file_url ?? "");
  if (storagePath.startsWith("http")) {
    /* keep full URL in storage_path for public bucket */
  }
  plan.customer_files.push({
    legacy_id: legacyId,
    customer_id: r.lead_id,
    category,
    storage_path: storagePath,
    filename: r.file_name,
  });
}

const { data: pds } = await sb
  .from("project_documents")
  .select("*")
  .is("archived_at", null)
  .limit(5000);

const projectIds = [...new Set((pds ?? []).map((r) => String(r.project_id)))];
const leadByProject = new Map();
if (projectIds.length) {
  const { data: projects } = await sb
    .from("projects")
    .select("id, lead_id")
    .in("id", projectIds.slice(0, 500));
  for (const p of projects ?? []) {
    leadByProject.set(String(p.id), p.lead_id);
  }
}

for (const r of pds ?? []) {
  const legacyId = String(r.id);
  if (await alreadyMapped("project_documents", legacyId)) {
    plan.skipped.push({ table: "project_documents", id: legacyId, reason: "already_mapped" });
    continue;
  }
  const cat = LEGACY_PROJECT_TO_CATEGORY[r.doc_category] ?? "agreement";
  const leadId = leadByProject.get(String(r.project_id));
  if (!leadId) {
    plan.skipped.push({
      table: "project_documents",
      id: legacyId,
      reason: "orphan_project_no_lead_id",
    });
    continue;
  }
  plan.project_documents.push({
    legacy_id: legacyId,
    project_id: r.project_id,
    customer_id: leadId,
    category: cat,
    customer_owned: CUSTOMER_OWNED.has(cat),
    storage_path: r.storage_path,
    filename: r.filename,
  });
}

console.log(
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      organization_id: orgId,
      would_migrate: {
        customer_files: plan.customer_files.length,
        project_documents: plan.project_documents.length,
      },
      skipped: plan.skipped.length,
      sample: {
        customer_files: plan.customer_files.slice(0, 3),
        project_documents: plan.project_documents.slice(0, 3),
      },
    },
    null,
    2
  )
);

if (!execute) {
  console.log("\nDry-run only. Pass --execute to apply (after approval).");
  process.exit(0);
}

let inserted = 0;

for (const row of plan.customer_files) {
  const { data: asset, error } = await sb
    .from("customer_assets")
    .insert({
      organization_id: orgId,
      customer_id: row.customer_id,
      category: row.category,
      storage_bucket: "customer-files",
      storage_path: row.storage_path,
      filename: row.filename,
      mime_type: "application/octet-stream",
      size_bytes: 0,
      source_channel: "backfill",
    })
    .select("id")
    .single();
  if (error) {
    plan.errors.push({ row, error: error.message });
    continue;
  }
  await sb.from("document_migration_map").insert({
    legacy_table: "customer_files",
    legacy_id: row.legacy_id,
    new_table: "customer_assets",
    new_id: asset.id,
  });
  inserted += 1;
}

for (const row of plan.project_documents) {
  if (row.customer_owned) {
    const { data: asset, error } = await sb
      .from("customer_assets")
      .insert({
        organization_id: orgId,
        customer_id: row.customer_id,
        category: row.category,
        storage_bucket: "project-files",
        storage_path: row.storage_path,
        filename: row.filename,
        mime_type: "application/octet-stream",
        size_bytes: 0,
        source_channel: "backfill",
      })
      .select("id")
      .single();
    if (error) {
      plan.errors.push({ row, error: error.message });
      continue;
    }
    await sb.from("document_migration_map").insert({
      legacy_table: "project_documents",
      legacy_id: row.legacy_id,
      new_table: "customer_assets",
      new_id: asset.id,
    });
    const { data: existingLink } = await sb
      .from("asset_links")
      .select("id")
      .eq("project_id", row.project_id)
      .eq("link_role", row.category)
      .maybeSingle();
    if (existingLink?.id) {
      await sb
        .from("asset_links")
        .update({ asset_id: asset.id })
        .eq("id", existingLink.id);
    } else {
      await sb.from("asset_links").insert({
        organization_id: orgId,
        asset_id: asset.id,
        customer_id: row.customer_id,
        project_id: row.project_id,
        link_role: row.category,
      });
    }
    inserted += 1;
    continue;
  }

  const { data: asset, error } = await sb
    .from("project_assets")
    .insert({
      organization_id: orgId,
      customer_id: row.customer_id,
      project_id: row.project_id,
      category: row.category,
      storage_bucket: "project-files",
      storage_path: row.storage_path,
      filename: row.filename,
      mime_type: "application/octet-stream",
      size_bytes: 0,
    })
    .select("id")
    .single();
  if (error) {
    plan.errors.push({ row, error: error.message });
    continue;
  }
  await sb.from("document_migration_map").insert({
    legacy_table: "project_documents",
    legacy_id: row.legacy_id,
    new_table: "project_assets",
    new_id: asset.id,
  });
  inserted += 1;
}

console.log("Execute complete. Rows migrated:", inserted, "Errors:", plan.errors.length);
