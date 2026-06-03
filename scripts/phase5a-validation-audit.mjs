/**
 * Phase 5A validation — legacy read OFF, v2 hub, regressions.
 * Run: node scripts/phase5a-validation-audit.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "verification", "customer-documents-hub", "phase5a");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PHASE5_ENV = {
  ...process.env,
  DOCUMENTS_HUB_LEGACY_READ: "false",
  NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ: "false",
};

const report = {
  generated_at: new Date().toISOString(),
  phase: "5A",
  flags: {
    DOCUMENTS_HUB_LEGACY_READ: "false",
    NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ: "false",
  },
  regressions: {},
  hub: null,
  pass_fail: [],
  summary: "PENDING",
};

function pf(id, pass, note) {
  report.pass_fail.push({ id, result: pass ? "PASS" : "FAIL", note });
}

function run(script, extraEnv = {}) {
  return spawnSync("node", [join("scripts", script)], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...PHASE5_ENV, ...extraEnv, BASE_URL: BASE },
    timeout: 300000,
  });
}

pf("legacy_read_flag_config", true, "audit runs with DOCUMENTS_HUB_LEGACY_READ=false");

const scripts = [
  ["phase2-validation-audit.mjs", { SKIP_UPLOAD: "1" }],
  ["phase3-manual-e2e.mjs", {}],
  ["phase4-stabilization-audit.mjs", {}],
  ["phase4-data-verification.mjs", {}],
  ["phase4-hub-verification.mjs", {}],
];

for (const [name, extra] of scripts) {
  const key = name.replace(".mjs", "").replace(/-/g, "_");
  const r = run(name, extra);
  report.regressions[key] = { exit_code: r.status, stderr_tail: r.stderr?.slice(-400) };
  pf(key, r.status === 0, `exit ${r.status}`);
}

try {
  report.hub = JSON.parse(
    readFileSync(join(ROOT, "docs/verification/customer-documents-hub/phase4-stabilization/hub-verification-report.json"), "utf8")
  );
  const legacy = report.hub.legacy_sources_in_hub ?? [];
  pf("hub_zero_legacy_sources", legacy.length === 0, legacy.join(", ") || "none");
} catch (e) {
  pf("hub_zero_legacy_sources", false, String(e));
}

const fails = report.pass_fail.filter((x) => x.result === "FAIL").length;
report.summary = fails === 0 ? "PASS" : `FAIL (${fails})`;

writeFileSync(join(OUT, "phase5a-audit-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(fails === 0 ? 0 : 1);
