import type { SupabaseClient } from "@supabase/supabase-js";
import { personNamesLikelyDifferent, personNamesLikelySame } from "@/lib/crm-household";
import { resolveLeadsTable } from "@/lib/supabase";

/**
 * Sync project + proposal labels after CRM edit.
 * Project main title = bill (consumer_name) when present; else contact (name).
 * Lead contact stays in brackets via UI formatPipelineDisplayName(official, lead).
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

  let billName = "";
  try {
    const leadsTable = await resolveLeadsTable();
    if (leadsTable) {
      const { data: lead } = await db
        .from(leadsTable)
        .select("name, consumer_name")
        .eq("id", leadId)
        .maybeSingle();
      billName = lead?.consumer_name != null ? String(lead.consumer_name).trim() : "";
    }
  } catch {
    /* ignore */
  }

  const projectTitle =
    billName && personNamesLikelyDifferent(billName, name) ? billName : name;

  try {
    await db
      .from("projects")
      .update({
        official_name: projectTitle,
        customer_name: projectTitle,
        updated_at: now,
      })
      .eq("lead_id", leadId);
  } catch {
    try {
      await db
        .from("projects")
        .update({ official_name: projectTitle, updated_at: now })
        .eq("lead_id", leadId);
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
      if (billName) {
        ppt.officialBillName = billName;
      }
      const deckCustomer =
        typeof ppt.customerName === "string" ? ppt.customerName.trim() : "";
      if (!deckCustomer || (prev && personNamesLikelySame(deckCustomer, prev))) {
        ppt.customerName = billName || name;
      }
      const propCustomer = String(p.customer_name ?? "").trim();
      const nextCustomerName =
        billName ||
        (!propCustomer || (prev && personNamesLikelySame(propCustomer, prev)) ? name : propCustomer);

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

/** After consumer_name (bill) changes, refresh project main title. */
export async function propagateLeadBillNameChange(
  db: SupabaseClient,
  leadId: string,
  contactName: string,
  billName: string | null
): Promise<void> {
  const contact = contactName.trim();
  const bill = (billName ?? "").trim();
  const projectTitle =
    bill && (!contact || personNamesLikelyDifferent(bill, contact)) ? bill : contact || bill;
  if (!leadId || !projectTitle) return;
  const now = new Date().toISOString();
  try {
    await db
      .from("projects")
      .update({
        official_name: projectTitle,
        customer_name: projectTitle,
        updated_at: now,
      })
      .eq("lead_id", leadId);
  } catch {
    try {
      await db
        .from("projects")
        .update({ official_name: projectTitle, updated_at: now })
        .eq("lead_id", leadId);
    } catch {
      /* ignore */
    }
  }
}
