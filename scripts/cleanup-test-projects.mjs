/**
 * Remove automated QA projects (active, hidden, or archived).
 * Sources: verify-documents-3a51.mjs ("3A51 Doc Test"), other doc-hub audits.
 *
 *   node scripts/cleanup-test-projects.mjs --dry-run
 *   node scripts/cleanup-test-projects.mjs --execute
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const execute = process.argv.includes("--execute");

function loadEnvLocal() {
  try {
    const text = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
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

function isTestProject(row) {
  const name = `${row.official_name ?? ""} ${row.customer_name ?? ""}`.trim();
  if (/3A51 Doc Test/i.test(name)) return true;
  if (/phase2-audit/i.test(name)) return true;
  if (/API Smoke Test/i.test(name)) return true;
  if (/Automated verification project/i.test(row.detail ?? "")) return true;
  return false;
}

const { data: rows, error } = await sb
  .from("projects")
  .select("id, official_name, customer_name, detail, archived_at, created_at")
  .order("created_at", { ascending: false })
  .limit(500);

if (error) {
  console.error(error.message);
  process.exit(1);
}

const matches = (rows ?? []).filter(isTestProject);
const report = {
  generated_at: new Date().toISOString(),
  mode: execute ? "execute" : "dry-run",
  matches: matches.map((p) => ({
    id: p.id,
    name: p.official_name ?? p.customer_name,
    archived_at: p.archived_at,
  })),
  deleted: [],
};

console.log(`Found ${matches.length} test project(s):`);
for (const p of matches) {
  console.log(`  - ${p.id}  ${p.official_name ?? p.customer_name}  archived=${!!p.archived_at}`);
}

if (execute) {
  for (const p of matches) {
    const { error: delErr } = await sb.from("projects").delete().eq("id", p.id);
    if (delErr) {
      console.error("Delete failed", p.id, delErr.message);
    } else {
      report.deleted.push(p.id);
      console.log("Deleted", p.id);
    }
  }
} else {
  console.log("\nDry-run. Pass --execute to permanently delete these rows.");
}

const outDir = join(__dirname, "..", "docs", "verification", "customer-documents-hub", "phase5a");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "test-projects-cleanup-report.json"), JSON.stringify(report, null, 2));
