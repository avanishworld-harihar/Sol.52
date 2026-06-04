/**
 * One-off UX verification — Customer / Project Documents Hub (read-only).
 * Run: BASE_URL=http://127.0.0.1:3001 node scripts/ux-documents-hub-verification.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const LEAD = process.env.BHARTI_LEAD_ID || "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const PROJECT = process.env.BHARTI_PROJECT_ID || "3cfd6369-4d9a-45d3-8c90-008de6c62a46";
const TIMEOUT = 60_000;

function loadEnv() {
  try {
    const env = {};
    for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[t.slice(0, eq).trim()] = v;
    }
    return env;
  } catch {
    return {};
  }
}

const env = { ...loadEnv(), ...process.env };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function hubCat(row) {
  if (row.category === "bill") return "electricity_bill";
  if (["survey_media", "roof_photo", "meter_photo", "db_photo"].includes(row.category)) {
    return "site_photo";
  }
  if (row.category === "aadhaar") return "aadhaar";
  if (row.category === "pan") return "pan";
  if (row.category === "agreement") return "agreement";
  if (row.category === "advance_receipt") return "advance_receipt";
  if (row.owner === "proposal") return "other";
  return "other";
}

const report = {
  generated_at: new Date().toISOString(),
  base_url: BASE,
  browser: {
    note: "No Playwright in repo; UI chips/thumbnails verified via API + component static review.",
    console_errors: "Not captured — manual browser DevTools check recommended.",
    page_fetch: {},
  },
  checks: [],
  failed: [],
  bugs: [],
};

function pf(id, pass, note) {
  report.checks.push({ id, result: pass ? "PASS" : "FAIL", note });
}

// --- API: customer ---
const cust = await getJson(`${BASE}/api/customers/${LEAD}/documents?limit=500`);
const custItems = cust.json?.data?.items ?? [];
const custKeys = custItems.map((r) => `${r.source}:${r.id}`);
const custDup = custKeys.filter((k, i) => custKeys.indexOf(k) !== i);
const hubCounts = { all: custItems.length };
for (const c of [
  "electricity_bill",
  "aadhaar",
  "pan",
  "agreement",
  "advance_receipt",
  "site_photo",
  "other",
]) {
  hubCounts[c] = 0;
}
for (const r of custItems) hubCounts[hubCat(r)]++;

pf("1a_customer_api", cust.status === 200 && cust.json?.ok, `items=${custItems.length}`);
pf("1b_customer_counts_visible_data", hubCounts.all >= 7, JSON.stringify(hubCounts));
pf("1c_customer_existing_docs", custItems.length >= 7, `count=${custItems.length}`);
pf("5_no_customer_dup_in_api", custDup.length === 0, custDup.join(",") || "unique");

// --- API: project ---
const proj = await getJson(`${BASE}/api/projects/${PROJECT}/documents`);
const projItems = proj.json?.data ?? [];
const projIds = projItems.map((d) => d.id);
const projDup = projIds.filter((id, i) => projIds.indexOf(id) !== i);
const catCounts = { all: projItems.length };
for (const d of projItems) {
  const c = d.doc_category || "other";
  catCounts[c] = (catCounts[c] ?? 0) + 1;
}

pf("2a_project_api", proj.status === 200 && proj.json?.ok, `items=${projItems.length}`);
pf("2b_project_counts_data", catCounts.all >= 7, JSON.stringify(catCounts));
pf("2c_project_existing_docs", projItems.length >= 7, `count=${projItems.length}`);
pf("5_no_project_dup_in_api", projDup.length === 0, projDup.join(",") || "unique");
pf("5_customer_project_parity", projItems.length === custItems.length, `cust=${custItems.length} proj=${projItems.length}`);

// --- Thumbnails ---
const images = projItems.filter((d) => d.mime_type?.startsWith("image/"));
const imgsUrl = images.filter((d) => d.download_url);
const pdfs = projItems.filter(
  (d) => d.mime_type === "application/pdf" || d.filename?.toLowerCase().endsWith(".pdf")
);
const pdfsUrl = pdfs.filter((d) => d.download_url);

pf("3a_image_download_urls", images.length === 0 || imgsUrl.length === images.length, `${imgsUrl.length}/${images.length}`);
pf("3b_pdf_download_urls", pdfs.length === 0 || pdfsUrl.length === pdfs.length, `${pdfsUrl.length}/${pdfs.length}`);

// --- Ownership ---
const custOwners = [...new Set(custItems.map((r) => r.owner))];
const projOwners = [...new Set(projItems.map((d) => d.owner).filter(Boolean))];
pf("5_ownership_customer_hub", custOwners.length > 0, custOwners.join(","));
pf("5_ownership_project_hub", projOwners.includes("customer"), projOwners.join(","));

// --- DB row counts (no loss) ---
const [{ data: ca }, { data: pa }, { data: pr }] = await Promise.all([
  sb.from("customer_assets").select("id").eq("customer_id", LEAD).is("archived_at", null),
  sb.from("project_assets").select("id").eq("project_id", PROJECT).is("archived_at", null),
  sb.from("proposal_assets").select("id").eq("customer_id", LEAD).is("archived_at", null),
]);
const dbTotal = (ca?.length ?? 0) + (pa?.length ?? 0) + (pr?.length ?? 0);
pf("5_db_asset_count_vs_hub", custItems.length >= dbTotal, `hub=${custItems.length} db_active=${dbTotal}`);

// --- Static UI: no category_label in card components ---
const cardSrc = readFileSync(join(ROOT, "components/documents/hub-document-card.tsx"), "utf8");
const custSrc = readFileSync(join(ROOT, "components/customers/customer-documents-hub.tsx"), "utf8");
const projSrc = readFileSync(join(ROOT, "components/projects/hub/project-hub-documents-tab.tsx"), "utf8");
pf(
  "4_no_survey_media_in_card_ui",
  !cardSrc.includes("category_label") && !custSrc.includes("category_label") && !projSrc.includes("category_label"),
  "hub-document-card + hubs omit category_label"
);
pf(
  "4_hub_chips_component_used",
  custSrc.includes("HubCategoryChips") && projSrc.includes("HubCategoryChips"),
  "both hubs import HubCategoryChips"
);
pf(
  "4_thumbnail_component_used",
  cardSrc.includes("DocumentThumbnail"),
  "HubDocumentCard uses DocumentThumbnail"
);

// --- Upload category routing (code inspection, not live upload) ---
const routerSrc = readFileSync(join(ROOT, "lib/document-write-router.ts"), "utf8");
pf(
  "1d_upload_maps_hub_category",
  routerSrc.includes("writeCustomerHubCategoryUpload") && routerSrc.includes("hub_category"),
  "writeCustomerHubCategoryUpload present"
);
pf(
  "2d_upload_uses_doc_category",
  projSrc.includes("docCategory: categoryFilter"),
  "project upload passes selected chip as docCategory"
);

// Page fetch (optional)
for (const [name, url] of [
  ["customer_page", `${BASE}/customers/${LEAD}`],
  ["project_page", `${BASE}/projects/${PROJECT}?tab=documents`],
]) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    report.browser.page_fetch[name] = { status: res.status, ok: res.ok };
    pf(`browser_${name}`, res.status === 200, `HTTP ${res.status}`);
  } catch (e) {
    report.browser.page_fetch[name] = { error: String(e) };
    pf(`browser_${name}`, false, String(e));
    report.bugs.push(`${name} fetch failed: ${e}`);
  }
}

report.failed = report.checks.filter((c) => c.result === "FAIL");
report.summary = report.failed.length ? `FAIL (${report.failed.length})` : "PASS";
report.hub_counts = hubCounts;
report.project_cat_counts = catCounts;

console.log(JSON.stringify(report, null, 2));
process.exit(report.failed.length ? 1 : 0);
