import { NextRequest, NextResponse } from "next/server";
import { mapCustomerRow, sortCustomersByRecency } from "@/lib/customers-map";
import { syncMissingHouseholdLeadsFromProposals } from "@/lib/crm-sync-proposal-leads";
import { syncLeadsFromActiveProjects } from "@/lib/crm-sync-leads-from-projects";
import { unmergeBillHolderFromProjectLeads } from "@/lib/crm-unmerge-bill-holder";
import { purgeSyntheticCrmLeads } from "@/lib/crm-purge-synthetic-leads";
import {
  listCustomers,
  listCustomersPage,
  mapLeadIdsToLatestProposalIds,
  batchNextFollowups,
  batchLastActivities,
} from "@/lib/supabase";
import { syncWonLeadProjects, isWonLeadStatus } from "@/lib/project-store";
import { processInboundLead } from "@/lib/inbound-leads";
import { appendActivityEvent } from "@/lib/followup-store";
import type { CustomerLead } from "@/lib/types";
import { z } from "zod";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";

type CustomerStageFilter = "all" | "leads" | "proposal-sent" | "active-projects";
type CustomerFollowupFilter = "all" | "scheduled" | "today" | "overdue" | "unscheduled";
type CustomerSmartView = "all" | "today" | "overdue" | "no-action" | "new" | "proposal-followup" | "hot" | "dormant" | "won";
type CustomerSort = "recent" | "newest" | "oldest" | "bill-high" | "name";

function resolveStageFilter(raw: string | null): CustomerStageFilter {
  return raw === "leads" || raw === "proposal-sent" || raw === "active-projects" ? raw : "all";
}

function resolveFollowupFilter(raw: string | null): CustomerFollowupFilter {
  return raw === "scheduled" || raw === "today" || raw === "overdue" || raw === "unscheduled" ? raw : "all";
}

function resolveSmartView(raw: string | null): CustomerSmartView {
  const allowed: CustomerSmartView[] = ["all", "today", "overdue", "no-action", "new", "proposal-followup", "hot", "dormant", "won"];
  return allowed.includes(raw as CustomerSmartView) ? raw as CustomerSmartView : "all";
}

function resolveCustomerSort(raw: string | null): CustomerSort {
  return raw === "newest" || raw === "oldest" || raw === "bill-high" || raw === "name" ? raw : "recent";
}

function matchesFollowupFilter(customer: CustomerLead, filter: CustomerFollowupFilter, now: Date): boolean {
  if (filter === "all") return true;
  if (!customer.next_followup_at) return filter === "unscheduled";
  const due = new Date(customer.next_followup_at);
  if (Number.isNaN(due.getTime())) return filter === "unscheduled";
  if (filter === "scheduled") return true;
  const todayKey = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const dueKey = due.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (filter === "today") return dueKey === todayKey;
  if (filter === "overdue") return due.getTime() < now.getTime() && dueKey !== todayKey;
  return false;
}

async function decorateCustomerRows(raw: Record<string, unknown>[]): Promise<CustomerLead[]> {
  const customers = raw.map(mapCustomerRow);
  const leadIds = customers.map((customer) => customer.id);
  const householdNames = new Map<string, string[]>();
  for (const customer of customers) {
    if (!customer.household_id) continue;
    const names = householdNames.get(customer.household_id) ?? [];
    names.push(customer.name);
    householdNames.set(customer.household_id, names);
  }
  const [proposalByLead, nextFollowups, lastActivities] = await Promise.all([
    mapLeadIdsToLatestProposalIds(leadIds),
    batchNextFollowups(leadIds),
    batchLastActivities(leadIds),
  ]);
  return sortCustomersByRecency(
    customers.map((customer) => {
      const members = customer.household_id ? householdNames.get(customer.household_id) ?? [] : [];
      return {
        ...customer,
        household_member_names: members.filter((name) => name !== customer.name),
        customer_stage: isWonLeadStatus(customer.status) ? "active-project" : "lead",
        primary_proposal_id: proposalByLead[customer.id] ?? null,
        next_followup_id: nextFollowups[customer.id]?.id ?? null,
        next_followup_at: nextFollowups[customer.id]?.due_at ?? null,
        next_followup_title: nextFollowups[customer.id]?.title ?? null,
        last_activity_at: lastActivities[customer.id]?.occurred_at ?? null,
        last_activity_type: lastActivities[customer.id]?.event_type ?? null,
      } satisfies CustomerLead;
    })
  );
}

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

let lastCustomerRepairAt = 0;
const CUSTOMER_REPAIR_INTERVAL_MS = 5 * 60 * 1000;

function scheduleCustomerRepairs() {
  const now = Date.now();
  if (now - lastCustomerRepairAt < CUSTOMER_REPAIR_INTERVAL_MS) return;
  lastCustomerRepairAt = now;
  void Promise.allSettled([
    purgeSyntheticCrmLeads(),
    unmergeBillHolderFromProjectLeads(),
    syncMissingHouseholdLeadsFromProposals(),
  ]).then((repairs) => {
    repairs.forEach((result, index) => {
      if (result.status === "rejected") {
        const labels = ["purge synthetic", "unmerge bill holder", "household sync"];
        console.warn(`[customers GET] ${labels[index]}:`, result.reason);
      }
    });
  });
}

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;

    const paginated = req.nextUrl.searchParams.get("view") === "page";
    if (paginated) {
      const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? 40);
      const limit = Math.max(10, Math.min(100, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 40));
      const cursorRaw = Number(req.nextUrl.searchParams.get("cursor") ?? 0);
      let scanOffset = Math.max(0, Number.isFinite(cursorRaw) ? Math.floor(cursorRaw) : 0);
      const requestedStage = resolveStageFilter(req.nextUrl.searchParams.get("stage"));
      const requestedFollowup = resolveFollowupFilter(req.nextUrl.searchParams.get("callback"));
      const smartView = resolveSmartView(req.nextUrl.searchParams.get("smart"));
      const sort = resolveCustomerSort(req.nextUrl.searchParams.get("sort"));
      const stage: CustomerStageFilter = smartView === "proposal-followup"
        ? "proposal-sent"
        : smartView === "won"
          ? "active-projects"
          : requestedStage;
      const followup: CustomerFollowupFilter = smartView === "today"
        ? "today"
        : smartView === "overdue"
          ? "overdue"
          : smartView === "no-action"
            ? "unscheduled"
            : requestedFollowup;
      const search = req.nextUrl.searchParams.get("q") ?? "";
      const items: CustomerLead[] = [];
      let sourceTotal = 0;
      let sourceExhausted = false;
      let batches = 0;
      const now = new Date();

      // Callback state is stored in a separate table. Scan bounded lead pages,
      // decorate only those rows, and return an opaque source cursor.
      while (items.length < limit && !sourceExhausted && batches < 6) {
        const scanLimit = Math.min(100, Math.max(1, limit - items.length));
        const page = await listCustomersPage({
          organizationId: scope.organizationId,
          includeNullOrg: scope.includeUnscopedRows,
          search,
          stage,
          smartView,
          sort,
          offset: scanOffset,
          limit: scanLimit,
        });
        sourceTotal = page.total;
        const decorated = await decorateCustomerRows(page.rows);
        items.push(...decorated.filter((customer) => matchesFollowupFilter(customer, followup, now)));
        scanOffset += page.rows.length;
        sourceExhausted = page.rows.length < scanLimit || scanOffset >= page.total;
        batches += 1;
      }

      const data = items;
      const hasMore = !sourceExhausted;
      return NextResponse.json({
        ok: true,
        data,
        pagination: {
          nextCursor: hasMore ? String(scanOffset) : null,
          hasMore,
          total: followup === "all" ? sourceTotal : null,
        },
      });
    }

    /**
     * Critical household split must finish before the list returns so Rajesh
     * (proposal person) appears and Bharti's stolen bill/CA are cleared.
     * Heavier project backfills stay in the background.
     */
    // Repair/backfill work is throttled and best-effort. A read should never
    // wait on three write-heavy maintenance jobs before returning the list.
    scheduleCustomerRepairs();

    void (async () => {
      try {
        await syncWonLeadProjects();
      } catch (err) {
        console.warn("[customers GET] syncWonLeadProjects:", err);
      }
      try {
        await syncLeadsFromActiveProjects();
      } catch (err) {
        console.warn("[customers GET] project→lead sync:", err);
      }
    })();

    const raw = await listCustomers({
      organizationId: scope.organizationId,
      includeNullOrg: scope.includeUnscopedRows,
    });
    const decorated = await decorateCustomerRows(raw as Record<string, unknown>[]);

    return NextResponse.json({ ok: true, data: decorated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load customers";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;

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
      organizationId: scope.organizationId,
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
