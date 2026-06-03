/**
 * Remove duplicate project_documents on Bharti project (keep oldest per filename).
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const text = readFileSync(".env.local", "utf8");
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

const BHARTI_PROJECT = "3cfd6369-4d9a-45d3-8c90-008de6c62a46";
const env = { ...loadEnvLocal(), ...process.env };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: rows } = await sb
  .from("project_documents")
  .select("id, filename, created_at")
  .eq("project_id", BHARTI_PROJECT)
  .is("archived_at", null)
  .order("created_at", { ascending: true });

const byName = new Map();
const toDelete = [];
for (const r of rows ?? []) {
  const name = r.filename;
  if (!byName.has(name)) {
    byName.set(name, r.id);
    continue;
  }
  toDelete.push(r.id);
}

for (const id of toDelete) {
  await sb.from("project_documents").delete().eq("id", id);
  console.log("Deleted duplicate", id);
}

console.log("Remaining:", byName.size, "unique filenames");
