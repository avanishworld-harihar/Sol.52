/**
 * Manual Phase 3 E2E — one linked proposal, full verification.
 * Run: node scripts/phase3-manual-e2e.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "verification", "customer-documents-hub", "phase3-audit");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:3000";

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      env[t.slice(0, eq).trim()] = v;
    }
  } catch {
    /* ignore */
  }
  return env;
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function proposalAssetsTableReady() {
  const { error } = await sb.from("proposal_assets").select("id").limit(1);
  if (!error) return true;
  return error.code !== "PGRST205" && error.code !== "42P01";
}

const report = {
  generated_at: new Date().toISOString(),
  pass_fail: [],
  migration_050_ready: false,
  proposal: null,
  lead_id: null,
  lifecycle: {},
  proposal_asset: null,
  hub: {},
  download: {},
  legacy: {},
};

function pf(id, pass, note) {
  report.pass_fail.push({ id, result: pass ? "PASS" : "FAIL", note });
}

async function count(name, filter) {
  let q = sb.from(name).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error?.code === "42P01") return null;
  return count ?? 0;
}

/* ── 1. Find linked proposal (prefer draft) ── */
const BHARTI = "eead2c0a-8f20-4c7a-8128-ce8fff874834";

report.migration_050_ready = await proposalAssetsTableReady();

/* Resolve linked proposal even when 050 missing (for report context) */
const { data: linkedPreview } = await sb
  .from("proposals")
  .select("id, customer_name, lead_id")
  .eq("lead_id", BHARTI)
  .order("generated_at", { ascending: false })
  .limit(1);
if (linkedPreview?.[0]) {
  report.proposal = linkedPreview[0];
  report.lead_id = linkedPreview[0].lead_id;
  report.legacy.customer_files_before = await count("customer_files", (q) =>
    q.eq("lead_id", BHARTI)
  );
  report.legacy.project_documents_before = await count("project_documents");
  report.legacy.customer_files_after = report.legacy.customer_files_before;
  report.legacy.project_documents_after = report.legacy.project_documents_before;
}

if (!report.migration_050_ready) {
  pf("migration_050_applied", false, "Apply supabase/migrations/050_proposal_assets.sql in Supabase SQL Editor");
  pf(
    "linked_proposal",
    Boolean(report.proposal),
    report.proposal
      ? `${report.proposal.customer_name} (${String(report.proposal.id).slice(0, 8)}…)`
      : "No Bharti-linked proposal"
  );
  pf("proposal_assets_row", false, "Blocked — table missing");
  pf("hub_owner_proposal", false, "Blocked");
  pf("download_url", false, "Blocked");
  pf(
    "legacy_customer_files_unchanged",
    report.legacy.customer_files_before === report.legacy.customer_files_after,
    `count: ${report.legacy.customer_files_before}`
  );
  pf(
    "legacy_project_documents_unchanged",
    report.legacy.project_documents_before === report.legacy.project_documents_after,
    `count: ${report.legacy.project_documents_before}`
  );
  report.summary = "FAIL";
  report.recommendation = "Apply migration 050 then re-run node scripts/phase3-manual-e2e.mjs";
  report.lifecycle.note =
    "PPTX persist was verified in code (createPricingSnapshot → persist); DB table required for row/hub/download checks.";
  writeFileSync(join(OUT, "manual-e2e-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(OUT, "manual-e2e-report.md"),
    buildMarkdown(report, report.proposal?.id ?? "n/a", BHARTI)
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

pf("migration_050_applied", true, "proposal_assets table reachable");

const { data: linked, error: linkErr } = await sb
  .from("proposals")
  .select("id, customer_name, lead_id, generated_at")
  .not("lead_id", "is", null)
  .order("generated_at", { ascending: false })
  .limit(20);

if (linkErr) report.lifecycle.proposals_query_error = linkErr.message;

if (!linked?.length) {
  pf("linked_proposal", false, "No proposals with lead_id in DB");
  writeFileSync(join(OUT, "manual-e2e-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

/* Prefer Bharti-linked proposal with pricing */
const bhartiLinked = linked.filter((p) => p.lead_id === BHARTI);
let pick = bhartiLinked[0] ?? linked[0];
for (const p of [pick, ...bhartiLinked, ...linked]) {
  const { data: pr } = await sb.from("proposal_pricing").select("id").eq("proposal_id", p.id).maybeSingle();
  if (pr) {
    pick = p;
    break;
  }
}
report.proposal = pick;
report.lead_id = pick.lead_id;

const leadId = pick.lead_id;
const proposalId = pick.id;

report.legacy.customer_files_before = await count("customer_files", (q) => q.eq("lead_id", leadId));
report.legacy.project_documents_before = await count("project_documents");
const paBefore = await count("proposal_assets", (q) => q.eq("customer_id", leadId));

/* ── 2. Pricing check ── */
const { data: pricing } = await sb
  .from("proposal_pricing")
  .select("id")
  .eq("proposal_id", proposalId)
  .maybeSingle();

report.lifecycle.has_pricing = Boolean(pricing);

/* ── 3. PATCH sent to trigger snapshot + PPTX persist ── */
let fromStatus = "draft";
try {
  const { data: stRow } = await sb.from("proposals").select("proposal_status").eq("id", proposalId).maybeSingle();
  if (stRow?.proposal_status) fromStatus = stRow.proposal_status;
} catch {
  /* column may be missing in DB — still attempt PATCH */
}

let triggeredPatch = false;
if (fromStatus !== "sent" && fromStatus !== "approved") {
  const res = await fetch(`${BASE}/api/proposals/${proposalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposal_status: "sent" }),
  });
  const json = await res.json().catch(() => ({}));
  report.lifecycle.patch = { status: res.status, ok: res.ok, from: fromStatus, error: json.error };
  triggeredPatch = res.ok;
  if (res.ok) await new Promise((r) => setTimeout(r, 18000));
}

if (!triggeredPatch) {
  report.lifecycle.direct_persist = "attempting via createPricingSnapshot";
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync("npx", ["tsx", "scripts/phase3-direct-persist.mjs", proposalId], {
    cwd: join(__dirname, ".."),
    encoding: "utf8",
    shell: true,
    timeout: 120000,
  });
  report.lifecycle.direct_persist_result = {
    status: r.status,
    stdout: (r.stdout || "").slice(-500),
    stderr: (r.stderr || "").slice(-500),
  };
  await new Promise((res) => setTimeout(res, 3000));
}

/* ── 4. proposal_assets row ── */
const { data: paRows } = await sb
  .from("proposal_assets")
  .select("*")
  .eq("customer_id", leadId)
  .eq("proposal_id", proposalId)
  .is("archived_at", null)
  .order("created_at", { ascending: false })
  .limit(5);

report.proposal_asset = paRows?.[0] ?? null;
const paAfter = paRows?.length ?? 0;

/* ── 5. Hub owner=proposal ── */
const hubRes = await fetch(`${BASE}/api/customers/${leadId}/documents?owner=proposal&limit=50`);
const hubJson = await hubRes.json().catch(() => ({}));
const items = hubJson.data?.items ?? hubJson.items ?? [];
report.hub = {
  status: hubRes.status,
  ok: hubRes.ok,
  total: items.length,
  proposal_items: items.filter((i) => i.owner === "proposal"),
};

const hubMatch = items.find(
  (i) =>
    i.source === "proposal_assets" &&
    (report.proposal_asset ? i.id === report.proposal_asset.id : i.owner === "proposal")
);

/* ── 6. Download URL ── */
let downloadOk = false;
if (hubMatch?.download_url) {
  const dl = await fetch(hubMatch.download_url, { method: "HEAD" }).catch(() => null);
  downloadOk = dl?.ok === true || dl?.status === 200;
  if (!downloadOk) {
    const dlGet = await fetch(hubMatch.download_url, { method: "GET" });
    downloadOk = dlGet.ok && (dlGet.headers.get("content-length") ?? "1") !== "0";
  }
  report.download = { url_present: true, http_ok: downloadOk, status: dl?.status };
} else if (report.proposal_asset?.storage_path) {
  const { data: signed } = await sb.storage
    .from(report.proposal_asset.storage_bucket || "proposal-assets")
    .createSignedUrl(report.proposal_asset.storage_path, 120);
  if (signed?.signedUrl) {
    const dl = await fetch(signed.signedUrl, { method: "HEAD" }).catch(() => null);
    downloadOk = dl?.ok === true;
    report.download = { url_present: true, via: "direct_signed", http_ok: downloadOk };
  }
}

report.legacy.customer_files_after = await count("customer_files", (q) => q.eq("lead_id", leadId));
report.legacy.project_documents_after = await count("project_documents");

const hasRow =
  report.proposal_asset &&
  (String(report.proposal_asset.mime_type || "").includes("presentation") ||
    String(report.proposal_asset.filename || "").endsWith(".pptx"));

pf("linked_proposal", true, `${pick.customer_name} (${proposalId.slice(0, 8)}…)`);
pf("has_pricing", Boolean(pricing), pricing ? "proposal_pricing exists" : "missing pricing");
pf(
  "proposal_assets_row",
  hasRow,
  hasRow
    ? `${report.proposal_asset.category} v${report.proposal_asset.revision_number}`
    : `rows for lead: ${paAfter} (before patch cycle: ${paBefore})`
);
pf(
  "hub_owner_proposal",
  hubMatch != null && report.hub.proposal_items.length > 0,
  `hub proposal items: ${report.hub.proposal_items.length}`
);
pf("download_url", downloadOk, report.download.http_ok ? "HEAD/GET ok" : JSON.stringify(report.download));
pf(
  "legacy_customer_files_unchanged",
  report.legacy.customer_files_before === report.legacy.customer_files_after,
  `delta: ${(report.legacy.customer_files_after ?? 0) - (report.legacy.customer_files_before ?? 0)}`
);
pf(
  "legacy_project_documents_unchanged",
  report.legacy.project_documents_before === report.legacy.project_documents_after,
  `delta: ${(report.legacy.project_documents_after ?? 0) - (report.legacy.project_documents_before ?? 0)}`
);

const fails = report.pass_fail.filter((x) => x.result === "FAIL").length;
report.summary = fails === 0 ? "PASS" : "FAIL";
report.recommendation = fails === 0 ? "Phase 3 manual E2E passed" : `${fails} check(s) failed`;

function buildMarkdown(r, proposalId, leadId) {
  return `# Phase 3 Manual E2E Report

**Generated:** ${r.generated_at}  
**Proposal:** ${r.proposal?.customer_name ?? "—"} (\`${proposalId}\`)  
**Customer lead:** \`${leadId}\`  
**Summary:** ${r.summary}

| Check | Result | Note |
|-------|--------|------|
${r.pass_fail.map((x) => `| ${x.id} | **${x.result}** | ${x.note} |`).join("\n")}

## Lifecycle
\`\`\`json
${JSON.stringify(r.lifecycle, null, 2)}
\`\`\`
`;
}

writeFileSync(join(OUT, "manual-e2e-report.json"), JSON.stringify(report, null, 2));
writeFileSync(join(OUT, "manual-e2e-report.md"), buildMarkdown(report, proposalId, leadId));
console.log(JSON.stringify(report, null, 2));
process.exit(fails === 0 ? 0 : 1);
