import { personNamesLikelyDifferent, personNamesLikelySame } from "@/lib/crm-household";
import { processInboundLead } from "@/lib/inbound-leads";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { resolveLeadsTable, supabase } from "@/lib/supabase";
import { stripParentheticalPersonSuffix } from "@/lib/project-list-utils";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function isBillHonorificName(name: string): boolean {
  return /^(shri|shree|smt\.?|mr\.?|mrs\.?|ms\.?)\b/i.test(name.trim());
}

/**
 * Unmerge cases like Bharti project + Rajesh bill/proposal stuck on one lead:
 * - Keep the project person on the existing lead + project
 * - Create/find the bill/proposal person as a household sibling
 * - Move matching proposals + CA (consumer_id) to that sibling
 */
export async function unmergeBillHolderFromProjectLeads(): Promise<{
  split: number;
  relinkedProposals: number;
}> {
  const client = db();
  if (!client) return { split: 0, relinkedProposals: 0 };
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable) return { split: 0, relinkedProposals: 0 };

  const { data: projects, error } = await client
    .from("projects")
    .select("id, lead_id, official_name, customer_name")
    .is("archived_at", null)
    .not("lead_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error || !Array.isArray(projects)) return { split: 0, relinkedProposals: 0 };

  let split = 0;
  let relinkedProposals = 0;

  for (const row of projects) {
    const project = row as {
      id: string;
      lead_id: string;
      official_name?: string | null;
      customer_name?: string | null;
    };
    const leadId = String(project.lead_id);
    const { data: leadRaw } = await client.from(leadsTable).select("*").eq("id", leadId).maybeSingle();
    if (!leadRaw) continue;
    const lead = leadRaw as Record<string, unknown>;

    const projectTitle = stripParentheticalPersonSuffix(
      String(project.official_name || project.customer_name || "")
    );
    const leadName = String(lead.name ?? "").trim();
    const consumerName = String(lead.consumer_name ?? "").trim();

    let projectPerson = projectTitle.length >= 2 ? projectTitle : leadName;
    let billPerson = "";

    /** Case: name=contact, consumer=husband/bill */
    if (
      consumerName &&
      personNamesLikelyDifferent(leadName, consumerName) &&
      (!projectTitle ||
        personNamesLikelySame(leadName, projectTitle) ||
        personNamesLikelySame(projectTitle, leadName))
    ) {
      projectPerson = projectTitle || leadName;
      billPerson = consumerName;
    }

    /** Case: lead.name overwritten to bill honorific, project still has contact title */
    if (
      !billPerson &&
      projectTitle &&
      leadName &&
      isBillHonorificName(leadName) &&
      personNamesLikelyDifferent(leadName, projectTitle)
    ) {
      projectPerson = projectTitle;
      billPerson = leadName;
    }

    if (!billPerson || !projectPerson || !personNamesLikelyDifferent(projectPerson, billPerson)) {
      continue;
    }

    const monthlyBill = Number(lead.monthly_bill ?? 0) || 0;
    const phone = lead.phone != null ? String(lead.phone) : "";
    const city = String(lead.city ?? "Unknown") || "Unknown";
    const state = lead.state != null ? String(lead.state) : null;
    const discom = String(lead.discom ?? "Unknown") || "Unknown";
    const area = lead.area != null ? String(lead.area) : null;
    const location = lead.location != null ? String(lead.location) : null;

    /** Prefer CA already on lead; else from a bill-person proposal ppt. */
    let caNumber =
      lead.consumer_id != null && String(lead.consumer_id).trim()
        ? String(lead.consumer_id).trim()
        : null;
    if (!caNumber) {
      const { data: propRows } = await client
        .from("proposals")
        .select("customer_name, ppt_input")
        .eq("lead_id", leadId)
        .limit(20);
      for (const p of propRows ?? []) {
        const prop = p as { customer_name?: string | null; ppt_input?: Record<string, unknown> | null };
        const propName = String(prop.customer_name ?? "").trim();
        if (!propName || !personNamesLikelySame(propName, billPerson)) continue;
        const ppt = prop.ppt_input ?? {};
        for (const key of ["consumerId", "consumer_id", "caNumber"] as const) {
          const v = ppt[key];
          if (typeof v === "string" && v.trim()) {
            caNumber = v.trim();
            break;
          }
        }
        if (caNumber) break;
      }
    }

    /** Ensure project lead is the project person (no husband's bill/CA). */
    const leadPatch: Record<string, unknown> = {
      name: projectPerson,
      consumer_name: null,
      consumer_id: null,
    };

    await client.from(leadsTable).update(leadPatch).eq("id", leadId);

    /** Find or create bill/proposal person. */
    let billLeadId: string | null = null;
    const tokens = billPerson
      .split(/\s+/)
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
      .filter((t) => t.length >= 2)
      .slice(-2);

    if (tokens.length > 0) {
      const { data: candidates } = await client
        .from(leadsTable)
        .select("id, name, consumer_name")
        .ilike("name", `%${tokens.join("%")}%`)
        .limit(20);
      const hit = Array.isArray(candidates)
        ? (candidates as Record<string, unknown>[]).find(
            (l) =>
              String(l.id) !== leadId &&
              (personNamesLikelySame(String(l.name ?? ""), billPerson) ||
                personNamesLikelySame(String(l.consumer_name ?? ""), billPerson))
          )
        : undefined;
      if (hit?.id) billLeadId = String(hit.id);
    }

    if (!billLeadId) {
      try {
        const created = await processInboundLead({
          name: billPerson,
          phone,
          city,
          state,
          discom,
          monthly_bill: monthlyBill > 0 ? monthlyBill : 0,
          consumer_id: caNumber,
          area,
          location,
          source: "manual",
          forceNew: true,
          isWhatsappContact: false,
          source_meta: {
            unmerged_from_lead: leadId,
            reason: "split_bill_holder_from_project_lead",
          },
        });
        billLeadId = String(created.data.id ?? "") || null;
      } catch (err) {
        console.warn("[unmergeBillHolderFromProjectLeads] create", project.id, err);
        continue;
      }
    } else {
      const billPatch: Record<string, unknown> = {
        /** Bill person is their own contact — name is the bill name; no nested consumer. */
        consumer_name: null,
      };
      if (caNumber) billPatch.consumer_id = caNumber;
      if (monthlyBill > 0) billPatch.monthly_bill = monthlyBill;
      await client.from(leadsTable).update(billPatch).eq("id", billLeadId);
    }

    if (!billLeadId) continue;

    /** Move proposals that belong to the bill/proposal person. */
    const { data: props } = await client
      .from("proposals")
      .select("id, customer_name, lead_id, ppt_input")
      .eq("lead_id", leadId);

    for (const p of props ?? []) {
      const prop = p as {
        id: string;
        customer_name?: string | null;
        ppt_input?: Record<string, unknown> | null;
      };
      const ppt = prop.ppt_input ?? {};
      const propName = String(prop.customer_name ?? "").trim();
      const pptBill =
        (typeof ppt.officialBillName === "string" && ppt.officialBillName.trim()) ||
        (typeof ppt.customerName === "string" && ppt.customerName.trim()) ||
        "";
      const belongsToBill =
        (propName && personNamesLikelySame(propName, billPerson)) ||
        (pptBill && personNamesLikelySame(pptBill, billPerson)) ||
        (propName && personNamesLikelyDifferent(propName, projectPerson) && personNamesLikelySame(propName, billPerson));

      /** Also move if proposal name matches bill and not project person. */
      const clearlyNotProject =
        propName &&
        personNamesLikelyDifferent(propName, projectPerson) &&
        !personNamesLikelySame(propName, projectPerson);

      if (belongsToBill || (clearlyNotProject && personNamesLikelySame(propName, billPerson))) {
        const nextPpt: Record<string, unknown> = { ...(ppt as Record<string, unknown>) };
        delete nextPpt.crmDismissedName;
        nextPpt.crmProfileDismissed = false;
        await client
          .from("proposals")
          .update({ lead_id: billLeadId, ppt_input: nextPpt })
          .eq("id", prop.id);
        relinkedProposals += 1;
      }
    }

    /** Also catch Rajesh proposals still on this lead or unlinked. */
    const { data: moreProps } = await client
      .from("proposals")
      .select("id, customer_name, lead_id")
      .order("generated_at", { ascending: false })
      .limit(80);

    for (const p of moreProps ?? []) {
      const prop = p as {
        id: string;
        customer_name?: string | null;
        lead_id?: string | null;
      };
      const propName = String(prop.customer_name ?? "").trim();
      if (!propName || !personNamesLikelySame(propName, billPerson)) continue;
      if (prop.lead_id === billLeadId) continue;
      if (prop.lead_id && prop.lead_id !== leadId) continue;
      await client.from("proposals").update({ lead_id: billLeadId }).eq("id", prop.id);
      relinkedProposals += 1;
    }

    await client
      .from("projects")
      .update({
        lead_id: leadId,
        official_name: projectPerson,
        customer_name: projectPerson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    split += 1;
  }

  return { split, relinkedProposals };
}
