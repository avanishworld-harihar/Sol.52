/**
 * Remove UI preview demo rows (seed-ui-preview-projects.mjs).
 * Run: node scripts/cleanup-ui-preview-projects.mjs
 * Dry run: node scripts/cleanup-ui-preview-projects.mjs --dry-run
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TAG = "ui-preview-demo";
const DRY_RUN = process.argv.includes("--dry-run");

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

function isPreviewProject(row) {
  const detail = String(row.detail ?? "");
  if (detail.includes(TAG)) return true;
  const code = String(row.project_code ?? "");
  if (/^UIPREV-\d{6}-\d{2}$/.test(code)) return true;
  const name = String(row.official_name ?? row.customer_name ?? "");
  if (name.startsWith("[Preview]")) return true;
  return false;
}

function isPreviewLead(row) {
  const name = String(row.name ?? "").trim();
  return name.startsWith("[Preview]");
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: projects, error: projErr } = await admin.from("projects").select("*").limit(500);
  if (projErr) {
    console.error("projects fetch failed:", projErr.message);
    process.exit(1);
  }

  const previewProjects = (projects ?? []).filter(isPreviewProject);
  const previewLeadIds = new Set(
    previewProjects.map((p) => (p.lead_id != null ? String(p.lead_id) : "")).filter(Boolean)
  );

  console.log(DRY_RUN ? "[dry-run]" : "[delete]", "preview projects:", previewProjects.length);

  if (!DRY_RUN) {
    for (const p of previewProjects) {
      const { error } = await admin.from("projects").delete().eq("id", p.id);
      if (error) console.warn("delete project", p.id, error.message);
      else console.log("deleted project", p.project_code ?? p.id);
    }
  } else {
    for (const p of previewProjects) {
      console.log("would delete project", p.project_code ?? p.id);
    }
  }

  let leadsTable = "leads";
  const probe = await admin.from("leads").select("id").limit(1);
  if (probe.error) {
    const probe2 = await admin.from("customers").select("id").limit(1);
    if (!probe2.error) leadsTable = "customers";
  }

  const { data: leads } = await admin.from(leadsTable).select("*").limit(500);
  const previewLeads = (leads ?? []).filter(
    (l) => isPreviewLead(l) || previewLeadIds.has(String(l.id))
  );

  console.log(DRY_RUN ? "[dry-run]" : "[delete]", "preview customers:", previewLeads.length);

  if (!DRY_RUN) {
    for (const l of previewLeads) {
      const { error } = await admin.from(leadsTable).delete().eq("id", l.id);
      if (error) console.warn("delete lead", l.id, error.message);
      else console.log("deleted customer", l.name);
    }
  } else {
    for (const l of previewLeads) {
      console.log("would delete customer", l.name);
    }
  }

  console.log("\nCleanup complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
