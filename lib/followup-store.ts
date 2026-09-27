import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type {
  ActivityEvent,
  ActivityEventType,
  FollowupPagination,
  FollowupReminder,
  LeadNote,
  LeadVisit,
  ReminderStatus,
} from "@/lib/followup-types";
import { crmIstDayBounds } from "@/lib/crm-datetime";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function normalizePage(page?: FollowupPagination) {
  const limit = Math.max(1, Math.min(100, page?.limit ?? 20));
  const offset = Math.max(0, page?.offset ?? 0);
  return { limit, offset };
}

export async function appendActivityEvent(input: {
  leadId: string;
  eventType: ActivityEventType;
  actorType?: string;
  actorId?: string | null;
  occurredAt?: string;
  meta?: Record<string, unknown>;
}): Promise<ActivityEvent | null> {
  const client = db();
  if (!client) return null;

  if (input.eventType === "lead_edited") {
    const nowIso = input.occurredAt ?? new Date().toISOString();
    const mergeWindowMs = 2 * 60 * 1000;
    const { data: latestEdited } = await client
      .from("activity_events")
      .select("id,occurred_at,meta_json")
      .eq("lead_id", input.leadId)
      .eq("event_type", "lead_edited")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestEdited) {
      const latestAt = Date.parse(String(latestEdited.occurred_at ?? ""));
      const nowAt = Date.parse(nowIso);
      if (Number.isFinite(latestAt) && Number.isFinite(nowAt) && Math.abs(nowAt - latestAt) <= mergeWindowMs) {
        const prevMeta =
          latestEdited.meta_json && typeof latestEdited.meta_json === "object"
            ? (latestEdited.meta_json as Record<string, unknown>)
            : {};
        const prevFields = Array.isArray(prevMeta.fields)
          ? prevMeta.fields.map((f) => String(f))
          : [];
        const nextFields = Array.isArray(input.meta?.fields)
          ? input.meta!.fields.map((f) => String(f))
          : [];
        const mergedMeta = {
          ...prevMeta,
          ...(input.meta ?? {}),
          fields: [...new Set([...prevFields, ...nextFields])],
        };
        const { data: updated, error: updateErr } = await client
          .from("activity_events")
          .update({
            meta_json: mergedMeta,
            occurred_at: nowIso,
          })
          .eq("id", String(latestEdited.id))
          .select("*")
          .single();
        if (!updateErr && updated) return updated as ActivityEvent;
      }
    }
  }

  const { data, error } = await client
    .from("activity_events")
    .insert({
      lead_id: input.leadId,
      event_type: input.eventType,
      actor_type: input.actorType ?? "user",
      actor_id: input.actorId ?? null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      meta_json: input.meta ?? {},
    })
    .select("*")
    .single();
  if (error) return null;
  return data as ActivityEvent;
}

export async function listActivityTimeline(leadId: string, page?: FollowupPagination): Promise<ActivityEvent[]> {
  const client = db();
  if (!client) return [];
  const { limit, offset } = normalizePage(page);
  const { data, error } = await client
    .from("activity_events")
    .select("*")
    .eq("lead_id", leadId)
    .order("occurred_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error || !Array.isArray(data)) return [];
  return data as ActivityEvent[];
}

export async function listLeadReminders(leadId: string, page?: FollowupPagination): Promise<FollowupReminder[]> {
  const client = db();
  if (!client) return [];
  const { limit, offset } = normalizePage(page);
  const { data, error } = await client
    .from("followup_reminders")
    .select("*")
    .eq("lead_id", leadId)
    .order("due_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error || !Array.isArray(data)) return [];
  return data as FollowupReminder[];
}

export async function createLeadReminder(
  payload: Omit<FollowupReminder, "id" | "created_at" | "updated_at" | "completed_at">
): Promise<FollowupReminder | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("followup_reminders")
    .insert(payload)
    .select("*")
    .single();
  if (error) return null;
  return data as FollowupReminder;
}

export async function updateLeadReminder(
  reminderId: string,
  patch: Partial<FollowupReminder> & { status?: ReminderStatus }
): Promise<FollowupReminder | null> {
  const client = db();
  if (!client) return null;
  const next: Record<string, unknown> = { ...patch };
  if (patch.status === "completed") next.completed_at = new Date().toISOString();
  const { data, error } = await client
    .from("followup_reminders")
    .update(next)
    .eq("id", reminderId)
    .select("*")
    .single();
  if (error) return null;
  return data as FollowupReminder;
}

export async function listLeadNotes(leadId: string, page?: FollowupPagination): Promise<LeadNote[]> {
  const client = db();
  if (!client) return [];
  const { limit, offset } = normalizePage(page);
  const { data, error } = await client
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error || !Array.isArray(data)) return [];
  return data as LeadNote[];
}

export async function createLeadNote(
  payload: Omit<LeadNote, "id" | "created_at" | "updated_at">
): Promise<LeadNote | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("lead_notes")
    .insert(payload)
    .select("*")
    .single();
  if (error) return null;
  return data as LeadNote;
}

export async function listLeadVisits(leadId: string, page?: FollowupPagination): Promise<LeadVisit[]> {
  const client = db();
  if (!client) return [];
  const { limit, offset } = normalizePage(page);
  const { data, error } = await client
    .from("lead_visits")
    .select("*")
    .eq("lead_id", leadId)
    .order("scheduled_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error || !Array.isArray(data)) return [];
  return data as LeadVisit[];
}

export async function createLeadVisit(
  payload: Omit<LeadVisit, "id" | "created_at" | "updated_at">
): Promise<LeadVisit | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("lead_visits")
    .insert(payload)
    .select("*")
    .single();
  if (error) return null;
  return data as LeadVisit;
}

export async function listLeadProposalHistory(leadId: string, page?: FollowupPagination): Promise<Record<string, unknown>[]> {
  const client = db();
  if (!client) return [];
  const { limit, offset } = normalizePage(page);
  const { data, error } = await client
    .from("proposals")
    .select("id, customer_name, generated_at, summary, preset_id")
    .eq("lead_id", leadId)
    .order("generated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error || !Array.isArray(data)) return [];
  return data as Record<string, unknown>[];
}

export async function getFollowupDashboardWidgets(input: {
  leadIds: string[];
  organizationId?: string | null;
  includeUnscopedRows?: boolean;
  horizonDays?: number;
  limit?: number;
}) {
  const client = db();
  if (!client) return { today: [], overdue: [], upcoming: [], upcomingVisits: [], counts: { overdue: 0, today: 0, upcoming: 0 } };
  const scopedLeadIds = [...new Set((input.leadIds ?? []).filter(Boolean))];
  if (scopedLeadIds.length === 0 && !input.organizationId) {
    return { today: [], overdue: [], upcoming: [], upcomingVisits: [], counts: { overdue: 0, today: 0, upcoming: 0 } };
  }
  const reminderScope = [
    scopedLeadIds.length ? `lead_id.in.(${scopedLeadIds.join(",")})` : "",
    input.organizationId ? `organization_id.eq.${input.organizationId}` : "",
    input.includeUnscopedRows ? "and(lead_id.is.null,organization_id.is.null)" : "",
  ].filter(Boolean).join(",");
  const now = new Date();
  const { start, end } = crmIstDayBounds(now);
  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const horizonEnd = new Date(start);
  horizonEnd.setDate(horizonEnd.getDate() + Math.max(7, Math.min(365, input.horizonDays ?? 90)));
  const queryLimit = Math.max(25, Math.min(500, input.limit ?? 25));

  const reminderSelect =
    "id, lead_id, organization_id, subject_type, subject_label, title, due_at, priority, followup_type, status, notes";

  const [today, overdue, upcoming, upcomingVisits] = await Promise.all([
    client
      .from("followup_reminders")
      .select(reminderSelect)
      .or(reminderScope)
      .eq("status", "pending")
      .gte("due_at", start.toISOString())
      .lt("due_at", end.toISOString())
      .order("due_at", { ascending: true })
      .limit(queryLimit),
    client
      .from("followup_reminders")
      .select(reminderSelect)
      .or(reminderScope)
      .eq("status", "pending")
      .lt("due_at", now.toISOString())
      .order("due_at", { ascending: true })
      .limit(queryLimit),
    client
      .from("followup_reminders")
      .select(reminderSelect)
      .or(reminderScope)
      .eq("status", "pending")
      .gte("due_at", end.toISOString())
      .lt("due_at", horizonEnd.toISOString())
      .order("due_at", { ascending: true })
      .limit(queryLimit),
    client
      .from("lead_visits")
      .select("id, lead_id, scheduled_at, visit_status, summary, location")
      .in("lead_id", scopedLeadIds.length ? scopedLeadIds : ["00000000-0000-0000-0000-000000000000"])
      .in("visit_status", ["scheduled", "rescheduled"])
      .gte("scheduled_at", now.toISOString())
      .lt("scheduled_at", weekEnd.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(20),
  ]);

  // Rolling deployments can serve app code before migration 094 reaches the
  // database. Preserve customer-linked reminders instead of painting an empty
  // agenda; general reminders become available as soon as the migration lands.
  let todayRows: Record<string, unknown>[] = today.data ?? [];
  let overdueRows: Record<string, unknown>[] = overdue.data ?? [];
  let upcomingRows: Record<string, unknown>[] = upcoming.data ?? [];
  if (today.error || overdue.error || upcoming.error) {
    const [legacyToday, legacyOverdue, legacyUpcoming] = await Promise.all([
      client.from("followup_reminders").select("id, lead_id, title, due_at, priority, followup_type, status, notes").in("lead_id", scopedLeadIds).eq("status", "pending").gte("due_at", start.toISOString()).lt("due_at", end.toISOString()).order("due_at", { ascending: true }).limit(queryLimit),
      client.from("followup_reminders").select("id, lead_id, title, due_at, priority, followup_type, status, notes").in("lead_id", scopedLeadIds).eq("status", "pending").lt("due_at", now.toISOString()).order("due_at", { ascending: true }).limit(queryLimit),
      client.from("followup_reminders").select("id, lead_id, title, due_at, priority, followup_type, status, notes").in("lead_id", scopedLeadIds).eq("status", "pending").gte("due_at", end.toISOString()).lt("due_at", horizonEnd.toISOString()).order("due_at", { ascending: true }).limit(queryLimit),
    ]);
    todayRows = legacyToday.data ?? [];
    overdueRows = legacyOverdue.data ?? [];
    upcomingRows = legacyUpcoming.data ?? [];
  }

  return {
    today: todayRows,
    overdue: overdueRows,
    upcoming: upcomingRows,
    upcomingVisits: upcomingVisits.data ?? [],
    counts: {
      overdue: overdueRows.length,
      today: todayRows.length,
      upcoming: upcomingRows.length,
    },
  };
}
