/**
 * Apply migration 050 when SUPABASE_DB_URL or DATABASE_URL is set in .env.local
 * Format: postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "../supabase/migrations/050_proposal_assets.sql"), "utf8");

const env = {};
readFileSync(".env.local", "utf8")
  .split(/\r?\n/)
  .forEach((l) => {
    const t = l.trim();
    if (!t || t[0] === "#") return;
    const i = t.indexOf("=");
    if (i <= 0) return;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  });

const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;
if (!dbUrl) {
  console.error("Set SUPABASE_DB_URL in .env.local to apply migration 050");
  process.exit(1);
}

const postgres = (await import("postgres")).default;
const sqlClient = postgres(dbUrl, { max: 1 });
try {
  await sqlClient.unsafe(sql);
  console.log("Migration 050 applied");
} finally {
  await sqlClient.end();
}
