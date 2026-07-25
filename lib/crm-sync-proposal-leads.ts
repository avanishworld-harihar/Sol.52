import { personNamesLikelyDifferent, personNamesLikelySame } from "@/lib/crm-household";
import { isSyntheticCrmCustomerName } from "@/lib/crm-synthetic-names";
import { normalizeLeadPhoneForStorage } from "@/lib/lead-phone";
import { processInboundLead } from "@/lib/inbound-leads";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { findLeadsByPhone, resolveLeadsTable, supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

/**
 * A CRM lead "is" the proposal person only when the contact `name` matches.
 * Never treat `consumer_name` (bill holder) as identity — that is how Bharti's
 * lead wrongly "covered" Rajesh's proposal and hid him from Customers.
 */
function leadIsProposalPerson(
  lead: { name?: unknown },
  proposalName: string
): boolean {
  return personNamesLikelySame(String(lead.name ?? ""), proposalName);
}

function readCaFromPpt(ppt: Record<string, unknown>): string | null {
  for (const key of ["consumerId", "consumer_id", "caNumber", "ca_number"] as const) {
    const v = ppt[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Ensure every proposal's visible customer name has a CRM lead/profile.
 * If the proposal is linked to someone else (e.g. Bharti) but shows
 * "SHRI RAJESH…", create/find Rajesh as a household sibling and relink.
 * Move CA / bill fields off the wrong lead onto Rajesh.
 */
export async function syncMissingHouseholdLeadsFromProposals(): Promise<{
  created: number;
  relinked: number;
  cleaned: number;
}> {
  const client = db();
  if (!client) return { created: 0, relinked: 0, cleaned: 0 };
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable) return { created: 0, relinked: 0, cleaned: 0 };

  const { data: proposals, error } = await client
    .from("proposals")
    .select("id, customer_name, lead_id, ppt_input")
    .order("generated_at", { ascending: false })
    .limit(200);

  if (error || !Array.isArray(proposals)) return { created: 0, relinked: 0, cleaned: 0 };

  let created = 0;
  let relinked = 0;
  let cleaned = 0;

  for (const row of proposals) {
    const proposal = row as {
      id: string;
      customer_name?: string | null;
      lead_id?: string | null;
      ppt_input?: Record<string, unknown> | null;
    };
    const customerName = String(proposal.customer_name ?? "").trim();
    if (customerName.length < 2) continue;

    const ppt = { ...(proposal.ppt_input ?? {}) } as Record<string, unknown>;

    /**
     * Audit/script proposals (PDF Audit …) must never spawn Customers leads.
     * Mark dismissed so delete stays sticky even if an old lead row lingered.
     */
    if (isSyntheticCrmCustomerName(customerName)) {
      if (ppt.crmProfileDismissed !== true) {
        ppt.crmProfileDismissed = true;
        ppt.crmDismissedName = customerName;
        await client
          .from("proposals")
          .update({ lead_id: null, ppt_input: ppt })
          .eq("id", proposal.id);
      } else if (proposal.lead_id) {
        await client.from("proposals").update({ lead_id: null }).eq("id", proposal.id);
      }
      continue;
    }

    /** Operator deleted this CRM profile — do not recreate on every Customers refresh. */
    if (ppt.crmProfileDismissed === true) continue;
    const dismissedName =
      typeof ppt.crmDismissedName === "string" ? ppt.crmDismissedName.trim() : "";
    if (dismissedName && personNamesLikelySame(dismissedName, customerName)) continue;

    const phoneRaw =
      (typeof ppt.leadPhone === "string" && ppt.leadPhone) ||
      (typeof ppt.customerPhone === "string" && ppt.customerPhone) ||
      (typeof ppt.phone === "string" && ppt.phone) ||
      "";
    let phone = normalizeLeadPhoneForStorage(phoneRaw);
    const caFromPpt = readCaFromPpt(ppt);
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

    if (!phone && linkedLead?.phone != null) {
      phone = normalizeLeadPhoneForStorage(String(linkedLead.phone));
    }

    /** CA / bill fields to move off a wrongly merged contact lead. */
    let movedCa: string | null = caFromPpt;
    let movedMonthly = 0;

    /** Already on the correct person's lead. */
    if (linkedLead && leadIsProposalPerson(linkedLead, proposalPersonName)) {
      if (caFromPpt && !String(linkedLead.consumer_id ?? "").trim()) {
        await client
          .from(leadsTable)
          .update({ consumer_id: caFromPpt })
          .eq("id", String(linkedLead.id));
      }
      continue;
    }

    /**
     * Wrong lead (e.g. Bharti) has Rajesh stuck as bill/CA because phones match.
     * Strip those fields from the contact lead — they belong on Rajesh's row.
     */
    if (linkedLead) {
      const wrongConsumer = String(linkedLead.consumer_name ?? "").trim();
      const wrongCa = String(linkedLead.consumer_id ?? "").trim();
      const strip: Record<string, unknown> = {};
      if (
        wrongConsumer &&
        personNamesLikelySame(wrongConsumer, proposalPersonName) &&
        personNamesLikelyDifferent(String(linkedLead.name ?? ""), proposalPersonName)
      ) {
        strip.consumer_name = null;
        if (!movedCa && wrongCa) movedCa = wrongCa;
        const mb = Number(linkedLead.monthly_bill ?? 0) || 0;
        if (mb > 0) movedMonthly = mb;
      }
      if (wrongCa && movedCa && wrongCa.replace(/\s/g, "").toLowerCase() === movedCa.replace(/\s/g, "").toLowerCase()) {
        strip.consumer_id = null;
      } else if (wrongCa && strip.consumer_name === null) {
        strip.consumer_id = null;
        if (!movedCa) movedCa = wrongCa;
      }
      if (Object.keys(strip).length > 0) {
        await client.from(leadsTable).update(strip).eq("id", String(linkedLead.id));
        cleaned += 1;
      }
    }

    const tokens = proposalPersonName
      .split(/\s+/)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
      .filter((t) => t.length >= 2)
      .slice(-2);
    if (tokens.length === 0) continue;

    const { data: byName } = await client
      .from(leadsTable)
      .select("id, name, consumer_name, phone, household_id, consumer_id")
      .ilike("name", `%${tokens.join("%")}%`)
      .limit(30);

    const nameHit = Array.isArray(byName)
      ? (byName as Record<string, unknown>[]).find((l) =>
          leadIsProposalPerson(l, proposalPersonName)
        )
      : undefined;

    const assignBillFields = async (billLeadId: string) => {
      const patch: Record<string, unknown> = { consumer_name: null };
      if (movedCa) patch.consumer_id = movedCa;
      if (movedMonthly > 0) patch.monthly_bill = movedMonthly;
      if (Object.keys(patch).length > 1 || movedCa) {
        await client.from(leadsTable).update(patch).eq("id", billLeadId);
      }
      /** Any other lead holding this CA (e.g. N1906017048 on Bharti) must release it. */
      if (movedCa) {
        const caNorm = movedCa.replace(/\s/g, "").toLowerCase();
        const { data: caHolders } = await client
          .from(leadsTable)
          .select("id, name, consumer_id")
          .limit(80);
        for (const row of caHolders ?? []) {
          const holder = row as Record<string, unknown>;
          const hid = String(holder.id ?? "");
          if (!hid || hid === billLeadId) continue;
          const hCa = String(holder.consumer_id ?? "")
            .replace(/\s/g, "")
            .toLowerCase();
          if (!hCa || (hCa !== caNorm && !hCa.endsWith(caNorm) && !caNorm.endsWith(hCa))) {
            continue;
          }
          if (!personNamesLikelyDifferent(String(holder.name ?? ""), proposalPersonName)) continue;
          await client
            .from(leadsTable)
            .update({ consumer_id: null, consumer_name: null })
            .eq("id", hid);
          cleaned += 1;
        }
      }
    };

    /** Also strip Rajesh bill/CA from any other same-phone contact leads. */
    const scrubPeers = async (exceptId: string) => {
      if (!phone) return;
      const peers = await findLeadsByPhone(phone);
      for (const peer of peers) {
        const pid = String(peer.id ?? "");
        if (!pid || pid === exceptId) continue;
        if (!personNamesLikelyDifferent(String(peer.name ?? ""), proposalPersonName)) continue;
        const peerConsumer = String(peer.consumer_name ?? "").trim();
        const peerCa = String(peer.consumer_id ?? "").trim();
        const scrub: Record<string, unknown> = {};
        if (peerConsumer && personNamesLikelySame(peerConsumer, proposalPersonName)) {
          scrub.consumer_name = null;
          if (!movedCa && peerCa) movedCa = peerCa;
        }
        if (
          peerCa &&
          movedCa &&
          peerCa.replace(/\s/g, "").toLowerCase() === movedCa.replace(/\s/g, "").toLowerCase()
        ) {
          scrub.consumer_id = null;
        } else if (peerCa && scrub.consumer_name === null) {
          scrub.consumer_id = null;
          if (!movedCa) movedCa = peerCa;
        }
        if (Object.keys(scrub).length > 0) {
          await client.from(leadsTable).update(scrub).eq("id", pid);
          cleaned += 1;
        }
      }
    };

    if (nameHit?.id) {
      const billLeadId = String(nameHit.id);
      if (proposal.lead_id !== billLeadId) {
        await client.from("proposals").update({ lead_id: billLeadId }).eq("id", proposal.id);
        relinked += 1;
      }
      await scrubPeers(billLeadId);
      await assignBillFields(billLeadId);
      continue;
    }

    /** No CRM profile for this proposal person yet → create one (household if same phone). */
    try {
      const monthlyFromLinked = movedMonthly || Number(linkedLead?.monthly_bill ?? 0) || 0;
      const result = await processInboundLead({
        name: proposalPersonName,
        phone: phone || "",
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
        monthly_bill: monthlyFromLinked > 0 ? monthlyFromLinked : 0,
        consumer_id: movedCa,
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
      await scrubPeers(newId);
      await assignBillFields(newId);
    } catch (err) {
      console.warn("[syncMissingHouseholdLeadsFromProposals]", proposal.id, err);
    }
  }

  return { created, relinked, cleaned };
}
