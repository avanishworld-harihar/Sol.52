import { personNamesLikelyDifferent, personNamesLikelySame } from "@/lib/crm-household";
import { normalizeLeadPhoneForStorage } from "@/lib/lead-phone";
import { processInboundLead } from "@/lib/inbound-leads";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { resolveLeadsTable, supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function leadCoversProposalName(
  lead: { name?: unknown; consumer_name?: unknown },
  proposalName: string
): boolean {
  const leadName = String(lead.name ?? "");
  const consumer = String(lead.consumer_name ?? "");
  if (personNamesLikelySame(leadName, proposalName)) return true;
  if (consumer && personNamesLikelySame(consumer, proposalName)) return true;
  return false;
}

export async function syncMissingHouseholdLeadsFromProposals(): Promise<{
  created: number;
  relinked: number;
}> {
  const client = db();
  if (!client) return { created: 0, relinked: 0 };
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable) return { created: 0, relinked: 0 };

  const { data: proposals, error } = await client
    .from("proposals")
    .select("id, customer_name, lead_id, ppt_input")
    .order("generated_at", { ascending: false })
    .limit(150);

  if (error || !Array.isArray(proposals)) return { created: 0, relinked: 0 };

  let created = 0;
  let relinked = 0;

  for (const row of proposals) {
    const proposal = row as {
      id: string;
      customer_name?: string | null;
      lead_id?: string | null;
      ppt_input?: Record<string, unknown> | null;
    };
    const customerName = String(proposal.customer_name ?? "").trim();
    if (customerName.length < 2) continue;

    const ppt = proposal.ppt_input ?? {};
    const phoneRaw =
      (typeof ppt.leadPhone === "string" && ppt.leadPhone) ||
      (typeof ppt.customerPhone === "string" && ppt.customerPhone) ||
      (typeof ppt.phone === "string" && ppt.phone) ||
      "";
    const phone = normalizeLeadPhoneForStorage(phoneRaw);
    const pptLeadName =
      (typeof ppt.leadContactName === "string" && ppt.leadContactName.trim()) ||
      (typeof ppt.contactName === "string" && ppt.contactName.trim()) ||
      "";
    const pptBillName =
      (typeof ppt.officialBillName === "string" && ppt.officialBillName.trim()) ||
      (typeof ppt.customerName === "string" && ppt.customerName.trim()) ||
      customerName;

    let linkedLead: Record<string, unknown> | null = null;
    if (proposal.lead_id) {
      const { data } = await client
        .from(leadsTable)
        .select("*")
        .eq("id", proposal.lead_id)
        .maybeSingle();
      linkedLead = (data as Record<string, unknown> | null) ?? null;
    }

    if (linkedLead && leadCoversProposalName(linkedLead, customerName)) {
      const leadName = String(linkedLead.name ?? "");
      if (
        pptBillName &&
        personNamesLikelyDifferent(leadName, pptBillName) &&
        !String(linkedLead.consumer_name ?? "").trim()
      ) {
        await client
          .from(leadsTable)
          .update({ consumer_name: pptBillName })
          .eq("id", String(linkedLead.id));
      }
      continue;
    }

    if (linkedLead && pptLeadName && leadCoversProposalName(linkedLead, pptLeadName)) {
      if (
        pptBillName &&
        personNamesLikelyDifferent(String(linkedLead.name ?? ""), pptBillName)
      ) {
        await client
          .from(leadsTable)
          .update({ consumer_name: pptBillName })
          .eq("id", String(linkedLead.id));
      }
      continue;
    }

    const { data: byName } = await client
      .from(leadsTable)
      .select("id, name, consumer_name, phone, household_id")
      .ilike("name", `%${customerName.split(/\s+/).slice(-2).join("%")}%`)
      .limit(20);
    const nameHit = Array.isArray(byName)
      ? (byName as Record<string, unknown>[]).find((l) => leadCoversProposalName(l, customerName))
      : undefined;

    if (nameHit?.id) {
      if (proposal.lead_id !== nameHit.id) {
        await client.from("proposals").update({ lead_id: nameHit.id }).eq("id", proposal.id);
        relinked += 1;
      }
      continue;
    }

    try {
      const friendlyName = pptLeadName || customerName;
      const consumerName =
        pptBillName && personNamesLikelyDifferent(friendlyName, pptBillName) ? pptBillName : null;
      const result = await processInboundLead({
        name: friendlyName,
        phone: phone || (linkedLead?.phone != null ? String(linkedLead.phone) : ""),
        city:
          (typeof ppt.city === "string" && ppt.city) ||
          (linkedLead?.city != null ? String(linkedLead.city) : "") ||
          "Unknown",
        state:
          (typeof ppt.state === "string" && ppt.state) ||
          (linkedLead?.state != null ? String(linkedLead.state) : null),
        discom:
          (typeof ppt.discom === "string" && ppt.discom) ||
          (linkedLead?.discom != null ? String(linkedLead.discom) : "") ||
          "Unknown",
        monthly_bill: 0,
        source: "manual",
        forceNew: true,
        isWhatsappContact: false,
        consumerName,
      });
      const newId = String(result.data.id ?? "");
      if (!newId) continue;
      created += 1;
      await client.from("proposals").update({ lead_id: newId }).eq("id", proposal.id);
      relinked += 1;
    } catch (err) {
      console.warn("[syncMissingHouseholdLeadsFromProposals]", proposal.id, err);
    }
  }

  return { created, relinked };
}
