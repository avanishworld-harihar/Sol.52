import type { SupabaseClient } from "@supabase/supabase-js";
import { personNamesLikelySame } from "@/lib/crm-household";

/**
 * When CRM lead name changes, keep Projects + Proposals titles in sync.
 */
export async function propagateLeadNameChange(
  db: SupabaseClient,
  leadId: string,
  newName: string,
  previousName?: string | null
): Promise<void> {
  const name = newName.trim();
  if (!leadId || !name) return;
  const prev = (previousName ?? "").trim();
  const now = new Date().toISOString();

  try {
    await db
      .from("projects")
      .update({
        official_name: name,
        customer_name: name,
        updated_at: now,
      })
      .eq("lead_id", leadId);
  } catch {
    try {
      await db.from("projects").update({ official_name: name, updated_at: now }).eq("lead_id", leadId);
    } catch {
      /* ignore */
    }
  }

  try {
    const { data: props } = await db
      .from("proposals")
      .select("id, customer_name, ppt_input")
      .eq("lead_id", leadId);

    for (const row of props ?? []) {
      const p = row as {
        id: string;
        customer_name?: string | null;
        ppt_input?: Record<string, unknown> | null;
      };
      const ppt = { ...(p.ppt_input ?? {}) };
      ppt.leadContactName = name;
      /** Update deck customerName only when it matched the old CRM name (or empty). */
      const deckCustomer =
        typeof ppt.customerName === "string" ? ppt.customerName.trim() : "";
      if (!deckCustomer || (prev && personNamesLikelySame(deckCustomer, prev))) {
        ppt.customerName = name;
      }
      const propCustomer = String(p.customer_name ?? "").trim();
      const nextCustomerName =
        !propCustomer || (prev && personNamesLikelySame(propCustomer, prev)) ? name : propCustomer;

      await db
        .from("proposals")
        .update({
          customer_name: nextCustomerName,
          ppt_input: ppt,
        })
        .eq("id", p.id);
    }
  } catch (err) {
    console.warn("[propagateLeadNameChange] proposals:", err);
  }
}
