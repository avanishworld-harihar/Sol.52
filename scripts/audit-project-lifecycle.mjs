/**
 * Read-only project lifecycle audit. Use --apply only for safe, idempotent repairs.
 * Run: node scripts/audit-project-lifecycle.mjs
 * Fix: node scripts/audit-project-lifecycle.mjs --apply
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function envLocal() {
  const out = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = /^([^#=]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    out[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

const env = envLocal();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const apply = process.argv.includes("--apply");
const { data: projects, error } = await db.from("projects").select("*").limit(20000);
if (error) throw error;

const demos = projects.filter((p) =>
  String(p.detail ?? "").includes("ui-preview-demo") ||
  String(p.official_name ?? p.customer_name ?? "").startsWith("[Preview]") ||
  /^UIPREV-/i.test(String(p.project_code ?? ""))
);
const completedButHidden = projects.filter((p) =>
  !p.archived_at && p.dashboard_visible === false &&
  (p.current_stage === "completed" || p.stage_status === "done" || p.actual_completion)
);
const completedLeadIds = [...new Set(projects
  .filter((p) => p.lead_id && !p.archived_at && (p.current_stage === "completed" || p.stage_status === "done" || p.actual_completion))
  .map((p) => String(p.lead_id)))];
const { data: completedLeads, error: leadsError } = completedLeadIds.length
  ? await db.from("leads").select("id, name, status").in("id", completedLeadIds)
  : { data: [], error: null };
if (leadsError) throw leadsError;
const completedLeadMismatches = (completedLeads ?? []).filter((lead) =>
  String(lead.status ?? "").trim().toLowerCase() !== "won"
);
const duplicateOperational = Object.entries(
  projects.filter((p) => p.lead_id && !p.archived_at && p.record_type !== "draft")
    .reduce((acc, p) => ((acc[p.lead_id] = [...(acc[p.lead_id] ?? []), p.id]), acc), {})
).filter(([, ids]) => ids.length > 1);

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  total: projects.length,
  demo_projects: demos.map((p) => p.id),
  completed_but_hidden: completedButHidden.map((p) => p.id),
  completed_leads_not_won: completedLeadMismatches,
  duplicate_operational_leads: duplicateOperational,
}, null, 2));

if (apply && completedButHidden.length > 0) {
  const ids = completedButHidden.map((p) => p.id);
  const repair = {
    current_stage: "completed",
    stage_status: "done",
    status: "done",
    install_progress: 100,
    actual_completion: completedButHidden.length === 1
      ? String(completedButHidden[0].updated_at ?? new Date().toISOString()).slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    dashboard_visible: true,
    record_type: "operational",
    updated_at: new Date().toISOString(),
  };
  let repairError = null;
  for (let guard = 0; guard < 5; guard++) {
    const result = await db.from("projects").update(repair).in("id", ids);
    repairError = result.error;
    if (!repairError) break;
    const missing = /Could not find the '([^']+)' column/i.exec(repairError.message)?.[1];
    if (!missing || !(missing in repair)) break;
    delete repair[missing];
  }
  if (repairError) throw repairError;
  console.log("repaired completed projects:", ids.length);
}

if (apply && completedLeadMismatches.length > 0) {
  const leadIds = completedLeadMismatches.map((lead) => lead.id);
  let leadRepair = { status: "won", updated_at: new Date().toISOString() };
  let leadRepairError = null;
  for (let guard = 0; guard < 3; guard++) {
    const result = await db.from("leads").update(leadRepair).in("id", leadIds);
    leadRepairError = result.error;
    if (!leadRepairError) break;
    const missing = /Could not find the '([^']+)' column/i.exec(leadRepairError.message)?.[1];
    if (!missing || !(missing in leadRepair)) break;
    delete leadRepair[missing];
  }
  if (leadRepairError) throw leadRepairError;
  console.log("repaired completed CRM leads:", leadIds.length);
}
