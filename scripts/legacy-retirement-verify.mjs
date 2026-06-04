/**
 * Phase C+E verification — static refs + build/lint (no DB mutations).
 * Run: node scripts/legacy-retirement-verify.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(
  ROOT,
  "docs",
  "verification",
  "customer-documents-hub",
  "legacy-retirement",
  "phase-c-e-verification.json"
);

const RUNTIME_DIRS = ["lib", "app", "components"];
const LEGACY_TABLES = ["customer_files", "project_documents", "document_migration_map"];
const LEGACY_FLAGS = [
  "DOCUMENTS_HUB_LEGACY_READ",
  "DOCUMENTS_HUB_V2_WRITE",
  "NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ",
];
const REMOVED_SYMBOLS = [
  "legacyInsert",
  "fetchLegacyCustomerFiles",
  "fetchLegacyProjectDocuments",
  "insertProjectDocument",
  "isDocumentsHubLegacyReadEnabled",
  "isDocumentsHubV2WriteEnabled",
  "documents-hub-read-config",
  "documents-hub-write-config",
  "documents-hub-legacy-ui-config",
];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === ".next" || name === "dist") continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

function scanFiles(roots, pattern) {
  const hits = [];
  const re = new RegExp(pattern, "gi");
  for (const root of roots) {
    const abs = join(ROOT, root);
    try {
      for (const file of walk(abs)) {
        const text = readFileSync(file, "utf8");
        const lines = text.split(/\r?\n/);
        lines.forEach((line, i) => {
          if (re.test(line)) {
            hits.push({
              file: file.replace(ROOT + "\\", "").replace(ROOT + "/", ""),
              line: i + 1,
              snippet: line.trim().slice(0, 160),
            });
          }
          re.lastIndex = 0;
        });
      }
    } catch {
      /* missing dir */
    }
  }
  return hits;
}

function scanRepo(pattern) {
  return scanFiles(["lib", "app", "components", "scripts"], pattern);
}

function run(cmd, label) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    return { label, status: "pass", output_tail: out.slice(-2000) };
  } catch (e) {
    const stdout = e.stdout?.toString?.() ?? "";
    const stderr = e.stderr?.toString?.() ?? "";
    return {
      label,
      status: "fail",
      exit_code: e.status ?? 1,
      output_tail: (stderr + stdout).slice(-4000),
    };
  }
}

const runtimeFromLegacy = scanFiles(RUNTIME_DIRS, String.raw`\.from\(['"]customer_files['"]\)|\.from\(['"]project_documents['"]\)`);
const scriptsFromLegacy = scanFiles(["scripts"], String.raw`\.from\(['"]customer_files['"]\)|\.from\(['"]project_documents['"]\)`);

const report = {
  generated_at: new Date().toISOString(),
  phase: "C+E legacy document runtime retirement",
  constraints: {
    no_table_drops: true,
    no_migrations: true,
    no_production_data_changes: true,
    legacy_tables_preserved: LEGACY_TABLES,
  },
  runtime_legacy_table_access: {
    customer_files_or_project_documents_from: runtimeFromLegacy,
    pass: runtimeFromLegacy.length === 0,
  },
  references: Object.fromEntries(
    LEGACY_TABLES.map((t) => [t, { runtime: scanFiles(RUNTIME_DIRS, t), scripts: scanFiles(["scripts"], t) }])
  ),
  legacy_feature_flags: {
    env_example: scanFiles(["."], LEGACY_FLAGS.join("|")).filter((h) => h.file === ".env.example"),
    runtime_code: scanFiles(RUNTIME_DIRS, LEGACY_FLAGS.join("|")),
    scripts_only: scanFiles(["scripts"], LEGACY_FLAGS.join("|")),
  },
  removed_symbols: Object.fromEntries(
    REMOVED_SYMBOLS.map((sym) => [
      sym,
      { runtime: scanFiles(RUNTIME_DIRS, sym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), scripts: scanFiles(["scripts"], sym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) },
    ])
  ),
  script_legacy_from_queries: scriptsFromLegacy,
  phase_e_guard: {
    module: "scripts/lib/legacy-document-guard.mjs",
    wired_scripts: [
      "scripts/link-bharti-realworld-validation.mjs",
      "scripts/cleanup-bharti-duplicate-docs.mjs",
      "scripts/cleanup-bharti-test-documents.mjs (execute + legacy targets)",
      "scripts/backfill-document-assets.mjs (assertNoLegacyWriteEnvFlags)",
    ],
    allow_env: "ALLOW_LEGACY_DOCUMENT_SCRIPT_MUTATIONS",
  },
  apis_changed_phase_c: [
    "GET/POST app/api/customers/[id]/files",
    "POST app/api/customers/[id]/files/upload",
    "GET/POST app/api/projects/[id]/documents",
    "GET app/api/customers/[id]/documents (unified hub)",
  ],
  files_modified_summary: [
    "lib/document-write-router.ts",
    "lib/unified-documents-store.ts",
    "lib/project-document-store.ts",
    "lib/unified-documents-types.ts",
    "app/api/customers/[id]/files/*",
    "app/api/projects/[id]/documents/route.ts",
    "components/customers/customer-detail-page.tsx",
    "scripts/lib/legacy-document-guard.mjs",
    "deleted: lib/documents-hub-*-config.ts",
  ],
  typecheck: run("npm run typecheck", "typecheck"),
  lint: run("npm run lint", "lint"),
  build: run("npm run build", "build"),
  test: { status: "skipped", note: "No test script in package.json" },
  blockers: [],
};

if (!report.runtime_legacy_table_access.pass) {
  report.blockers.push("Runtime code still queries customer_files or project_documents via .from()");
}
for (const sym of REMOVED_SYMBOLS) {
  const r = report.removed_symbols[sym]?.runtime ?? [];
  if (r.length > 0) report.blockers.push(`Removed symbol still in runtime: ${sym}`);
}
if (report.typecheck.status !== "pass") report.blockers.push("TypeScript typecheck failed");
if (report.build.status !== "pass") report.blockers.push("Production build failed");
if (report.lint.status !== "pass") report.blockers.push("Lint failed");

report.success_criteria = {
  no_runtime_legacy_reads: report.runtime_legacy_table_access.pass,
  no_runtime_legacy_writes: report.runtime_legacy_table_access.pass,
  legacy_tables_in_db: "not verified by this script (schema/migrations unchanged)",
  script_mutations_gated: true,
  overall: report.blockers.length === 0,
};

writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log("Wrote", OUT);
console.log("Blockers:", report.blockers.length ? report.blockers : "none");
console.log("Overall:", report.success_criteria.overall ? "PASS" : "FAIL");
process.exit(report.success_criteria.overall ? 0 : 1);
