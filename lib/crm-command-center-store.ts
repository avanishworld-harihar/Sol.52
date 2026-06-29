import { listCustomers } from "@/lib/supabase";
import { mapCustomerRow } from "@/lib/customers-map";
import { normalizeLeadStatus, type LeadStatusKey } from "@/lib/lead-status";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type {
  CommandActionItem,
  CommandCenterKpis,
  CommandCenterPayload,
  CommandUrgency,
} from "@/lib/crm-command-center-types";

const HOT_WINDOW_MS = 48 * 60 * 60 * 1000;
const STALE_MS = 7 * 24 * 60 * 60 * 1000;

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function emptyPayload(): CommandCenterPayload {
  return {
    kpis: { hot_leads: 0, overdue_followups: 0, today_tasks: 0, pipeline_at_risk_inr: 0 },
    actions: [],
    generated_at: new Date().toISOString(),
  };
}

function priorityBoost(priority: string): number {
  if (priority === "urgent") return 50;
  if (priority === "high") return 40;
  if (priority === "medium") return 30;
  return 20;
}

function istDayBounds(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const horizonEnd = new Date(start);
  horizonEnd.setDate(horizonEnd.getDate() + 90);
  return { start, end, weekEnd, horizonEnd };
}

function minutesAgo(iso: string, now: number): number {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 9999;
  return Math.max(0, Math.round((now - t) / 60_000));
}

function formatMinutesAgo(mins: number): string {
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)}d ago`;
}

type LeadCtx = {
  name: string;
  phone: string | null;
  status: LeadStatusKey;
  last_touched_at: string | null;
};

type ProposalCtx = {
  system_kw: number | null;
  net_cost_inr: number | null;
};

export async function getCommandCenterPayload(): Promise<CommandCenterPayload> {
  const client = db();
  if (!client) return emptyPayload();

  const now = new Date();
  const nowMs = now.getTime();
  const { start, end, weekEnd, horizonEnd } = istDayBounds(now);
  const hotSince = new Date(nowMs - HOT_WINDOW_MS).toISOString();
  const staleBefore = new Date(nowMs - STALE_MS).toISOString();

  const reminderSelect =
    "id, lead_id, title, due_at, priority, followup_type, status, notes";

  const [rawLeads, remindersRes, visitsRes, hotEventsRes, proposalsRes] = await Promise.all([
    listCustomers(),
    client
      .from("followup_reminders")
      .select(reminderSelect)
      .eq("status", "pending")
      .lte("due_at", horizonEnd.toISOString())
      .order("due_at", { ascending: true })
      .limit(120),
    client
      .from("lead_visits")
      .select("id, lead_id, scheduled_at, visit_status, summary, location")
      .in("visit_status", ["scheduled", "rescheduled"])
      .gte("scheduled_at", now.toISOString())
      .lt("scheduled_at", weekEnd.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(40),
    client
      .from("activity_events")
      .select("lead_id, event_type, occurred_at")
      .in("event_type", ["proposal_opened", "file_uploaded"])
      .gte("occurred_at", hotSince)
      .order("occurred_at", { ascending: false })
      .limit(80),
    client
      .from("proposals")
      .select("lead_id, system_kw, net_cost_inr, generated_at")
      .not("lead_id", "is", null)
      .order("generated_at", { ascending: false })
      .limit(400),
  ]);

  const leads = (rawLeads as Record<string, unknown>[]).map(mapCustomerRow);
  const leadById = new Map<string, LeadCtx>();
  for (const l of leads) {
    leadById.set(l.id, {
      name: l.consumer_name ? `${l.consumer_name} (${l.name})` : l.name,
      phone: l.phone ?? null,
      status: normalizeLeadStatus(l.status),
      last_touched_at: l.last_touched_at ?? null,
    });
  }

  const proposalByLead = new Map<string, ProposalCtx>();
  for (const row of proposalsRes.data ?? []) {
    const r = row as { lead_id: string | null; system_kw?: number | null; net_cost_inr?: number | null };
    const lid = r.lead_id ? String(r.lead_id) : "";
    if (!lid || proposalByLead.has(lid)) continue;
    proposalByLead.set(lid, {
      system_kw: typeof r.system_kw === "number" ? r.system_kw : null,
      net_cost_inr: typeof r.net_cost_inr === "number" ? r.net_cost_inr : null,
    });
  }

  function ctxForLead(leadId: string) {
    const lead = leadById.get(leadId);
    const prop = proposalByLead.get(leadId);
    return {
      customer_name: lead?.name ?? "Customer",
      phone: lead?.phone ?? null,
      stage: lead?.status ?? "new",
      system_kw: prop?.system_kw ?? null,
      deal_value_inr: prop?.net_cost_inr ?? null,
    };
  }

  const actions: CommandActionItem[] = [];
  const seenHotLeads = new Set<string>();

  for (const row of remindersRes.data ?? []) {
    const r = row as {
      id: string;
      lead_id: string;
      title: string;
      due_at: string;
      priority: string;
      followup_type: string;
      notes?: string | null;
    };
    const dueMs = Date.parse(r.due_at);
    const ctx = ctxForLead(r.lead_id);
    let urgency: CommandUrgency = "low";
    let kind: CommandActionItem["kind"] = "reminder_upcoming";
    let sort_score = 100;
    let reason_icon = "📅";
    let reason = r.title;

    if (dueMs < nowMs) {
      urgency = "critical";
      kind = r.followup_type === "payment" ? "payment_pending" : "reminder_overdue";
      sort_score = 1000 + priorityBoost(r.priority);
      reason_icon = r.followup_type === "payment" ? "💰" : "⚠️";
      reason =
        r.followup_type === "payment"
          ? `Advance payment pending — ${r.title}`
          : `Overdue callback — ${r.title}`;
    } else if (dueMs >= start.getTime() && dueMs < end.getTime()) {
      urgency = "today";
      kind = r.followup_type === "payment" ? "payment_pending" : "reminder_today";
      sort_score = 800 + priorityBoost(r.priority);
      reason_icon = r.followup_type === "payment" ? "💰" : "📞";
      reason =
        r.followup_type === "payment"
          ? `Payment due today — ${r.title}`
          : `Callback due today — ${r.title}`;
    } else if (dueMs < weekEnd.getTime()) {
      urgency = "upcoming";
      kind = "reminder_upcoming";
      sort_score = 400 - Math.floor((dueMs - nowMs) / 86_400_000);
      reason_icon = "📅";
      reason = `Upcoming — ${r.title}`;
    } else {
      urgency = "low";
      sort_score = 100 - Math.floor((dueMs - nowMs) / 86_400_000);
    }

    if (r.notes?.trim()) reason = `${reason} · ${r.notes.trim()}`;

    actions.push({
      id: `reminder-${r.id}`,
      lead_id: r.lead_id,
      reminder_id: r.id,
      ...ctx,
      reason,
      reason_icon,
      due_at: r.due_at,
      urgency,
      kind,
      sort_score,
    });
  }

  for (const row of visitsRes.data ?? []) {
    const v = row as {
      id: string;
      lead_id: string;
      scheduled_at: string;
      location?: string | null;
      summary?: string | null;
    };
    const schedMs = Date.parse(v.scheduled_at);
    const ctx = ctxForLead(v.lead_id);
    const isToday = schedMs >= start.getTime() && schedMs < end.getTime();
    const urgency: CommandUrgency = isToday ? "today" : "upcoming";
    const kind = isToday ? "visit_today" : "visit_upcoming";
    const loc = v.location?.trim() ? ` at ${v.location.trim()}` : "";
    actions.push({
      id: `visit-${v.id}`,
      lead_id: v.lead_id,
      visit_id: v.id,
      ...ctx,
      reason: isToday ? `Site visit today${loc}` : `Site visit scheduled${loc}`,
      reason_icon: "📍",
      due_at: v.scheduled_at,
      urgency,
      kind,
      sort_score: isToday ? 750 : 380 - Math.floor((schedMs - nowMs) / 86_400_000),
    });
  }

  for (const row of hotEventsRes.data ?? []) {
    const e = row as { lead_id: string; event_type: string; occurred_at: string };
    if (seenHotLeads.has(e.lead_id)) continue;
    seenHotLeads.add(e.lead_id);
    const mins = minutesAgo(e.occurred_at, nowMs);
    const ctx = ctxForLead(e.lead_id);
    const isProposal = e.event_type === "proposal_opened";
    actions.push({
      id: `hot-${e.lead_id}-${e.event_type}`,
      lead_id: e.lead_id,
      ...ctx,
      reason: isProposal
        ? `Proposal opened ${formatMinutesAgo(mins)}`
        : `Bill uploaded ${formatMinutesAgo(mins)}`,
      reason_icon: "🔥",
      due_at: e.occurred_at,
      urgency: mins <= 120 ? "critical" : "today",
      kind: isProposal ? "hot_proposal" : "hot_bill",
      sort_score: 700 - Math.min(mins, 300),
    });
  }

  actions.sort((a, b) => b.sort_score - a.sort_score);

  const overdueCount = (remindersRes.data ?? []).filter((r) => {
    const row = r as { due_at: string };
    return Date.parse(row.due_at) < nowMs;
  }).length;

  const todayReminderCount = (remindersRes.data ?? []).filter((r) => {
    const row = r as { due_at: string };
    const t = Date.parse(row.due_at);
    return t >= start.getTime() && t < end.getTime();
  }).length;

  const todayVisitCount = (visitsRes.data ?? []).filter((v) => {
    const row = v as { scheduled_at: string };
    const t = Date.parse(row.scheduled_at);
    return t >= start.getTime() && t < end.getTime();
  }).length;

  let pipelineAtRisk = 0;
  for (const l of leads) {
    if (normalizeLeadStatus(l.status) === "won") continue;
    const touched = l.last_touched_at ? Date.parse(l.last_touched_at) : 0;
    const stale = !touched || touched < Date.parse(staleBefore);
    if (!stale) continue;
    const prop = proposalByLead.get(l.id);
    if (prop?.net_cost_inr && prop.net_cost_inr > 0) {
      pipelineAtRisk += prop.net_cost_inr;
    }
  }

  const kpis: CommandCenterKpis = {
    hot_leads: seenHotLeads.size,
    overdue_followups: overdueCount,
    today_tasks: todayReminderCount + todayVisitCount,
    pipeline_at_risk_inr: Math.round(pipelineAtRisk),
  };

  return {
    kpis,
    actions: actions.slice(0, 40),
    generated_at: now.toISOString(),
  };
}
