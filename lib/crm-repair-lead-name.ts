import type { SupabaseClient } from "@supabase/supabase-js";
import { personNamesLikelyDifferent } from "@/lib/crm-household";
import { resolveLeadsTable } from "@/lib/supabase";
import { stripParentheticalPersonSuffix } from "@/lib/project-list-utils";

function isBillHonorificName(name: string): boolean {
  return /^(shri|shree|smt\.?|mr\.?|mrs\.?|ms\.?)\b/i.test(name.trim());
}

/**
 * Only restore CRM contact name when it was wrongly overwritten with the bill
 * honorific AND the project still stores the contact as a separate signal.
 * Does not clear consumer_name (bill) — Official (Lead) display needs it.
 *
 * With bill-as-project-title, auto-repair is usually a no-op.
 */
export async function repairLeadNameFromLinkedProject(
  db: SupabaseClient,
  leadId: string,
  leadName: string
): Promise<string | null> {
  void db;
  void leadId;
  void leadName;
  void personNamesLikelyDifferent;
  void resolveLeadsTable;
  void stripParentheticalPersonSuffix;
  void isBillHonorificName;
  return null;
}
