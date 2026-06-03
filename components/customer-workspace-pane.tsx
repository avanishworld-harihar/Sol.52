"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  AlarmClock,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  MapPin,
  MessageCircle,
  NotebookPen,
  Phone,
  PhoneCall,
  Plus,
  StickyNote,
  TimerReset,
  UserRoundCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type TouchEvent } from "react";
import {
  LeadStatusBadge,
  LeadStatusPillSelect,
  formatLeadLastActivity,
} from "@/components/customers-lead-list";
import type { CustomerLead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_I18N_KEY, normalizeLeadStatus, type LeadStatusKey } from "@/lib/lead-status";
import { getInstallerBrandName } from "@/lib/installer-brand";
import { useLanguage } from "@/lib/language-context";
import { formatLastFollowUpLocale } from "@/lib/time-i18n";
import { formatLeadPhoneForDisplay } from "@/lib/lead-phone";
import { buildLeadWhatsAppUrl } from "@/lib/whatsapp-lead";
import { readLeadFollowUpMap, recordLeadFollowUp } from "@/lib/lead-followup-storage";
import { isLeadStale } from "@/lib/lead-source";
import { resolveCustomerCommercialCta } from "@/lib/customer-crm-cta";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import {
  createLeadNote,
  createLeadVisit,
  createReminder,
  fetchLeadNotes,
  fetchLeadProposals,
  fetchLeadReminders,
  fetchLeadTimeline,
  fetchLeadVisits,
  logCustomerContact,
  patchReminder,
} from "@/lib/followup-client";
import type { FollowupReminder, LeadNote, LeadVisit } from "@/lib/followup-types";
import type { CustomerTimelineItem } from "@/lib/customer-timeline-store";
import {
  crmDatetimeLocalToIso,
  formatCrmDateTime,
  formatCrmDayLabel,
  formatCrmTime,
} from "@/lib/crm-datetime";

type CustomerStage = "lead" | "in-pipeline" | "active-project";
type FollowupTab = "timeline" | "reminders" | "notes" | "visits" | "proposals";
type QuickActionSheet = "none" | "reminder" | "visit" | "note";

const CUSTOMER_STAGE_META: Record<CustomerStage, { labelKey: string; className: string }> = {
  lead: { labelKey: "customers_stageLead", className: "border-slate-200/90 bg-slate-50/90 text-slate-700" },
  "in-pipeline": { labelKey: "customers_stageInPipeline", className: "border-amber-200/90 bg-amber-50/90 text-amber-800" },
  "active-project": { labelKey: "customers_stageActiveProject", className: "border-emerald-200/90 bg-emerald-50/90 text-emerald-800" },
};

const EVENT_ICON: Record<string, typeof Clock3> = {
  proposal_created: FileText,
  proposal_opened: FileText,
  reminder_completed: CheckCircle2,
  customer_contacted: PhoneCall,
  status_changed: UserRoundCheck,
  followup_created: AlarmClock,
  followup_snoozed: TimerReset,
  visit_scheduled: CalendarClock,
  visit_completed: CheckCircle2,
  note_added: NotebookPen,
};

function toDayKey(iso: string) {
  return formatCrmDayLabel(iso);
}

export function CustomerWorkspacePane({
  customer,
  onStatusChange,
}: {
  customer: CustomerLead | null;
  onStatusChange?: (leadId: string, next: LeadStatusKey) => void;
}) {
  const { locale, t } = useLanguage();
  const installerName = getInstallerBrandName();
  const [followMap, setFollowMap] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<FollowupTab>("timeline");
  const [quickSheet, setQuickSheet] = useState<QuickActionSheet>("none");
  const [timelineVisibleCount, setTimelineVisibleCount] = useState(14);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDueAt, setNewReminderDueAt] = useState("");
  const [newReminderType, setNewReminderType] = useState<FollowupReminder["followup_type"]>("call");
  const [newReminderPriority, setNewReminderPriority] = useState<FollowupReminder["priority"]>("medium");
  const [newNote, setNewNote] = useState("");
  const [visitAt, setVisitAt] = useState("");
  const [visitSummary, setVisitSummary] = useState("");
  const [visitLocation, setVisitLocation] = useState("");
  const [noteImagePreviewUrls, setNoteImagePreviewUrls] = useState<string[]>([]);

  const refreshFollowMap = useCallback(() => setFollowMap({ ...readLeadFollowUpMap() }), []);

  useEffect(() => {
    refreshFollowMap();
  }, [customer, refreshFollowMap]);

  const openWhatsApp = useCallback(
    (leadId: string, url: string) => {
      recordLeadFollowUp(leadId);
      refreshFollowMap();
      void logCustomerContact(leadId, "whatsapp");
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [refreshFollowMap]
  );

  const handlePhoneCall = useCallback(
    (leadId: string) => {
      recordLeadFollowUp(leadId);
      refreshFollowMap();
      void logCustomerContact(leadId, "call");
    },
    [refreshFollowMap]
  );

  const leadId = customer?.id ?? "";

  const { data: timeline = [], mutate: mutateTimeline } = useSWR<CustomerTimelineItem[]>(
    leadId ? `/api/customers/${leadId}/timeline` : null,
    () => fetchLeadTimeline(leadId as string)
  );
  const { data: reminders = [], mutate: mutateReminders } = useSWR<FollowupReminder[]>(
    leadId ? `/api/customers/${leadId}/reminders` : null,
    () => fetchLeadReminders(leadId as string)
  );
  const { data: notes = [], mutate: mutateNotes } = useSWR<LeadNote[]>(
    leadId ? `/api/customers/${leadId}/notes` : null,
    () => fetchLeadNotes(leadId as string)
  );
  const { data: visits = [], mutate: mutateVisits } = useSWR<LeadVisit[]>(
    leadId ? `/api/customers/${leadId}/visits` : null,
    () => fetchLeadVisits(leadId as string)
  );
  const { data: proposals = [] } = useSWR<Record<string, unknown>[]>(
    leadId ? `/api/customers/${leadId}/proposals` : null,
    () => fetchLeadProposals(leadId as string)
  );

  useEffect(() => {
    setTimelineVisibleCount(14);
    setCollapsedDays({});
    setQuickSheet("none");
    setNoteImagePreviewUrls([]);
  }, [leadId]);

  const tabCounts = useMemo(
    () => ({
      timeline: timeline.length,
      reminders: reminders.length,
      notes: notes.length,
      visits: visits.length,
      proposals: proposals.length,
    }),
    [timeline.length, reminders.length, notes.length, visits.length, proposals.length]
  );

  const timelineGroups = useMemo(() => {
    const visible = timeline.slice(0, timelineVisibleCount);
    return visible.reduce<Record<string, CustomerTimelineItem[]>>((acc, ev) => {
      const at = ev.kind === "crm" ? ev.occurred_at : ev.occurred_at;
      const key = toDayKey(at);
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(ev);
      return acc;
    }, {});
  }, [timeline, timelineVisibleCount]);

  const overdueReminderIds = useMemo(() => {
    const now = Date.now();
    return new Set(reminders.filter((r) => r.status === "pending" && new Date(r.due_at).getTime() < now).map((r) => r.id));
  }, [reminders]);

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort((a, b) => {
        const aOver = overdueReminderIds.has(a.id) ? 0 : 1;
        const bOver = overdueReminderIds.has(b.id) ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      }),
    [overdueReminderIds, reminders]
  );

  async function submitReminder() {
    if (!newReminderTitle.trim() || !newReminderDueAt) return;
    const dueAtIso = crmDatetimeLocalToIso(newReminderDueAt);
    const optimistic: FollowupReminder = {
      id: `tmp-${Date.now()}`,
      lead_id: leadId,
      title: newReminderTitle.trim(),
      due_at: dueAtIso,
      followup_type: newReminderType,
      priority: newReminderPriority,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: null,
      snoozed_until: null,
      completed_at: null,
      proposal_id: null,
      project_id: null,
    };
    await mutateReminders((prev = []) => [optimistic, ...prev], { revalidate: false });
    setQuickSheet("none");
    setNewReminderTitle("");
    setNewReminderDueAt("");
    try {
      await createReminder(leadId, {
        title: optimistic.title,
        due_at: optimistic.due_at,
        followup_type: optimistic.followup_type,
        priority: optimistic.priority,
        status: "pending",
      });
    } finally {
      await mutateReminders();
      await mutateTimeline();
    }
  }

  async function completeReminder(id: string) {
    await mutateReminders(
      (prev = []) => prev.map((r) => (r.id === id ? { ...r, status: "completed", completed_at: new Date().toISOString() } : r)),
      { revalidate: false }
    );
    try {
      await patchReminder(id, { status: "completed" });
    } finally {
      await mutateReminders();
      await mutateTimeline();
    }
  }

  async function snoozeReminder(id: string, days: number) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await mutateReminders(
      (prev = []) => prev.map((r) => (r.id === id ? { ...r, status: "snoozed", snoozed_until: until } : r)),
      { revalidate: false }
    );
    try {
      await patchReminder(id, { status: "snoozed", snoozed_until: until });
    } finally {
      await mutateReminders();
      await mutateTimeline();
    }
  }

  function onReminderTouchStart(e: TouchEvent<HTMLDivElement>) {
    setTouchStartX(e.changedTouches[0]?.clientX ?? null);
  }

  function onReminderTouchEnd(e: TouchEvent<HTMLDivElement>, reminderId: string) {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    setTouchStartX(null);
    if (delta > 70) void completeReminder(reminderId);
    if (delta < -70) void snoozeReminder(reminderId, 1);
  }

  async function submitNote() {
    if (!newNote.trim()) return;
    const optimistic: LeadNote = {
      id: `tmp-note-${Date.now()}`,
      lead_id: leadId,
      body_text: newNote.trim(),
      attachments_json: noteImagePreviewUrls.map((url, idx) => ({ id: `img-${idx}`, url, kind: "image" })),
      voice_ref: null,
      sketch_ref: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await mutateNotes((prev = []) => [optimistic, ...prev], { revalidate: false });
    setNewNote("");
    setNoteImagePreviewUrls([]);
    setQuickSheet("none");
    try {
      await createLeadNote(leadId, { body_text: optimistic.body_text });
    } finally {
      await mutateNotes();
      await mutateTimeline();
    }
  }

  async function submitVisit() {
    if (!visitAt) return;
    const optimistic: LeadVisit = {
      id: `tmp-visit-${Date.now()}`,
      lead_id: leadId,
      scheduled_at: crmDatetimeLocalToIso(visitAt),
      visit_status: "scheduled",
      summary: visitSummary.trim() || null,
      location: visitLocation.trim() || null,
      proposal_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await mutateVisits((prev = []) => [optimistic, ...prev], { revalidate: false });
    setVisitAt("");
    setVisitSummary("");
    setVisitLocation("");
    setQuickSheet("none");
    try {
      await createLeadVisit(leadId, {
        scheduled_at: optimistic.scheduled_at,
        summary: optimistic.summary ?? undefined,
        location: optimistic.location ?? undefined,
        visit_status: "scheduled",
      });
    } finally {
      await mutateVisits();
      await mutateTimeline();
    }
  }

  async function addVisitOutcome(outcome: "visited" | "not_available" | "interested" | "callback_later") {
    const label =
      outcome === "visited"
        ? "Visit done"
        : outcome === "not_available"
          ? "Customer not available"
          : outcome === "interested"
            ? "Customer interested"
            : "Callback later";
    await createLeadNote(leadId, { body_text: label });
    if (outcome === "callback_later") {
      await createReminder(leadId, {
        title: "Callback after visit",
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        followup_type: "call",
        priority: "medium",
      });
      await mutateReminders();
    }
    await mutateNotes();
    await mutateTimeline();
  }

  function eventLabel(ev: CustomerTimelineItem) {
    const at = ev.kind === "crm" ? ev.occurred_at : ev.occurred_at;
    const when = formatCrmTime(at);
    if (ev.kind === "project_milestone") {
      return `${ev.event_title} · ${when}`;
    }
    return `${ev.event_type.replaceAll("_", " ")} · ${when}`;
  }

  function onNoteImagesSelected(files: FileList | null) {
    if (!files) return;
    setNoteImagePreviewUrls(Array.from(files).slice(0, 4).map((f) => URL.createObjectURL(f)));
  }

  function toggleDay(day: string) {
    setCollapsedDays((p) => ({ ...p, [day]: !p[day] }));
  }

  const hasMoreTimeline = timelineVisibleCount < timeline.length;
  const timelineDays = Object.entries(timelineGroups);
  const quickActionButtons = [
    { id: "reminder" as const, label: "Reminder", icon: AlarmClock },
    { id: "visit" as const, label: "Visit", icon: CalendarClock },
    { id: "note" as const, label: "Quick note", icon: StickyNote },
  ];

  if (!customer) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50 p-6 text-center dark:border-white/15 dark:bg-white/[0.03]">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t("customers_workspaceEmptyTitle")}</p>
        <p className="mt-2 max-w-[16rem] text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {t("customers_workspaceEmptySub")}
        </p>
      </div>
    );
  }

  const statusKey = normalizeLeadStatus(customer.status);
  const bill = Number(customer.monthly_bill || 0);
  const ts = followMap[customer.id];
  const followLabel = customer.next_followup_at
    ? formatCrmDateTime(customer.next_followup_at)
    : ts != null
      ? formatLastFollowUpLocale(locale, ts)
      : t("customers_neverFollowedUp");
  const waUrl = customer.phone ? buildLeadWhatsAppUrl(customer.phone, customer.name, installerName, locale) : null;
  const statusLabel = t(LEAD_STATUS_I18N_KEY[statusKey]);
  const stale = isLeadStale(customer.last_touched_at);
  const stage = (customer.customer_stage ?? "lead") as CustomerStage;
  const stageMeta = CUSTOMER_STAGE_META[stage];
  const commercialCta = resolveCustomerCommercialCta(customer);
  const lastActivityAt = customer.last_activity_at ?? customer.last_touched_at ?? null;
  const lastActivityLabel = lastActivityAt
    ? formatCrmDateTime(lastActivityAt)
    : formatLeadLastActivity(customer.last_touched_at, locale);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-200/40 dark:border-white/10 dark:bg-[#0c1017] dark:ring-white/[0.06]">
      <div className="sticky top-0 z-20 shrink-0 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#0c1017]/95">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("customers_workspaceTitle")}</p>
        <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-50">{customer.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", stageMeta.className)}>
            {t(stageMeta.labelKey)}
          </span>
          {onStatusChange ? (
            <LeadStatusPillSelect leadId={customer.id} statusKey={statusKey} label={statusLabel} t={t} onChange={onStatusChange} />
          ) : (
            <LeadStatusBadge statusKey={statusKey} label={statusLabel} />
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 pb-28">
        {customer.phone ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <PhoneCall className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.85} aria-hidden />
            <span className="min-w-0 break-all tabular-nums leading-snug">{formatLeadPhoneForDisplay(customer.phone)}</span>
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-400">{t("customers_noPhoneOnFile")}</p>
        )}

        <div className="space-y-2 rounded-xl bg-slate-50/90 p-3 text-sm dark:bg-white/[0.05]">
          <p className="flex items-start gap-2 font-semibold text-slate-800 dark:text-slate-100">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
            <span>
              <span className="block">{customer.city}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {customer.discom}
              </span>
            </span>
          </p>
          <p className="flex items-center gap-2 border-t border-slate-200/80 pt-2 dark:border-white/10">
            <IndianRupee className="h-4 w-4 text-slate-500" strokeWidth={2.5} aria-hidden />
            <span>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("customers_monthlyBillShort")}</span>
              <span className="ml-2 text-base font-black tabular-nums text-slate-900 dark:text-slate-50">₹{bill.toLocaleString("en-IN")}</span>
            </span>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-500">{t("customers_mobileLastActivity")}: </span>
            {lastActivityLabel}
            {stale ? <span className="ml-2 font-bold text-amber-600"> · {t("customers_staleHintShort")}</span> : null}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-500">{t("customers_lastFollowUpLabel")}: </span>
            {followLabel}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {customer.phone ? (
            <a href={`tel:${customer.phone}`} onClick={() => handlePhoneCall(customer.id)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-sm font-bold text-white shadow-sm active:bg-indigo-700">
              <Phone className="h-4 w-4" aria-hidden />
              Call now
            </a>
          ) : null}
          {waUrl ? (
            <button type="button" onClick={() => openWhatsApp(customer.id, waUrl)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 active:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </button>
          ) : null}
          <Link href={commercialCta.href} className="ss-cta-primary min-h-12 w-full text-center text-sm">
            {t(commercialCta.labelKey)}
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white/90 p-2 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {([
              ["timeline", "Timeline"],
              ["reminders", "Reminders"],
              ["notes", "Notes"],
              ["visits", "Visits"],
              ["proposals", "Proposals"],
            ] as [FollowupTab, string][]).map(([tab, label]) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("rounded-lg px-3 py-2 text-[11px] font-bold", activeTab === tab ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300")}>
                {label} ({tabCounts[tab]})
              </button>
            ))}
          </div>

          {activeTab === "timeline" ? (
            <div className="space-y-2">
              {timelineDays.length === 0 ? <p className="text-xs text-slate-500">No activity yet.</p> : null}
              {timelineDays.map(([day, items]) => (
                <div key={day} className="rounded-lg border border-slate-200/80 dark:border-white/10">
                  <button type="button" onClick={() => toggleDay(day)} className="flex w-full items-center justify-between px-2.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span>{day}</span>
                    <span>{collapsedDays[day] ? "+" : "-"}</span>
                  </button>
                  {!collapsedDays[day] ? (
                    <div className="space-y-1.5 border-t border-slate-200/80 p-2 dark:border-white/10">
                      {items.map((ev) => {
                        const iconKey = ev.kind === "crm" ? ev.event_type : ev.event_type;
                        const Icon = EVENT_ICON[iconKey] ?? Clock3;
                        return (
                          <div key={ev.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs dark:bg-white/5">
                            <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                            <span className="text-slate-700 dark:text-slate-200">{eventLabel(ev)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
              {hasMoreTimeline ? (
                <button type="button" onClick={() => setTimelineVisibleCount((n) => n + 12)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                  Load older activity
                </button>
              ) : null}
            </div>
          ) : null}

          {activeTab === "reminders" ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">Swipe right to complete, left to snooze 1 day.</p>
              {sortedReminders.length === 0 ? <p className="text-xs text-slate-500">No reminders yet.</p> : null}
              {sortedReminders.map((r) => (
                <div key={r.id} onTouchStart={onReminderTouchStart} onTouchEnd={(e) => onReminderTouchEnd(e, r.id)} className={cn("rounded-xl border p-2.5 text-xs", overdueReminderIds.has(r.id) ? "border-rose-300 bg-rose-50/70 dark:border-rose-500/40 dark:bg-rose-950/20" : "border-slate-200/80 dark:border-white/10")}>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-slate-600 dark:text-slate-300">{formatCrmDateTime(r.due_at)} · {r.followup_type} · {r.priority}</p>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={() => void completeReminder(r.id)} className="flex-1 rounded-lg bg-emerald-600 px-2 py-2 text-[11px] font-bold text-white">Complete</button>
                    <button type="button" onClick={() => void snoozeReminder(r.id, 1)} className="flex-1 rounded-lg bg-amber-500 px-2 py-2 text-[11px] font-bold text-white">Snooze</button>
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} onClick={() => handlePhoneCall(customer.id)} className="flex-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-2 text-center text-[11px] font-bold text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950/30 dark:text-indigo-200">
                        Call now
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "notes" ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">Voice note + Apple Pencil sketch hooks are ready via `voice_ref` and `sketch_ref`.</p>
              {noteImagePreviewUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {noteImagePreviewUrls.map((url) => (
                    <img key={url} src={url} alt="Note attachment preview" className="h-20 w-full rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-200/80 px-2 py-1.5 text-xs dark:border-white/10">
                  <p>{n.body_text || "—"}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "visits" ? (
            <div className="space-y-2">
              <button type="button" onClick={() => setQuickSheet("visit")} className="inline-flex min-h-12 w-full items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white">
                <CalendarClock className="h-4 w-4" /> Schedule Visit
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => void addVisitOutcome("visited")} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-2 text-[11px] font-bold text-emerald-700">Visited</button>
                <button type="button" onClick={() => void addVisitOutcome("not_available")} className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-[11px] font-bold text-amber-700">Not available</button>
                <button type="button" onClick={() => void addVisitOutcome("interested")} className="rounded-lg border border-sky-300 bg-sky-50 px-2 py-2 text-[11px] font-bold text-sky-700">Interested</button>
                <button type="button" onClick={() => void addVisitOutcome("callback_later")} className="rounded-lg border border-violet-300 bg-violet-50 px-2 py-2 text-[11px] font-bold text-violet-700">Callback later</button>
              </div>
              {visits.map((v) => (
                <p key={v.id} className="rounded-lg border border-slate-200/80 px-2 py-1.5 text-xs dark:border-white/10">
                  {formatCrmDateTime(v.scheduled_at)} · {v.visit_status} {v.location ? `· ${v.location}` : ""}
                </p>
              ))}
            </div>
          ) : null}

          {activeTab === "proposals" ? (
            <div className="space-y-1.5">
              {proposals.length === 0 ? <p className="text-xs text-slate-500">No proposals linked yet.</p> : null}
              {proposals.map((p) => {
                const id = String(p.id ?? "");
                return (
                  <Link
                    key={id}
                    href={buildProposalEditHref({ leadId, proposalId: id })}
                    className="block rounded-lg border border-slate-200/80 px-2 py-1.5 text-xs hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    {String(p.customer_name ?? "Proposal")} · {String(p.generated_at ?? "").slice(0, 10)}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-slate-200/80 bg-white/95 p-2.5 backdrop-blur dark:border-white/10 dark:bg-[#0c1017]/95">
        <div className="flex items-center gap-2">
          {quickActionButtons.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.id} type="button" onClick={() => setQuickSheet(action.id)} className={cn("inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl px-2 text-xs font-bold", quickSheet === action.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200")}>
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {quickSheet !== "none" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border border-slate-200/80 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#0c1017]">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
          {quickSheet === "reminder" ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-100">Quick reminder</p>
              <input value={newReminderTitle} onChange={(e) => setNewReminderTitle(e.target.value)} placeholder="Reminder title" className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent" />
              <div className="grid grid-cols-2 gap-2">
                <input type="datetime-local" value={newReminderDueAt} onChange={(e) => setNewReminderDueAt(e.target.value)} className="rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent" />
                <select value={newReminderType} onChange={(e) => setNewReminderType(e.target.value as FollowupReminder["followup_type"])} className="rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent">
                  <option value="call">Call</option>
                  <option value="visit">Visit</option>
                  <option value="proposal">Proposal</option>
                  <option value="payment">Payment</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={newReminderPriority} onChange={(e) => setNewReminderPriority(e.target.value as FollowupReminder["priority"])} className="rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button type="button" onClick={() => void submitReminder()} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md bg-indigo-600 text-sm font-bold text-white">
                  <Plus className="h-4 w-4" /> Add reminder
                </button>
              </div>
            </div>
          ) : null}

          {quickSheet === "note" ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-100">Quick note</p>
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Field note..." rows={3} className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent" />
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
                <Plus className="h-3.5 w-3.5" />
                Add image preview
                <input type="file" accept="image/*" className="hidden" multiple onChange={(e) => onNoteImagesSelected(e.target.files)} />
              </label>
              <button type="button" onClick={() => void submitNote()} className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-md bg-indigo-600 text-sm font-bold text-white">
                <StickyNote className="h-4 w-4" /> Save note
              </button>
            </div>
          ) : null}

          {quickSheet === "visit" ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-100">Schedule visit</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} className="rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent" />
                <input value={visitLocation} onChange={(e) => setVisitLocation(e.target.value)} placeholder="Location" className="rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent" />
              </div>
              <input value={visitSummary} onChange={(e) => setVisitSummary(e.target.value)} placeholder="Visit note" className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm dark:border-white/10 dark:bg-transparent" />
              <button type="button" onClick={() => void submitVisit()} className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-md bg-indigo-600 text-sm font-bold text-white">
                <CalendarClock className="h-4 w-4" /> Confirm visit
              </button>
            </div>
          ) : null}

          <button type="button" onClick={() => setQuickSheet("none")} className="mt-2 w-full rounded-md border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
