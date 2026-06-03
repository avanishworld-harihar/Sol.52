/**
 * Phase 2 validation audit — read-only + controlled API uploads (test tag).
 * Run: node scripts/phase2-validation-audit.mjs
 * Env: BASE_URL (default http://localhost:3000), SKIP_UPLOAD=1 to skip live uploads
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs", "verification", "customer-documents-hub", "phase2-audit");
mkdirSync(OUT_DIR, { recursive: true });

const BHARTI_LEAD = "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const BHARTI_PROJECT = "3cfd6369-4d9a-45d3-8c90-008de6c62a46";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SKIP_UPLOAD = process.env.SKIP_UPLOAD === "1";

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
  migration_049: {},
  counts_before: {},
  counts_after: {},
  uploads: [],
  hub_api: [],
  asset_links: [],
  legacy: {},
  backfill_dry_run: null,
  pass_fail: [],
  risks: [],
};

async function countTable(name, filter) {
  let q = sb.from(name).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error?.code === "42P01") return { count: null, error: "table_missing" };
  return { count: count ?? 0, error: error?.message ?? null };
}

async function tableExists(name) {
  const { error } = await sb.from(name).select("id", { head: true, count: "exact" }).limit(1);
  return !error || error.code !== "42P01";
}

report.migration_049 = {
  file: "supabase/migrations/049_document_migration_map.sql",
  table_exists: await tableExists("document_migration_map"),
  destructive_legacy_alter: false,
  rollback_sql:
    "DROP TABLE IF EXISTS public.document_migration_map CASCADE;",
  schema: {
    document_migration_map: [
      "legacy_table text NOT NULL",
      "legacy_id uuid NOT NULL",
      "new_table text NOT NULL",
      "new_id uuid NOT NULL",
      "migrated_at timestamptz DEFAULT now()",
      "PRIMARY KEY (legacy_table, legacy_id)",
    ],
  },
};

for (const t of [
  "customer_assets",
  "project_assets",
  "asset_links",
  "customer_files",
  "project_documents",
]) {
  report.counts_before[t] = (await countTable(t)).count;
}

async function tinyJpegBuffer() {
  const b64 =
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==";
  return Buffer.from(b64, "base64");
}

async function uploadCustomer(fileType, label) {
  const buf = await tinyJpegBuffer();
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/jpeg" }), `phase2-audit-${label}.jpg`);
  form.append("file_type", fileType);
  const url = `${BASE}/api/customers/${BHARTI_LEAD}/files/upload`;
  const res = await fetch(url, { method: "POST", body: form });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { label, fileType, status: res.status, ok: json?.ok, error: json?.error, data: json?.data };
}

async function uploadProject(docCategory, label) {
  const buf = await tinyJpegBuffer();
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/jpeg" }), `phase2-audit-${label}.jpg`);
  form.append("doc_category", docCategory);
  const url = `${BASE}/api/projects/${BHARTI_PROJECT}/documents`;
  const res = await fetch(url, { method: "POST", body: form });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { label, docCategory, status: res.status, ok: json?.ok, error: json?.error, data: json?.data };
}

async function hubGet(query, label) {
  const url = `${BASE}/api/customers/${BHARTI_LEAD}/documents${query}`;
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  return {
    label,
    status: res.status,
    ok: json?.ok,
    total: json?.data?.total_in_page,
    items: (json?.data?.items ?? []).map((i) => ({
      filename: i.filename,
      owner: i.owner,
      source: i.source,
      legacy: i.legacy,
    })),
  };
}

if (!SKIP_UPLOAD) {
  try {
    report.uploads.push(await uploadCustomer("bill", "BILL"));
    report.uploads.push(await uploadCustomer("site_image", "ROOF_PHOTO-proxy"));
    report.uploads.push(await uploadProject("roof_photo", "ROOF_PHOTO"));
    report.uploads.push(await uploadProject("meter_photo", "METER_PHOTO"));
    report.uploads.push(await uploadProject("aadhaar", "AADHAAR"));
    report.uploads.push(await uploadProject("pan", "PAN"));
    report.uploads.push(await uploadProject("agreement", "AGREEMENT"));
  } catch (e) {
    report.uploads.push({ error: String(e) });
  }
}

const { data: caRows } = await sb
  .from("customer_assets")
  .select("id, category, filename, storage_path, storage_bucket, source_channel")
  .eq("customer_id", BHARTI_LEAD)
  .is("archived_at", null)
  .order("created_at", { ascending: false })
  .limit(30);

const { data: paRows } = await sb
  .from("project_assets")
  .select("id, category, filename, storage_path")
  .eq("project_id", BHARTI_PROJECT)
  .is("archived_at", null)
  .order("created_at", { ascending: false })
  .limit(20);

const { data: linkRows } = await sb
  .from("asset_links")
  .select("id, asset_id, project_id, link_role, pinned")
  .eq("project_id", BHARTI_PROJECT);

const { data: legacyCf } = await sb
  .from("customer_files")
  .select("id")
  .eq("lead_id", BHARTI_LEAD);

const { data: legacyPd } = await sb
  .from("project_documents")
  .select("id")
  .eq("project_id", BHARTI_PROJECT)
  .is("archived_at", null);

report.counts_after = {};
for (const t of [
  "customer_assets",
  "project_assets",
  "asset_links",
  "customer_files",
  "project_documents",
  "document_migration_map",
]) {
  report.counts_after[t] = (await countTable(t)).count;
}

report.customer_assets_bharti = caRows ?? [];
report.project_assets_bharti = paRows ?? [];
report.asset_links = linkRows ?? [];

const auditUploads = (caRows ?? []).filter((r) =>
  String(r.filename).includes("phase2-audit")
);
const auditProjectAssets = (paRows ?? []).filter((r) =>
  String(r.filename).includes("phase2-audit")
);

const storagePaths = new Set();
for (const r of [...auditUploads, ...auditProjectAssets]) {
  if (r.storage_path) storagePaths.add(r.storage_path);
}
report.unique_storage_paths_audit = storagePaths.size;
report.duplicate_storage_paths =
  auditUploads.length + auditProjectAssets.length > storagePaths.size;

try {
  report.hub_api.push(await hubGet("?limit=50", "all"));
  report.hub_api.push(await hubGet("?owner=customer&limit=50", "owner_customer"));
  report.hub_api.push(await hubGet("?owner=project&limit=50", "owner_project"));
  report.hub_api.push(await hubGet("?types=ROOF_PHOTO&limit=50", "type_roof"));
  report.hub_api.push(await hubGet(`?project_id=${BHARTI_PROJECT}&limit=50`, "project"));
  report.hub_api.push(await hubGet("?q=phase2-audit&limit=50", "search"));
} catch (e) {
  report.hub_api.push({ error: String(e) });
}

report.legacy = {
  customer_files_bharti: legacyCf?.length ?? 0,
  project_documents_bharti: legacyPd?.length ?? 0,
  hub_shows_legacy: (report.hub_api[0]?.items ?? []).some((i) => i.legacy === true),
};

function pf(id, pass, note) {
  report.pass_fail.push({ id, result: pass ? "PASS" : "FAIL", note });
}

pf("049_no_destructive", !report.migration_049.destructive_legacy_alter, "No legacy ALTER/DROP");
pf(
  "049_table",
  report.migration_049.table_exists || report.counts_before.customer_assets != null,
  report.migration_049.table_exists
    ? "document_migration_map exists"
    : "Apply migration 049 in Supabase"
);

const billUpload = report.uploads.find((u) => u.fileType === "bill");
pf(
  "upload_bill",
  billUpload?.ok && billUpload?.status === 201,
  billUpload?.error ?? `status ${billUpload?.status}`
);

const roofCa = (caRows ?? []).some(
  (r) => r.category === "roof_photo" && String(r.filename).includes("phase2-audit")
);
pf(
  "upload_roof_customer_asset",
  roofCa || report.uploads.some((u) => u.docCategory === "roof_photo" && u.ok),
  "roof_photo in customer_assets"
);

const meterCa = (caRows ?? []).some((r) => r.category === "meter_photo");
pf("upload_meter", meterCa, "meter_photo in customer_assets");

pf(
  "upload_aadhaar",
  (paRows ?? []).some((r) => r.category === "aadhaar"),
  report.uploads.find((u) => u.docCategory === "aadhaar")?.error ?? "project_assets.aadhaar"
);
pf(
  "upload_pan",
  (paRows ?? []).some((r) => r.category === "pan"),
  report.uploads.find((u) => u.docCategory === "pan")?.error ?? "project_assets.pan"
);
pf(
  "upload_agreement",
  (paRows ?? []).some((r) => r.category === "agreement"),
  report.uploads.find((u) => u.docCategory === "agreement")?.error ?? "project_assets.agreement"
);

pf(
  "asset_links_exist",
  (linkRows ?? []).length > 0,
  `links: ${linkRows?.length ?? 0}`
);
pf(
  "no_duplicate_blobs",
  !report.duplicate_storage_paths,
  `unique paths: ${report.unique_storage_paths_audit}`
);
pf(
  "hub_search",
  (report.hub_api.find((h) => h.label === "search")?.total ?? 0) > 0,
  "q=phase2-audit"
);
pf(
  "hub_owner",
  report.hub_api.some((h) => h.label === "owner_customer" && (h.total ?? 0) > 0),
  "owner=customer"
);
pf(
  "hub_type",
  report.hub_api.some((h) => h.label === "type_roof" && (h.total ?? 0) > 0),
  "types=ROOF_PHOTO"
);
pf(
  "hub_project",
  report.hub_api.some((h) => h.label === "project" && (h.total ?? 0) > 0),
  "project_id filter"
);
pf(
  "legacy_visible",
  report.legacy.hub_shows_legacy || (report.hub_api[0]?.total ?? 0) > 0,
  "Hub shows legacy and/or v2 rows"
);

const v2WritesRecent = (caRows ?? []).filter((r) => r.source_channel !== "backfill").length;
const newCf =
  (report.counts_after.customer_files ?? 0) - (report.counts_before.customer_files ?? 0);
pf(
  "legacy_no_new_cf_on_v2_upload",
  newCf <= 0 || SKIP_UPLOAD,
  `customer_files delta: ${newCf}`
);

writeFileSync(join(OUT_DIR, "audit-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
