import type { SupabaseClient } from "@supabase/supabase-js";
import { personNamesLikelyDifferent } from "@/lib/crm-household";
import { resolveLeadsTable } from "@/lib/supabase";
import { stripParentheticalPersonSuffix } from "@/lib/project-list-utils";

function isBillHonorificName(name: string): boolean {
  return /^(shri|shree|smt\.?|mr\.?|mrs\.?|ms\.?)\b/i.test(name.trim());
}

/**
 * Restore CRM lead.name when it was overwritten by a bill/husband honorific,
 * using the linked project's contact-style title (e.g. "bharti gupta").
 */
export async function repairLeadNameFromLinkedProject(
  db: SupabaseClient,
  leadId: string,
  leadName: string,
  opts?: { clearForeignConsumer?: boolean }
): Promise<string | null> {
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable || !leadId.trim()) return null;

  const { data: project } = await db
    .from("projects")
    .select("id, official_name, customer_name")
    .eq("lead_id", leadId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const projectTitle = stripParentheticalPersonSuffix(
    String(project?.official_name || project?.customer_name || "")
  );
  if (projectTitle.length < 2) return null;

  const current = leadName.trim();
  const honorific = isBillHonorificName(current);
  const mismatched =
    honorific && personNamesLikelyDifferent(current, projectTitle);

  if (!mismatched && current.toLowerCase() === projectTitle.toLowerCase()) {
    return null;
  }

  if (!mismatched) return null;

  const patch: Record<string, unknown> = { name: projectTitle };
  if (opts?.clearForeignConsumer !== false) {
    /** Don't keep husband/bill name as consumer on this person's CRM row. */
    patch.consumer_name = null;
  }

  await db.from(leadsTable).update(patch).eq("id", leadId);
  return projectTitle;
}
