/**
 * Remove automated QA projects from the active /projects list.
 * Created by scripts/verify-documents-3a51.mjs during Wave 3A-5.1 testing.
 *
 * Usage (load .env.local first):
 *   node scripts/cleanup-3a51-doc-test-projects.mjs
 *
 * Optional: DRY_RUN=1 to only print matches.
 */
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.env.DRY_RUN === "1";
const PREFIX = "3A51 Doc Test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: rows, error } = await admin
  .from("projects")
  .select("id, official_name, customer_name, created_at")
  .is("archived_at", null)
  .or(`official_name.ilike.${PREFIX}%,customer_name.ilike.${PREFIX}%`);

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

const matches = (rows ?? []).filter((r) => {
  const n = `${r.official_name ?? ""} ${r.customer_name ?? ""}`;
  return n.includes(PREFIX);
});

if (matches.length === 0) {
  console.log("No active 3A51 Doc Test projects found.");
  process.exit(0);
}

console.log(`Found ${matches.length} test project(s):`);
for (const p of matches) {
  console.log(`  - ${p.id}  ${p.official_name ?? p.customer_name ?? "(no name)"}`);
}

if (DRY_RUN) {
  console.log("DRY_RUN=1 — no changes made.");
  process.exit(0);
}

const now = new Date().toISOString();
for (const p of matches) {
  const { error: upErr } = await admin
    .from("projects")
    .update({ archived_at: now, dashboard_visible: false, updated_at: now })
    .eq("id", p.id);
  if (upErr) {
    console.error(`Failed to archive ${p.id}:`, upErr.message);
  } else {
    console.log(`Archived ${p.id}`);
  }
}

console.log("Done. Refresh /projects — only real projects (e.g. bharti gupta) should remain.");
