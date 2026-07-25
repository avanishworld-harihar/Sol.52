import { isSyntheticCrmCustomerName } from "@/lib/crm-synthetic-names";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { resolveLeadsTable, supabase } from "@/lib/supabase";

/**
 * Remove leftover "PDF Audit …" CRM rows and detach their proposals.
 * Safe: only matches synthetic audit names, never real customers.
 */
export async function purgeSyntheticCrmLeads(): Promise<{ deleted: number }> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return { deleted: 0 };
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable) return { deleted: 0 };

  const { data: rows } = await client
    .from(leadsTable)
    .select("id, name")
    .ilike("name", "PDF Audit%")
    .limit(100);

  if (!Array.isArray(rows) || rows.length === 0) return { deleted: 0 };

  let deleted = 0;
  for (const row of rows) {
    const lead = row as { id: string; name?: string | null };
    const name = String(lead.name ?? "");
    if (!isSyntheticCrmCustomerName(name)) continue;

    const { data: props } = await client
      .from("proposals")
      .select("id, ppt_input, customer_name")
      .eq("lead_id", lead.id);
    for (const p of props ?? []) {
      const prop = p as {
        id: string;
        ppt_input?: Record<string, unknown> | null;
        customer_name?: string | null;
      };
      const ppt: Record<string, unknown> = { ...(prop.ppt_input ?? {}) };
      ppt.crmProfileDismissed = true;
      ppt.crmDismissedName = String(prop.customer_name ?? name).trim() || name;
      await client
        .from("proposals")
        .update({ lead_id: null, ppt_input: ppt })
        .eq("id", prop.id);
    }

    await client.from("projects").update({ lead_id: null }).eq("lead_id", lead.id);
    const { error } = await client.from(leadsTable).delete().eq("id", lead.id);
    if (!error) deleted += 1;
  }

  return { deleted };
}
