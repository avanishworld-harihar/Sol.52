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

/**
 * Ensure every proposal's visible customer name has a CRM lead/profile.
 * If the proposal is linked to someone else (e.g. Bharti) but shows
 * "SHRI RAJESH…", create/find Rajesh as a household sibling and relink.
 */
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

    /** Name shown on the proposal = the person who needs a Customers profile. */
    const proposalPersonName = customerName;

    let linkedLead: Record<string, unknown> | null = null;
    if (proposal.lead_id) {
      const { data } = await client
        .from(leadsTable)
        .select("*")
        .eq("id", proposal.lead_id)
        .maybeSingle();
      linkedLead = (data as Record<string, unknown> | null) ?? null;
    }

    if (linkedLead && leadCoversProposalName(linkedLead, proposalPersonName)) {
      continue;
    }

    /** Clear wrong bill/husband name stuck on another person's lead. */
    if (
      linkedLead &&
      String(linkedLead.consumer_name ?? "").trim() &&
      personNamesLikelySame(String(linkedLead.consumer_name), proposalPersonName) &&
      personNamesLikelyDifferent(String(linkedLead.name ?? ""), proposalPersonName)
    ) {
      await client
        .from(leadsTable)
        .update({ consumer_name: null })
        .eq("id", String(linkedLead.id));
    }

    const tokens = proposalPersonName
      .split(/\s+/)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
      .filter((t) => t.length >= 2)
      .slice(-2);
    if (tokens.length === 0) continue;

    const { data: byName } = await client
      .from(leadsTable)
      .select("id, name, consumer_name, phone, household_id")
      .ilike("name", `%${tokens.join("%")}%`)
      .limit(30);

    let nameHit = Array.isArray(byName)
      ? (byName as Record<string, unknown>[]).find((l) =>
          leadCoversProposalName(l, proposalPersonName)
        )
      : undefined;

    if (!nameHit) {
      const { data: byConsumer } = await client
        .from(leadsTable)
        .select("id, name, consumer_name, phone, household_id")
        .ilike("consumer_name", `%${tokens.join("%")}%`)
        .limit(30);
      nameHit = Array.isArray(byConsumer)
        ? (byConsumer as Record<string, unknown>[]).find((l) =>
            leadCoversProposalName(l, proposalPersonName)
          )
        : undefined;
    }

    if (nameHit?.id) {
      if (proposal.lead_id !== nameHit.id) {
        await client.from("proposals").update({ lead_id: nameHit.id }).eq("id", proposal.id);
        relinked += 1;
      }
      continue;
    }

    /** No CRM profile for this proposal person yet → create one (household if same phone). */
    try {
      const result = await processInboundLead({
        name: proposalPersonName,
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
        source_meta: {
          synced_from_proposal: proposal.id,
          reason: "proposal_customer_needs_crm_profile",
        },
      });
      const newId = String(result.data.id ?? "");
      if (!newId) continue;
      created += 1;
      if (proposal.lead_id !== newId) {
        await client.from("proposals").update({ lead_id: newId }).eq("id", proposal.id);
        relinked += 1;
      }
    } catch (err) {
      console.warn("[syncMissingHouseholdLeadsFromProposals]", proposal.id, err);
    }
  }

  return { created, relinked };
}
