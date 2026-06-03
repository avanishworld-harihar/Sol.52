/**
 * Post-backfill unified hub API verification (read-only).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "docs", "verification", "customer-documents-hub", "phase4-stabilization");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:3000";
const LEAD = process.env.PHASE4_HUB_LEAD || "eead2c0a-8f20-4c7a-8128-ce8fff874834";

function loadEnvLocal() {
  try {
    const env = {};
    for (const line of readFileSync(join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
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

const report = { generated_at: new Date().toISOString(), lead_id: LEAD, checks: [], pass_fail: [] };

for (const q of ["", "?limit=100", "?owner=customer&limit=50", "?owner=project&limit=50", "?owner=proposal&limit=50"]) {
  const res = await fetch(`${BASE}/api/customers/${LEAD}/documents${q}`);
  const json = await res.json().catch(() => ({}));
  const items = json?.data?.items ?? [];
  const bySource = {};
  for (const i of items) {
    bySource[i.source] = (bySource[i.source] ?? 0) + 1;
  }
  report.checks.push({
    query: q || "(all)",
    status: res.status,
    ok: json?.ok,
    total: json?.data?.total_in_page ?? items.length,
    by_source: bySource,
    legacy_count: items.filter((x) => x.legacy).length,
    with_download_url: items.filter((x) => x.download_url).length,
  });
}

const all = report.checks.find((c) => c.query === "(all)");
const legacyReadOff =
  (process.env.DOCUMENTS_HUB_LEGACY_READ ?? "").trim().toLowerCase() !== "true";
const legacySources = all
  ? Object.keys(all.by_source).filter((s) => s === "customer_files" || s === "project_documents")
  : [];
const noLegacySources = legacySources.length === 0;

const pass =
  report.checks.every((c) => c.status === 200 && c.ok) &&
  (all?.total ?? 0) >= 1 &&
  (all?.with_download_url ?? 0) > 0 &&
  (!legacyReadOff || true) &&
  (legacyReadOff ? noLegacySources : true);

report.phase5a_legacy_read_off = legacyReadOff;
report.legacy_sources_in_hub = legacySources;

report.pass_fail.push({
  id: "hub_api_all_sources",
  result: pass ? "PASS" : "FAIL",
  note: `total=${all?.total} sources=${JSON.stringify(all?.by_source)} legacy_sources=${legacySources.join(",") || "none"}`,
});
if (legacyReadOff) {
  report.pass_fail.push({
    id: "no_legacy_hub_sources",
    result: noLegacySources ? "PASS" : "FAIL",
    note: noLegacySources ? "v2-only hub" : `found ${legacySources.join(", ")}`,
  });
}

report.summary = pass ? "PASS" : "FAIL";
writeFileSync(join(OUT, "hub-verification-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
