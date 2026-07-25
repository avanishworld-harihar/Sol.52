import { NextRequest, NextResponse } from "next/server";
import { mapCustomerRow } from "@/lib/customers-map";
import { syncMissingHouseholdLeadsFromProposals } from "@/lib/crm-sync-proposal-leads";
import { syncLeadsFromActiveProjects } from "@/lib/crm-sync-leads-from-projects";
import { unmergeBillHolderFromProjectLeads } from "@/lib/crm-unmerge-bill-holder";
import {
  listCustomers,
  listPipelineProjects,
  mapLeadIdsToLatestProposalIds,
  batchNextFollowups,
  batchLastActivities,
} from "@/lib/supabase";
import { syncWonLeadProjects } from "@/lib/project-store";
import { processInboundLead } from "@/lib/inbound-leads";
import { appendActivityEvent } from "@/lib/followup-store";
import type { CustomerLead } from "@/lib/types";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  discom: z.string().min(2),
  monthly_bill: z.number().nonnegative(),
  status: z.string().optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  email: z.string().email().optional(),
  consumer_id: z.string().max(160).optional(),
  consumer_name: z.string().max(200).optional().nullable(),
  survey_status: z.string().max(40).optional(),
  area: z.enum(["urban", "rural"]).optional(),
  location: z.string().max(200).optional(),
  connection_type: z.string().max(40).optional(),
  /** Always create a new person row (family member). Default true for manual. */
  force_new: z.boolean().optional(),
  is_whatsapp_contact: z.boolean().optional(),
});

export async function GET() {
  try {
    /** Link won leads → projects before stage decoration (e.g. Bharti Gupta). */
    await syncWonLeadProjects();
    /** Split bill/husband (Rajesh) off project leads (Bharti) when wrongly merged. */
    try {
      await unmergeBillHolderFromProjectLeads();
    } catch (err) {
      console.warn("[customers GET] unmerge bill holder:", err);
    }
    /** Active projects without a CRM lead get one so they stay on Customers. */
    try {
      await syncLeadsFromActiveProjects();
    } catch (err) {
      console.warn("[customers GET] project→lead sync:", err);
    }
    /** Proposal names (e.g. Rajesh) become distinct household leads when linked to another person. */
    try {
      await syncMissingHouseholdLeadsFromProposals();
    } catch (err) {
      console.warn("[customers GET] household sync:", err);
    }

    const raw = await listCustomers();
    const customers = (raw as Record<string, unknown>[]).map(mapCustomerRow);
    const leadIds = customers.map((c) => c.id);

    const householdNames = new Map<string, string[]>();
    for (const c of customers) {
      if (!c.household_id) continue;
      const list = householdNames.get(c.household_id) ?? [];
      list.push(c.name);
      householdNames.set(c.household_id, list);
    }

    const [pipeline, proposalByLead, nextFollowups, lastActivities] = await Promise.all([
      listPipelineProjects(),
      mapLeadIdsToLatestProposalIds(leadIds),
      batchNextFollowups(leadIds),
      batchLastActivities(leadIds),
    ]);

    const stageByLeadId = new Map<string, "in-pipeline" | "active-project">();
    for (const p of pipeline) {
      if (!p.lead_id || p.archived_at) continue;
      stageByLeadId.set(p.lead_id, "active-project");
    }

    const decorated: CustomerLead[] = customers.map((c) => {
      const members = c.household_id ? householdNames.get(c.household_id) ?? [] : [];
      return {
        ...c,
        household_member_names: members.filter((n) => n !== c.name),
        customer_stage: stageByLeadId.get(c.id) ?? "lead",
        primary_proposal_id: proposalByLead[c.id] ?? null,
        next_followup_at: nextFollowups[c.id]?.due_at ?? null,
        next_followup_title: nextFollowups[c.id]?.title ?? null,
        last_activity_at: lastActivities[c.id]?.occurred_at ?? null,
        last_activity_type: lastActivities[c.id]?.event_type ?? null,
      };
    });

    return NextResponse.json({ ok: true, data: decorated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load customers";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = customerSchema.parse(body);
    /**
     * Manual add creates a distinct person. Same phone → household link (not merge),
     * so family members both appear in Customers.
     */
    const result = await processInboundLead({
      name: payload.name,
      phone: payload.phone ?? "",
      city: payload.city,
      state: payload.state ?? null,
      discom: payload.discom,
      monthly_bill: payload.monthly_bill,
      email: payload.email ?? null,
      consumer_id: payload.consumer_id?.trim() || null,
      survey_status: payload.survey_status?.trim().toLowerCase() || null,
      area: payload.area?.trim() || null,
      location: payload.location?.trim() || null,
      connection_type: payload.connection_type?.trim().toLowerCase() || null,
      source: "manual",
      forceNew: payload.force_new !== false,
      isWhatsappContact: payload.is_whatsapp_contact,
      consumerName: payload.consumer_name?.trim() || null,
    });
    const mappedData = mapCustomerRow(result.data as Record<string, unknown>);
    if (!result.deduped) {
      void appendActivityEvent({
        leadId: mappedData.id,
        eventType: "lead_created",
        meta: {
          name: payload.name,
          city: payload.city,
          source: "manual",
          householdLinked: result.householdLinked === true,
        },
      });
    }
    return NextResponse.json(
      {
        ok: true,
        deduped: result.deduped,
        householdLinked: result.householdLinked === true,
        data: mappedData,
      },
      { status: result.deduped ? 200 : 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : "Failed to create customer";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
