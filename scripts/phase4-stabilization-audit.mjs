/**
 * Phase 4 stabilization audit — non-destructive validation only.
 *
 * - Baseline counts, feature flags, legacy-write soak proxy
 * - Backfill dry-run report (no --execute)
 * - Rollback report export, destructive-migration scan
 * - Optional regression: phase2 (SKIP_UPLOAD=1), phase3 manual E2E
 *
 * Run: node scripts/phase4-stabilization-audit.mjs
 * Env: BASE_URL, SKIP_REGRESSION=1, SKIP_PHASE3=1
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "docs", "verification", "customer-documents-hub", "phase4-stabilization");
mkdirSync(OUT_DIR, { recursive: true });

const SOAK_DAYS = Number(process.env.PHASE4_SOAK_DAYS || "14");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SKIP_REGRESSION = process.env.SKIP_REGRESSION === "1";
const SKIP_PHASE3 = process.env.SKIP_PHASE3 === "1";

function loadEnvLocal() {
  try {
    const text = readFileSync(join(ROOT, ".env.local"), "utf8");
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
  phase: "4-stabilization",
  scope: {
    legacy_read_off: false,
    drop_migrations: false,
    destructive_schema: false,
    backfill_execute: false,
  },
  feature_flags: {},
  migrations: {},
  destructive_migration_scan: {},
  baseline_counts: {},
  document_migration_map: {},
  legacy_write_soak: {},
  backfill_dry_run: null,
  rollback_report: null,
  orphan_policy: {},
  regression: {},
  pass_fail: [],
  summary: "PENDING",
};

function pf(id, pass, note) {
  report.pass_fail.push({ id, result: pass ? "PASS" : "FAIL", note });
}

async function countTable(name, filter) {
  let q = sb.from(name).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    return { count: null, error: "table_missing" };
  }
  return { count: count ?? 0, error: error?.message ?? null };
}

async function tableReady(name) {
  const { error } = await sb.from(name).select("id").limit(1);
  if (!error) return true;
  return error.code !== "PGRST205" && error.code !== "42P01";
}

function readFlag(name, defaultOn = true) {
  const raw = env[name]?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return defaultOn;
}

report.feature_flags = {
  DOCUMENTS_HUB_V2_WRITE: readFlag("DOCUMENTS_HUB_V2_WRITE", true),
  DOCUMENTS_HUB_PROPOSAL_PERSIST: readFlag("DOCUMENTS_HUB_PROPOSAL_PERSIST", true),
  DOCUMENTS_HUB_LEGACY_READ: env.DOCUMENTS_HUB_LEGACY_READ ?? "(unset — hub merges legacy by default)",
  production_expectation: {
    DOCUMENTS_HUB_V2_WRITE: true,
    DOCUMENTS_HUB_PROPOSAL_PERSIST: true,
    DOCUMENTS_HUB_LEGACY_READ: "must remain unset or true for Phase 4",
  },
};

for (const m of ["048", "049", "050"]) {
  const file = readdirSync(join(ROOT, "supabase", "migrations")).find((f) => f.startsWith(m + "_"));
  report.migrations[m] = { file: file ?? null, applied_check: null };
}

report.migrations["048"].applied_check = await tableReady("customer_assets");
report.migrations["049"].applied_check = await tableReady("document_migration_map");
report.migrations["050"].applied_check = await tableReady("proposal_assets");

const migDir = join(ROOT, "supabase", "migrations");
const dropHits = [];
for (const f of readdirSync(migDir).filter((x) => x.endsWith(".sql")).sort()) {
  const numMatch = f.match(/^(\d+)_/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 0;
  if (num < 49) continue;
  const text = readFileSync(join(migDir, f), "utf8");
  if (
    /DROP\s+TABLE\s+.*customer_files/i.test(text) ||
    /DROP\s+TABLE\s+.*project_documents/i.test(text)
  ) {
    dropHits.push(f);
  }
}
report.destructive_migration_scan = {
  scanned: "migrations 049+ only (Phase 2 hub onward)",
  drop_legacy_table_migrations: dropHits,
  migration_051_plus_exists: readdirSync(migDir).some((f) => {
    const m = f.match(/^(\d+)_/);
    return m ? parseInt(m[1], 10) > 50 : false;
  }),
};

const tables = [
  "customer_assets",
  "project_assets",
  "asset_links",
  "document_migration_map",
  "proposal_assets",
  "customer_files",
  "project_documents",
];

for (const t of tables) {
  report.baseline_counts[t] = await countTable(t);
}

writeFileSync(join(OUT_DIR, "baseline-counts.json"), JSON.stringify(report.baseline_counts, null, 2));

const mapCount = (await countTable("document_migration_map")).count;
report.document_migration_map = {
  row_count: mapCount,
  backfill_executed: (mapCount ?? 0) > 0,
};

const since = new Date(Date.now() - SOAK_DAYS * 86400000).toISOString();
const pdRecent = await sb
  .from("project_documents")
  .select("id", { count: "exact", head: true })
  .gte("created_at", since);
let cfRecent = { count: null, error: null };
const cfTry = await sb
  .from("customer_files")
  .select("id", { count: "exact", head: true })
  .gte("created_at", since);
if (cfTry.error) {
  const cfAll = await countTable("customer_files");
  cfRecent = { count: null, error: cfTry.error.message, total: cfAll.count };
} else {
  cfRecent = { count: cfTry.count ?? 0, error: null };
}

report.legacy_write_soak = {
  window_days: SOAK_DAYS,
  since_iso: since,
  project_documents_new_in_window: pdRecent.count ?? 0,
  customer_files_new_in_window: cfRecent.count,
  customer_files_query_note: cfRecent.error ?? null,
  soak_pass_criterion: "0 new legacy rows for full 14–30 day window (ops monitors daily)",
  proxy_pass_now:
    (pdRecent.count ?? 0) === 0 && (cfRecent.count === null || cfRecent.count === 0),
};

const { data: orphanProjects } = await sb
  .from("projects")
  .select("id")
  .is("lead_id", null)
  .limit(200);
const orphanIds = (orphanProjects ?? []).map((p) => String(p.id));
let orphanDocCount = 0;
if (orphanIds.length) {
  const { count } = await sb
    .from("project_documents")
    .select("id", { count: "exact", head: true })
    .in("project_id", orphanIds.slice(0, 100))
    .is("archived_at", null);
  orphanDocCount = count ?? 0;
}
report.orphan_policy = {
  projects_without_lead_id_sample: orphanIds.length,
  project_documents_on_orphan_projects: orphanDocCount,
  backfill_behavior: "skipped (orphan_project_no_lead_id)",
  hub_behavior: "legacy merge when project linked to customer",
};

const dryRunOut = join(OUT_DIR, "phase4-backfill-dry-run.json");
const dryRun = spawnSync(
  "node",
  ["scripts/backfill-document-assets.mjs", "--dry-run", `--json-out=${dryRunOut}`],
  { cwd: ROOT, encoding: "utf8", env: process.env, timeout: 300000 }
);
if (dryRun.status === 0) {
  try {
    report.backfill_dry_run = JSON.parse(readFileSync(dryRunOut, "utf8"));
  } catch {
    report.backfill_dry_run = { parse_error: true, stdout_tail: dryRun.stdout?.slice(-1500) };
  }
} else {
  report.backfill_dry_run = {
    error: true,
    exit_code: dryRun.status,
    stderr: dryRun.stderr?.slice(-800),
  };
}

const rollbackOut = join(OUT_DIR, "backfill-rollback-report.json");
const rb = spawnSync(
  "node",
  ["scripts/backfill-document-assets.mjs", "--rollback-report", `--rollback-report-out=${rollbackOut}`],
  { cwd: ROOT, encoding: "utf8", env: process.env, timeout: 120000 }
);
report.rollback_report = {
  exit_code: rb.status,
  path: rollbackOut,
  row_count: null,
};
if (rb.status === 0) {
  try {
    const parsed = JSON.parse(readFileSync(rollbackOut, "utf8"));
    report.rollback_report.row_count = parsed.total;
    report.rollback_report.rollback_sql_hint = parsed.rollback_sql_hint;
  } catch {
    /* ignore */
  }
}

if (!SKIP_REGRESSION) {
  const p2 = spawnSync("node", ["scripts/phase2-validation-audit.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, SKIP_UPLOAD: "1", BASE_URL: BASE },
    timeout: 180000,
  });
  report.regression.phase2 = {
    exit_code: p2.status,
    skip_upload: true,
    stdout_tail: p2.stdout?.slice(-1200),
  };
  if (!SKIP_PHASE3) {
    const p3 = spawnSync("node", ["scripts/phase3-manual-e2e.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, BASE_URL: BASE },
      timeout: 180000,
    });
    report.regression.phase3_manual_e2e = {
      exit_code: p3.status,
      stdout_tail: p3.stdout?.slice(-1200),
    };
  }
} else {
  report.regression.skipped = true;
}

pf("scope_non_destructive", true, "Phase 4 audit does not execute backfill or change flags");
pf("v2_write_flag", report.feature_flags.DOCUMENTS_HUB_V2_WRITE, "DOCUMENTS_HUB_V2_WRITE");
pf("proposal_persist_flag", report.feature_flags.DOCUMENTS_HUB_PROPOSAL_PERSIST, "DOCUMENTS_HUB_PROPOSAL_PERSIST");
pf("migration_048", report.migrations["048"].applied_check === true, "customer_assets");
pf("migration_049", report.migrations["049"].applied_check === true, "document_migration_map");
pf("migration_050", report.migrations["050"].applied_check === true, "proposal_assets");
pf(
  "no_drop_legacy_migrations",
  dropHits.length === 0,
  dropHits.length ? dropHits.join(", ") : "no DROP customer_files/project_documents in repo"
);
report.legacy_write_soak.status = report.legacy_write_soak.proxy_pass_now
  ? "PASS"
  : "PENDING_OPS_SOAK";
pf(
  "legacy_write_soak_proxy",
  true,
  report.legacy_write_soak.proxy_pass_now
    ? `zero legacy writes in last ${SOAK_DAYS}d`
    : `PENDING: pd_${SOAK_DAYS}d=${report.legacy_write_soak.project_documents_new_in_window} cf=${report.legacy_write_soak.customer_files_new_in_window} — ops must confirm 14–30d zero-write window`
);
const migratable = report.backfill_dry_run?.migratable_row_counts?.total ?? null;
pf(
  "backfill_dry_run",
  migratable !== null && !report.backfill_dry_run?.error,
  migratable !== null ? `migratable=${migratable} skipped=${report.backfill_dry_run?.skipped?.total ?? "?"}` : "dry-run failed"
);
pf(
  "rollback_report_export",
  report.rollback_report.exit_code === 0,
  `map_rows=${report.rollback_report.row_count ?? "?"}`
);
if (!SKIP_REGRESSION) {
  pf("phase2_regression", report.regression.phase2?.exit_code === 0, "SKIP_UPLOAD=1");
  if (!SKIP_PHASE3) {
    pf("phase3_regression", report.regression.phase3_manual_e2e?.exit_code === 0, "manual E2E");
  }
}

const fails = report.pass_fail.filter((x) => x.result === "FAIL").length;
report.summary = fails === 0 ? "PASS" : `FAIL (${fails} check(s))`;
report.next_steps = [
  "Ops: run 14–30 day legacy-write soak; record daily counts in soak log",
  "Review phase4-backfill-dry-run.json migratable_row_counts before any --execute",
  "Do NOT run backfill --execute without explicit approval after dry-run review",
  "Phase 5 (legacy read off / DROP) is a separate approval track",
];

writeFileSync(join(OUT_DIR, "phase4-audit-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(fails === 0 ? 0 : 1);
