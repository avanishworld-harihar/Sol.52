/**
 * Phase 5B — unified project documents read + auto-link validation (Bharti Gupta).
 * Run: node scripts/phase5b-unified-project-documents-validation.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "verification", "customer-documents-hub", "phase5b");
mkdirSync(OUT, { recursive: true });

const LEAD_ID = process.env.BHARTI_LEAD_ID || "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const PROJECT_ID =
  process.env.BHARTI_PROJECT_ID || "3cfd6369-4d9a-45d3-8c90-008de6c62a46";
const BASE = process.env.BASE_URL || "http://localhost:3000";

function loadEnvLocal() {
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

const env = { ...loadEnvLocal(), ...process.env };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const report = {
  generated_at: new Date().toISOString(),
  phase: "5B",
  lead_id: LEAD_ID,
  project_id: PROJECT_ID,
  db: {},
  api: {},
  pass_fail: [],
  summary: "PENDING",
};

function pf(id, pass, note) {
  report.pass_fail.push({ id, result: pass ? "PASS" : "FAIL", note });
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, json: {}, error: String(e) };
  }
}

// --- DB counts (read-only) ---
const [{ data: project }, { data: customerAssets }, { data: projectAssets }, { data: proposalAssets }, { data: links }] =
  await Promise.all([
    sb.from("projects").select("id, lead_id, archived_at").eq("id", PROJECT_ID).maybeSingle(),
    sb
      .from("customer_assets")
      .select("id, filename, category, archived_at")
      .eq("customer_id", LEAD_ID)
      .is("archived_at", null),
    sb
      .from("project_assets")
      .select("id, filename, category, archived_at")
      .eq("project_id", PROJECT_ID)
      .is("archived_at", null),
    sb
      .from("proposal_assets")
      .select("id, filename, category, archived_at")
      .eq("customer_id", LEAD_ID)
      .is("archived_at", null),
    sb.from("asset_links").select("id, asset_id, project_id, link_role").eq("project_id", PROJECT_ID),
  ]);

report.db = {
  project_lead_match: project?.lead_id === LEAD_ID,
  customer_assets: (customerAssets ?? []).length,
  project_assets: (projectAssets ?? []).length,
  proposal_assets: (proposalAssets ?? []).length,
  asset_links: (links ?? []).length,
  customer_asset_filenames: (customerAssets ?? []).map((a) => a.filename),
};

pf(
  "project_linked_to_bharti_lead",
  project?.lead_id === LEAD_ID && !project?.archived_at,
  `lead_id=${project?.lead_id}`
);

const expectedMinTotal =
  (customerAssets ?? []).length + (projectAssets ?? []).length + (proposalAssets ?? []).length;

// --- API: customer hub ---
const customerHub = await fetchJson(
  `${BASE}/api/customers/${LEAD_ID}/documents?limit=100`
);
const customerItems = customerHub.json?.data?.items ?? [];
report.api.customer_hub = {
  status: customerHub.status,
  ok: customerHub.json?.ok,
  total: customerItems.length,
  error: customerHub.error,
};

pf(
  "customer_hub_api",
  customerHub.status === 200 && customerHub.json?.ok,
  `status=${customerHub.status} items=${customerItems.length}`
);

// --- API: project hub list + summary ---
const [projectDocs, projectSummary] = await Promise.all([
  fetchJson(`${BASE}/api/projects/${PROJECT_ID}/documents`),
  fetchJson(`${BASE}/api/projects/${PROJECT_ID}/documents?summary=1`),
]);

const projectItems = projectDocs.json?.data ?? [];
const summary = projectSummary.json?.data ?? null;

report.api.project_hub = {
  list_status: projectDocs.status,
  list_ok: projectDocs.json?.ok,
  total: projectItems.length,
  by_owner: countBy(projectItems, (d) => d.owner ?? "unknown"),
  with_owner_field: projectItems.filter((d) => d.owner).length,
  with_category_label: projectItems.filter((d) => d.category_label).length,
  error: projectDocs.error,
};

report.api.project_summary = {
  status: projectSummary.status,
  ok: projectSummary.json?.ok,
  total: summary?.total ?? null,
  by_category: summary?.by_category ?? null,
  by_owner: summary?.by_owner ?? null,
  error: projectSummary.error,
};

pf(
  "project_hub_api",
  projectDocs.status === 200 && projectDocs.json?.ok,
  `status=${projectDocs.status} items=${projectItems.length}`
);

pf(
  "project_summary_api",
  projectSummary.status === 200 && projectSummary.json?.ok,
  `total=${summary?.total}`
);

pf(
  "summary_matches_list_total",
  summary?.total === projectItems.length,
  `summary=${summary?.total} list=${projectItems.length}`
);

pf(
  "unified_includes_all_v2_sources",
  projectItems.length >= expectedMinTotal,
  `project_items=${projectItems.length} expected_min=${expectedMinTotal} (ca=${report.db.customer_assets} pa=${report.db.project_assets} prop=${report.db.proposal_assets})`
);

// Customer uploads visible on project hub (Option A)
const customerAssetIds = new Set((customerAssets ?? []).map((a) => String(a.id)));
const projectDocIds = new Set(projectItems.map((d) => String(d.id)));
const missingCustomerOnProject = [...customerAssetIds].filter((id) => !projectDocIds.has(id));

report.api.missing_customer_assets_on_project = missingCustomerOnProject;

pf(
  "customer_uploads_visible_on_project",
  missingCustomerOnProject.length === 0,
  missingCustomerOnProject.length
    ? `missing ids: ${missingCustomerOnProject.slice(0, 5).join(", ")}`
    : `all ${customerAssetIds.size} customer_assets on project hub`
);

// Owner badges on API rows
const ownersPresent = new Set(projectItems.map((d) => d.owner).filter(Boolean));
pf(
  "owner_badges_on_api_rows",
  ownersPresent.has("customer") || report.db.customer_assets === 0,
  `owners=${[...ownersPresent].join(",") || "none"}`
);
if (report.db.project_assets > 0) {
  pf("project_owner_present", ownersPresent.has("project"), `owners=${[...ownersPresent].join(",")}`);
}
if (report.db.proposal_assets > 0) {
  pf("proposal_owner_present", ownersPresent.has("proposal"), `owners=${[...ownersPresent].join(",")}`);
}

// Owner filters
for (const owner of ["customer", "project", "proposal"]) {
  const filtered = await fetchJson(
    `${BASE}/api/projects/${PROJECT_ID}/documents?owner=${owner}`
  );
  const items = filtered.json?.data ?? [];
  const allMatch = items.every((d) => (d.owner ?? owner) === owner);
  pf(`owner_filter_${owner}`, filtered.status === 200 && allMatch, `count=${items.length}`);
}

// Sample: IMG upload from customer hub (if present)
const imgUpload = (customerAssets ?? []).find((a) =>
  /IMG-20240408-WA0001/i.test(String(a.filename))
);
if (imgUpload) {
  const onProject = projectItems.some((d) => d.id === imgUpload.id);
  pf(
    "bharti_img_upload_on_project_hub",
    onProject,
    onProject ? imgUpload.filename : `id ${imgUpload.id} not in project list`
  );
  report.api.sample_upload = {
    filename: imgUpload.filename,
    id: imgUpload.id,
    on_project_hub: onProject,
    has_asset_link: (links ?? []).some((l) => l.asset_id === imgUpload.id),
  };
}

function countBy(arr, fn) {
  const out = {};
  for (const x of arr) {
    const k = fn(x);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

const fails = report.pass_fail.filter((x) => x.result === "FAIL").length;
report.summary = fails === 0 ? "PASS" : `FAIL (${fails})`;

writeFileSync(join(OUT, "unified-project-documents-validation.json"), JSON.stringify(report, null, 2));

const md = `# Phase 5B — Unified Project Documents Validation

Generated: ${report.generated_at}

## Scope
- **Option A:** Project hub reads \`project_assets\` + linked customer \`customer_assets\` + \`proposal_assets\`
- **Option B:** Customer hub uploads auto-link to active projects (asset_links)

## Test subject
| Field | Value |
|-------|-------|
| Customer (Bharti Gupta) | \`${LEAD_ID}\` |
| Project | \`${PROJECT_ID}\` |

## DB snapshot
| Source | Active rows |
|--------|-------------|
| customer_assets | ${report.db.customer_assets} |
| project_assets (this project) | ${report.db.project_assets} |
| proposal_assets | ${report.db.proposal_assets} |
| asset_links (this project) | ${report.db.asset_links} |

## API results
| Check | Total |
|-------|-------|
| Customer hub items | ${report.api.customer_hub?.total ?? "—"} |
| Project hub items | ${report.api.project_hub?.total ?? "—"} |
| Summary total | ${report.api.project_summary?.total ?? "—"} |
| Missing customer assets on project | ${missingCustomerOnProject.length} |

## Pass / fail
${report.pass_fail.map((x) => `- **${x.id}:** ${x.result} — ${x.note}`).join("\n")}

## Overall
**${report.summary}**
`;

writeFileSync(join(ROOT, "docs/architecture/customer-documents-hub-phase5b-validation-report.md"), md);
console.log(JSON.stringify(report, null, 2));
process.exit(fails === 0 ? 0 : 1);
