/**
 * Real-world Phase 1 validation — link orphan project_documents to Bharti Gupta's project.
 * Run: node scripts/link-bharti-realworld-validation.mjs
 * Revert: node scripts/link-bharti-realworld-validation.mjs --revert
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  assertLegacyDocumentScriptMutationsAllowed,
  assertNoLegacyWriteEnvFlags,
} from "./lib/legacy-document-guard.mjs";

assertNoLegacyWriteEnvFlags("link-bharti-realworld-validation.mjs");
assertLegacyDocumentScriptMutationsAllowed(
  "link-bharti-realworld-validation.mjs",
  "link/revert customer_files or project_documents"
);

const BHARTI_LEAD = "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const BHARTI_PROJECT = "3cfd6369-4d9a-45d3-8c90-008de6c62a46";

/** Task 2: link exactly one project_document (roof → customer-owner badge in hub). */
const PRIMARY_LINK_FILENAME = "roof-test.jpg";

/** Additional links for filter/badge screenshots (same Bharti project). */
const EXTRA_LINK_FILENAMES = ["meter-test.jpg", "mgr-upload.jpg"];

const LINK_FILENAMES = [PRIMARY_LINK_FILENAME, ...EXTRA_LINK_FILENAMES];

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
const revert = process.argv.includes("--revert");

if (!url || !key) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: project, error: pErr } = await sb
  .from("projects")
  .select("id, lead_id, organization_id, customer_name")
  .eq("id", BHARTI_PROJECT)
  .maybeSingle();

if (pErr || !project) {
  console.error("Bharti project not found:", pErr?.message);
  process.exit(1);
}

if (String(project.lead_id) !== BHARTI_LEAD) {
  console.error("Project lead_id mismatch:", project.lead_id);
  process.exit(1);
}

const { data: orphans } = await sb
  .from("projects")
  .select("id, customer_name")
  .is("lead_id", null);

const orphanIds = (orphans ?? []).map((p) => p.id);
if (!orphanIds.length) {
  console.error("No orphan projects found");
  process.exit(1);
}

const { data: docs } = await sb
  .from("project_documents")
  .select("id, filename, doc_category, project_id, storage_path")
  .in("project_id", orphanIds)
  .in("filename", LINK_FILENAMES)
  .is("archived_at", null);

const backup = [];

const { data: alreadyOnBharti } = await sb
  .from("project_documents")
  .select("filename")
  .eq("project_id", BHARTI_PROJECT)
  .is("archived_at", null);
const onBhartiNames = new Set((alreadyOnBharti ?? []).map((r) => r.filename));

for (const name of LINK_FILENAMES) {
  if (onBhartiNames.has(name) && name !== PRIMARY_LINK_FILENAME) {
    console.log("Already on Bharti project:", name);
    continue;
  }
  const row = (docs ?? []).find((d) => d.filename === name);
  if (!row) {
    if (onBhartiNames.has(name)) continue;
    console.warn("Missing doc on orphan project:", name);
    continue;
  }
  backup.push({
    id: row.id,
    filename: row.filename,
    project_id: row.project_id,
  });

  if (revert) continue;

  const { error } = await sb
    .from("project_documents")
    .update({ project_id: BHARTI_PROJECT })
    .eq("id", row.id);

  if (error) {
    console.error("Update failed", name, error.message);
    process.exit(1);
  }
  console.log("Linked", name, "→ Bharti project", BHARTI_PROJECT);
}

if (!revert) {
  const { error: catErr } = await sb
    .from("project_documents")
    .update({ doc_category: "sld" })
    .eq("project_id", BHARTI_PROJECT)
    .eq("filename", "mgr-upload.jpg");
  if (catErr) console.warn("sld category update:", catErr.message);
  else console.log("mgr-upload.jpg doc_category → sld (project owner badge)");
}

if (revert) {
  for (const b of backup) {
    const { error } = await sb
      .from("project_documents")
      .update({ project_id: b.project_id })
      .eq("id", b.id);
    if (error) console.error("Revert failed", b.filename, error.message);
    else console.log("Reverted", b.filename, "→", b.project_id);
  }
  process.exit(0);
}

// Optional: one legacy customer_files row (reuses roof storage from linked doc)
const roof = (docs ?? []).find((d) => d.filename === "roof-test.jpg");
if (roof?.storage_path) {
  const { count } = await sb
    .from("customer_files")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", BHARTI_LEAD)
    .eq("file_name", "roof-test-customer-copy.jpg");

  if (!count) {
    const { data: signed } = await sb.storage
      .from("project-files")
      .createSignedUrl(roof.storage_path, 3600);
    const fileUrl = signed?.signedUrl ?? null;
    const { error: cfErr } = await sb.from("customer_files").insert({
      lead_id: BHARTI_LEAD,
      file_type: "site_image",
      file_name: "roof-test-customer-copy.jpg",
      file_url: fileUrl ?? "",
      mime_type: "image/jpeg",
      file_size_kb: 1,
    });
    if (cfErr) console.warn("customer_files insert skipped:", cfErr.message);
    else console.log("Inserted customer_files row (legacy customer path)");
  }
}

const { data: onBharti } = await sb
  .from("project_documents")
  .select("id, filename, doc_category")
  .eq("project_id", BHARTI_PROJECT)
  .is("archived_at", null);

console.log(
  JSON.stringify(
    {
      bharti_lead: BHARTI_LEAD,
      bharti_project: BHARTI_PROJECT,
      linked_count: backup.length,
      on_bharti_project: onBharti,
      revert_hint: "node scripts/link-bharti-realworld-validation.mjs --revert",
    },
    null,
    2
  )
);
