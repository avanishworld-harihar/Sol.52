/**
 * Wave 3A-5.1 Documents module verification (API + optional DB).
 * Usage: node scripts/verify-documents-3a51.mjs
 * Requires: dev server on BASE_URL (default http://localhost:3000)
 * Optional: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env for DB/storage checks
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const REPORT_DIR = join(ROOT, "docs", "verification", "3a51-documents");
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID?.trim() || null;
const AUTO_ARCHIVE = process.env.AUTO_ARCHIVE_TEST_PROJECT !== "0";

function assertSafeBaseUrl() {
  let host;
  try {
    host = new URL(BASE).hostname.toLowerCase();
  } catch {
    throw new Error(`Invalid BASE_URL: ${BASE}`);
  }
  const isProd =
    host.includes("vercel.app") ||
    host.endsWith(".sol.in") ||
    (host !== "localhost" && host !== "127.0.0.1" && !host.endsWith(".local"));
  if (isProd && process.env.ALLOW_PRODUCTION_VERIFY !== "1") {
    throw new Error(
      `Refusing to run against production host "${host}". ` +
        `Use BASE_URL=http://localhost:3000, set TEST_PROJECT_ID for an existing local project, ` +
        `or set ALLOW_PRODUCTION_VERIFY=1 only if you accept creating hidden test data.`
    );
  }
}

async function archiveTestProject(projectId, admin) {
  const now = new Date().toISOString();
  if (admin) {
    const { error } = await admin
      .from("projects")
      .update({ archived_at: now, dashboard_visible: false, updated_at: now })
      .eq("id", projectId);
    if (error) console.warn(`Cleanup archive failed: ${error.message}`);
    else console.log(`Archived test project ${projectId}`);
    return;
  }
  await fetchJson(`${BASE}/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archived_at: now, dashboard_visible: false }),
  });
}

const results = [];

function log(id, status, detail) {
  results.push({ id, status, detail });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "○";
  console.log(`${icon} [${status}] ${id}: ${detail}`);
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { ok: false, error: text.slice(0, 200) };
  }
  return { res, json };
}

/** Minimal valid JPEG */
function tinyJpegBuffer() {
  const b64 =
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
  return Buffer.from(b64, "base64");
}

function minimalPdfBuffer() {
  return Buffer.from(
    "%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n",
    "utf8"
  );
}

async function uploadDoc(projectId, category, fileName, buffer, mime) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: mime });
  form.append("file", blob, fileName);
  form.append("doc_category", category);
  const { res, json } = await fetchJson(`${BASE}/api/projects/${projectId}/documents`, {
    method: "POST",
    body: form,
  });
  return { res, json };
}

async function checkMigrationDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    log("1-migration", "SKIP", "No SUPABASE_URL/SERVICE_ROLE_KEY in env — user confirmed SQL success");
    return null;
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data: cols, error } = await admin
    .from("project_documents")
    .select("id")
    .limit(1);
  if (error) {
    if (error.message.includes("does not exist") || error.code === "42P01") {
      log("1-migration", "FAIL", `project_documents table missing: ${error.message}`);
      return null;
    }
    log("1-migration", "FAIL", error.message);
    return null;
  }
  const { data: bucket } = await admin.storage.getBucket("project-files");
  log(
    "1-migration",
    "PASS",
    `project_documents readable; storage bucket project-files: ${bucket ? "exists" : "will be created on upload"}`
  );
  return admin;
}

async function main() {
  mkdirSync(REPORT_DIR, { recursive: true });
  try {
    assertSafeBaseUrl();
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }

  let createdProjectId = null;
  let admin = null;
  let exitCode = 0;

  try {
    try {
      const health = await fetch(`${BASE}/api/projects/list?view=active`);
      if (!health.ok) {
        log("2-dev-server", "FAIL", `Cannot reach ${BASE} — start npm run dev`);
        writeReport();
        exitCode = 1;
        return;
      }
      log("2-dev-server", "PASS", `${BASE} responding`);
    } catch (e) {
      log("2-dev-server", "FAIL", e instanceof Error ? e.message : String(e));
      writeReport();
      exitCode = 1;
      return;
    }

    admin = await checkMigrationDb();

    let projectId = TEST_PROJECT_ID;
    if (projectId) {
    log("3-create-project", "SKIP", `using TEST_PROJECT_ID=${projectId}`);
  } else {
    const { json: createJson } = await fetchJson(`${BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        official_name: `3A51 Doc Test ${new Date().toISOString().slice(0, 16)}`,
        capacity_kw: "5",
        detail: "Automated verification project",
        dashboard_visible: false,
      }),
    });
    if (!createJson.ok || !createJson.data?.id) {
      log("3-create-project", "FAIL", createJson.error || "no id");
      writeReport();
      exitCode = 1;
      return;
    }
    projectId = createJson.data.id;
    createdProjectId = projectId;
    log("3-create-project", "PASS", `projectId=${projectId} (dashboard_visible=false)`);
  }

  log(
    "4-hub-docs-tab",
    "SKIP",
    "Client-rendered tab — verified via scripts/verify-documents-ui.mjs (Playwright)"
  );

  const uploads = [
    { cat: "roof_photo", name: "roof-test.jpg", buf: tinyJpegBuffer(), mime: "image/jpeg" },
    { cat: "meter_photo", name: "meter-test.jpg", buf: tinyJpegBuffer(), mime: "image/jpeg" },
    { cat: "electricity_bill", name: "bill-test.pdf", buf: minimalPdfBuffer(), mime: "application/pdf" },
  ];

  const docIds = [];
  for (const u of uploads) {
    const { res, json } = await uploadDoc(projectId, u.cat, u.name, u.buf, u.mime);
    if (!json.ok || !json.data?.id) {
      log(`5-upload-${u.cat}`, "FAIL", json.error || res.status);
    } else {
      docIds.push(json.data.id);
      const hasUrl = Boolean(json.data.download_url);
      log(
        `5-upload-${u.cat}`,
        "PASS",
        `id=${json.data.id} signed_url=${hasUrl ? "yes" : "no"}`
      );
    }
  }

  const { json: listJson } = await fetchJson(`${BASE}/api/projects/${projectId}/documents`);
  const count = listJson.ok ? (listJson.data?.length ?? 0) : 0;
  log(
    "6-list-documents",
    count >= 3 ? "PASS" : "FAIL",
    `API list count=${count}`
  );

  const { json: sumJson } = await fetchJson(
    `${BASE}/api/projects/${projectId}/documents?summary=1`
  );
  log(
    "9-overview-summary",
    sumJson.ok && (sumJson.data?.total ?? 0) >= 3 ? "PASS" : "FAIL",
    `summary total=${sumJson.data?.total ?? "?"}`
  );

  const { json: actJson } = await fetchJson(
    `${BASE}/api/projects/${projectId}/activity?limit=20`
  );
  const docEvents =
    actJson.ok && Array.isArray(actJson.data)
      ? actJson.data.filter((e) => e.event_type === "document_uploaded")
      : [];
  log(
    "8-timeline-events",
    docEvents.length >= 3 ? "PASS" : "FAIL",
    `document_uploaded events=${docEvents.length}`
  );

  if (docIds[0]) {
    const { json: oneJson } = await fetchJson(
      `${BASE}/api/projects/${projectId}/documents/${docIds[0]}`
    );
    let downloadOk = false;
    let detail = "no data";
    if (oneJson.ok && oneJson.data?.download_url) {
      const url = oneJson.data.download_url;
      downloadOk = /^https?:\/\//.test(url);
      detail = `url length=${url.length}`;
      if (admin && oneJson.data.storage_path) {
        const { data: file, error } = await admin.storage
          .from("project-files")
          .download(oneJson.data.storage_path);
        if (error || !file) {
          downloadOk = false;
          detail = error?.message ?? "storage download failed";
        } else {
          detail = `signed URL ok; storage bytes=${file.size}`;
        }
      }
    } else {
      detail = oneJson.error ?? "missing download_url";
    }
    log("10-signed-download", downloadOk ? "PASS" : "FAIL", detail);
  }

  if (admin && docIds[0]) {
    const { data: rows } = await admin
      .from("project_documents")
      .select("id, storage_path, doc_category, filename")
      .eq("project_id", projectId);
    log(
      "7-db-records",
      rows && rows.length >= 3 ? "PASS" : "FAIL",
      `DB rows for project=${rows?.length ?? 0}`
    );

    if (rows?.[0]?.storage_path) {
      const { data: file, error: dlErr } = await admin.storage
        .from("project-files")
        .download(rows[0].storage_path);
      log(
        "6-storage-bucket",
        !dlErr && file ? "PASS" : "FAIL",
        dlErr ? dlErr.message : `object size=${file?.size ?? 0}`
      );
    }
  } else {
    log("7-db-records", "SKIP", "No admin client");
    log("6-storage-bucket", "SKIP", "No admin client");
  }

  const permTests = [
    {
      id: "11a-manager-delete",
      url: `${BASE}/api/projects/${projectId}/documents/${docIds[2]}?actor_role=manager`,
      method: "DELETE",
      expectOk: true,
    },
    {
      id: "11b-technician-delete-denied",
      url: `${BASE}/api/projects/${projectId}/documents/${docIds[1]}?actor_role=technician`,
      method: "DELETE",
      expectOk: false,
    },
    {
      id: "11c-technician-upload",
      url: null,
      upload: { cat: "site_other", name: "tech-upload.jpg" },
      actorRole: "technician",
      expectOk: true,
    },
    {
      id: "11d-manager-upload",
      url: null,
      upload: { cat: "site_other", name: "mgr-upload.jpg" },
      actorRole: "manager",
      expectOk: true,
    },
  ];

  for (const t of permTests) {
    if (t.upload) {
      const form = new FormData();
      form.append("file", new Blob([tinyJpegBuffer()], { type: "image/jpeg" }), t.upload.name);
      form.append("doc_category", t.upload.cat);
      form.append("actor_role", t.actorRole);
      const { json } = await fetchJson(`${BASE}/api/projects/${projectId}/documents`, {
        method: "POST",
        body: form,
      });
      const pass = t.expectOk ? json.ok : !json.ok;
      log(t.id, pass ? "PASS" : "FAIL", t.expectOk ? "upload allowed" : `blocked: ${json.error}`);
    } else if (t.method === "DELETE") {
      const { res, json } = await fetchJson(t.url, { method: "DELETE" });
      const pass = t.expectOk ? json.ok : res.status === 403 || !json.ok;
      log(t.id, pass ? "PASS" : "FAIL", `status=${res.status} ok=${json.ok}`);
    }
  }

    writeReport();
    const failed = results.filter((r) => r.status === "FAIL").length;
    exitCode = failed > 0 ? 1 : 0;
  } finally {
    if (createdProjectId && AUTO_ARCHIVE) {
      await archiveTestProject(createdProjectId, admin);
    }
  }
  process.exit(exitCode);
}

function writeReport() {
  const md = [
    "# Wave 3A-5.1 Documents — Verification Report",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    `**Base URL:** ${BASE}`,
    "",
    "## Results",
    "",
    "| # | Check | Status | Detail |",
    "|---|--------|--------|--------|",
    ...results.map((r, i) => `| ${i + 1} | ${r.id} | ${r.status} | ${r.detail.replace(/\|/g, "\\|")} |`),
    "",
    "## Summary",
    "",
    `- PASS: ${results.filter((r) => r.status === "PASS").length}`,
    `- FAIL: ${results.filter((r) => r.status === "FAIL").length}`,
    `- SKIP: ${results.filter((r) => r.status === "SKIP").length}`,
    "",
    "## Screenshots",
    "",
    "Automated run did not capture UI screenshots. Manual capture checklist:",
    "- Project Hub → Docs tab",
    "- Survey tab photo slots",
    "- Timeline document_uploaded entries",
    "- Overview document count strip",
    "",
  ].join("\n");
  const outPath = join(REPORT_DIR, "REPORT.md");
  writeFileSync(outPath, md, "utf8");
  console.log(`\nReport written: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
