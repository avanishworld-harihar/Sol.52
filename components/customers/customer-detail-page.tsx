"use client";

import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import {
  AlarmClock,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  IndianRupee,
  MapPin,
  NotebookPen,
  Paperclip,
  Phone,
  PhoneCall,
  PhoneMissed,
  Plus,
  Save,
  TimerReset,
  UserRoundCheck,
  Zap,
  FolderKanban,
  FolderOpen,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isTabletSplitViewport } from "@/lib/tablet-split-view";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import type { CustomerLead } from "@/lib/types";
import {
  LEAD_STATUS_BADGE,
  LEAD_STATUS_OPTIONS,
  normalizeLeadStatus,
  type LeadStatusKey,
} from "@/lib/lead-status";
import {
  fetchLeadReminders,
  fetchLeadTimeline,
  patchReminder,
} from "@/lib/followup-client";
import type { FollowupReminder } from "@/lib/followup-types";
import type { CustomerTimelineItem } from "@/lib/customer-timeline-store";
import { CustomerDocumentsHub } from "@/components/customers/customer-documents-hub";
import { QuickQuoteLauncher } from "@/components/proposals/quick-quote-launcher";
import { ScheduleCallbackSheet } from "@/components/crm/schedule-callback-sheet";
import { CallbackStatusBadge } from "@/components/crm/callback-status-badge";
import { describeCallback } from "@/lib/crm-callback-display";
import { cn } from "@/lib/utils";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import { quickQuoteLabelsFromT } from "@/lib/proposal-hub-i18n";
import { useLanguage } from "@/lib/language-context";
import { useRouter } from "next/navigation";
import {
  crmDatetimeLocalToIso,
  crmNowDatetimeLocal,
  formatCrmDate,
  formatCrmDateTime,
  formatCrmDayLabel,
  formatCrmTime,
} from "@/lib/crm-datetime";

/* ---------- types ---------- */

export const CALL_OUTCOMES = [
  { value: "no_answer",         label: "No Answer",         cls: "text-slate-600 bg-slate-50 border-slate-200" },
  { value: "busy",              label: "Busy",              cls: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "interested",        label: "Interested",        cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "followup_required", label: "Follow-up Required", cls: "text-sky-700 bg-sky-50 border-sky-200" },
  { value: "proposal_sent",     label: "Proposal Sent",     cls: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { value: "not_interested",    label: "Not Interested",    cls: "text-rose-700 bg-rose-50 border-rose-200" },
  { value: "answered",          label: "Answered",          cls: "text-teal-700 bg-teal-50 border-teal-200" },
  { value: "voicemail",         label: "Voicemail",         cls: "text-violet-700 bg-violet-50 border-violet-200" },
  { value: "callback_requested", label: "Callback Requested", cls: "text-cyan-700 bg-cyan-50 border-cyan-200" },
] as const;

type CallOutcomeValue = (typeof CALL_OUTCOMES)[number]["value"];

type CallLog = {
  id: string;
  lead_id: string;
  called_at: string;
  duration_seconds: number;
  outcome: CallOutcomeValue;
  notes: string | null;
  created_at: string;
};

/* ---------- helpers ---------- */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error ?? "request_failed");
  return json.data as T;
}

function fmtDuration(sec: number) {
  if (!sec) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function getOutcomeMeta(outcome: string) {
  const found = CALL_OUTCOMES.find((o) => o.value === outcome);
  return found
    ? { label: found.label, cls: found.cls }
    : { label: outcome.replace(/_/g, " "), cls: "text-slate-600 bg-slate-50 border-slate-200" };
}

const EVENT_META: Record<
  string,
  { icon: typeof Clock3; label: string; cls: string }
> = {
  proposal_created: { icon: FileText, label: "Proposal generated", cls: "bg-teal-100 text-teal-700" },
  proposal_opened: { icon: FileText, label: "Proposal viewed", cls: "bg-teal-50 text-teal-600" },
  customer_contacted: { icon: PhoneCall, label: "Contacted", cls: "bg-violet-100 text-violet-700" },
  status_changed: { icon: UserRoundCheck, label: "Stage updated", cls: "bg-sky-100 text-sky-700" },
  reminder_completed: { icon: CheckCircle2, label: "Reminder done", cls: "bg-emerald-100 text-emerald-700" },
  followup_created: { icon: AlarmClock, label: "Follow-up added", cls: "bg-amber-100 text-amber-700" },
  followup_snoozed: { icon: TimerReset, label: "Snoozed", cls: "bg-slate-100 text-slate-600" },
  visit_scheduled: { icon: CalendarClock, label: "Visit scheduled", cls: "bg-indigo-100 text-indigo-700" },
  visit_completed: { icon: CheckCircle2, label: "Visit done", cls: "bg-indigo-100 text-indigo-700" },
  note_added: { icon: NotebookPen, label: "Note added", cls: "bg-rose-100 text-rose-600" },
  file_uploaded: { icon: Paperclip, label: "File uploaded", cls: "bg-slate-100 text-slate-700" },
  lead_created: { icon: UserRoundCheck, label: "Lead created", cls: "bg-teal-100 text-teal-700" },
  lead_edited: { icon: UserRoundCheck, label: "Profile updated", cls: "bg-sky-100 text-sky-700" },
  call_logged: { icon: PhoneCall, label: "Call logged", cls: "bg-violet-100 text-violet-700" },
};

const MILESTONE_META: Record<string, { icon: typeof Clock3; label: string; cls: string }> = {
  project_created: { icon: FolderKanban, label: "Project created", cls: "bg-emerald-100 text-emerald-800" },
  stage_changed: { icon: Zap, label: "Project stage", cls: "bg-amber-100 text-amber-800" },
  project_completed: { icon: CheckCircle2, label: "Project completed", cls: "bg-teal-100 text-teal-800" },
  project_archived: { icon: Clock3, label: "Project archived", cls: "bg-slate-100 text-slate-600" },
};

const PIPELINE_STEPS: { key: LeadStatusKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal-sent", label: "Proposal Sent" },
  { key: "site-survey", label: "Site Survey" },
  { key: "design", label: "Design" },
  { key: "won", label: "Won" },
];

const PRIORITY_META = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-orange-50 text-orange-800 border-orange-200",
  urgent: "bg-rose-50 text-rose-800 border-rose-200",
};

/* ---------- sub-components ---------- */

function SectionCard({
  title,
  icon: Icon,
  children,
  action,
  open = true,
}: {
  title: string;
  icon: typeof Phone;
  children: React.ReactNode;
  action?: React.ReactNode;
  /** When false, only the header row is shown (collapsible sections). */
  open?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1017]">
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          open && "border-b border-slate-100 dark:border-white/10"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-teal-600" aria-hidden />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      {open ? <div className="p-4">{children}</div> : null}
    </section>
  );
}

/* ---------- main component ---------- */

export function CustomerDetailPage({ leadId }: { leadId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (isTabletSplitViewport()) {
      router.replace(`/customers?lead=${encodeURIComponent(leadId)}`);
    }
  }, [leadId, router]);

  const quickQuoteLabels = useMemo(() => quickQuoteLabelsFromT(t), [t]);

  /* ------ fetch lead ------ */
  const { data: leadData, mutate: mutateLead } = useSWR<CustomerLead>(
    `/api/customers/${leadId}`,
    () => fetchJson<CustomerLead>(`/api/customers/${leadId}`)
  );

  /* ------ fetch timeline ------ */
  const { data: timeline = [], mutate: mutateTimeline } = useSWR<CustomerTimelineItem[]>(
    `/api/customers/${leadId}/timeline`,
    () => fetchLeadTimeline(leadId)
  );

  /* ------ fetch call logs ------ */
  const { data: callLogs = [], mutate: mutateCallLogs } = useSWR<CallLog[]>(
    `/api/customers/${leadId}/call-logs`,
    () => fetchJson<CallLog[]>(`/api/customers/${leadId}/call-logs`)
  );

  /* ------ fetch reminders ------ */
  const { data: reminders = [], mutate: mutateReminders } = useSWR<FollowupReminder[]>(
    `/api/customers/${leadId}/reminders`,
    () => fetchLeadReminders(leadId)
  );

  const lead = leadData ?? null;
  const [timelineOpen, setTimelineOpen] = useState(false);

  const statusKey = normalizeLeadStatus(lead?.status ?? "new");
  const currentStepIdx = PIPELINE_STEPS.findIndex((s) => s.key === statusKey);

  /* ------ Log call state ------ */
  const [showLogCall, setShowLogCall] = useState(false);
  const [callForm, setCallForm] = useState({
    called_at: crmNowDatetimeLocal(),
    duration_seconds: "",
    outcome: "no_answer" as CallOutcomeValue,
    notes: "",
  });
  const [savingCall, setSavingCall] = useState(false);

  /* ------ Follow-up / callback state ------ */
  const [scheduleOpen, setScheduleOpen] = useState(false);

  /* ------ stage change ------ */
  const [statusChanging, setStatusChanging] = useState(false);
  async function handleStageChange(next: LeadStatusKey) {
    if (next === statusKey || statusChanging) return;
    setStatusChanging(true);
    try {
      const r = await fetch(`/api/customers/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const j = (await r.json()) as { ok?: boolean; data?: CustomerLead; error?: string };
      if (!j.ok) throw new Error(j.error ?? "Failed");
      await mutateLead(j.data, { revalidate: false });
      await globalMutate(`/api/customers/${leadId}/timeline`);
      toast.success("Stage updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update stage");
    } finally {
      setStatusChanging(false);
    }
  }

  /* ------ log call submit ------ */
  async function submitCall() {
    setSavingCall(true);
    try {
      const r = await fetch(`/api/customers/${leadId}/call-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          called_at: crmDatetimeLocalToIso(callForm.called_at),
          duration_seconds: Number(callForm.duration_seconds) || 0,
          outcome: callForm.outcome,
          notes: callForm.notes || null,
        }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        error?: string;
        stage_updated?: { from: string; to: string } | null;
      };
      if (!j.ok) throw new Error(j.error ?? "Failed");
      await Promise.all([mutateCallLogs(), mutateLead(), mutateTimeline()]);
      setShowLogCall(false);
      setCallForm({ called_at: crmNowDatetimeLocal(), duration_seconds: "", outcome: "no_answer", notes: "" });
      toast.success(j.stage_updated ? "Call logged · moved to Contacted" : "Call logged");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log call");
    } finally {
      setSavingCall(false);
    }
  }

  const pendingReminders = useMemo(
    () => reminders.filter((r) => r.status === "pending").sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()),
    [reminders]
  );

  const nextCallback = useMemo(() => {
    const next = pendingReminders[0];
    return next ? describeCallback(next.due_at) : describeCallback(null);
  }, [pendingReminders]);

  const completeReminder = useCallback(async (id: string) => {
    await mutateReminders((prev = []) => prev.map((r) => r.id === id ? { ...r, status: "completed" as const } : r), { revalidate: false });
    try { await patchReminder(id, { status: "completed" }); } finally { await mutateReminders(); }
  }, [mutateReminders]);

  /* ------ timeline groups ------ */
  const timelineGroups = useMemo(() => {
    return timeline.reduce<Record<string, CustomerTimelineItem[]>>((acc, ev) => {
      const at = ev.kind === "crm" ? ev.occurred_at : ev.occurred_at;
      const key = formatCrmDayLabel(at);
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(ev);
      return acc;
    }, {});
  }, [timeline]);

  if (!lead) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-slate-500">Loading customer…</p>
      </div>
    );
  }

  const badge = LEAD_STATUS_BADGE[statusKey];

  return (
    <div className="workspace-page workspace-page--customers mx-auto max-w-3xl space-y-4 px-3 pb-20 pt-4 sm:px-4">

      {/* ── back nav ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm touch-manipulation hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          CRM
        </button>
        <span
          className={cn(
            "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* ── 1. Customer Summary ── */}
      <SectionCard title="Customer Summary" icon={UserRoundCheck}>
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {lead.consumer_name ? (
                <>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">{lead.consumer_name}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Lead: <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.name}</span>
                  </p>
                </>
              ) : (
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{lead.name}</h1>
              )}
            </div>
            {lead.consumer_id ? (
              <span className="text-xs font-mono text-slate-500">CA# {lead.consumer_id}</span>
            ) : null}
          </div>

          <dl className="grid gap-y-2 gap-x-4 sm:grid-cols-2">
            {lead.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <a href={`tel:${lead.phone}`} className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                  {lead.phone}
                </a>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="text-sm text-slate-700 dark:text-slate-300">{lead.discom || "—"}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {[lead.location, lead.city, lead.state].filter(Boolean).join(", ") || "—"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                ₹{lead.monthly_bill.toLocaleString("en-IN")}/mo
              </span>
            </div>

            {lead.connection_type ? (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                  {lead.connection_type}
                </span>
              </div>
            ) : null}
          </dl>

          {/* Pipeline stepper */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline stage</p>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              {PIPELINE_STEPS.map((step, idx) => {
                const done = idx < currentStepIdx;
                const active = idx === currentStepIdx;
                return (
                  <button
                    key={step.key}
                    type="button"
                    disabled={statusChanging}
                    onClick={() => void handleStageChange(step.key)}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase touch-manipulation transition-colors min-w-[3.5rem]",
                      active
                        ? "bg-teal-600 text-white shadow"
                        : done
                          ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-400"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black",
                        active ? "bg-white/20" : done ? "bg-teal-200/60 text-teal-800" : "bg-slate-200/80 text-slate-600"
                      )}
                    >
                      {done ? "✓" : idx + 1}
                    </span>
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <QuickQuoteLauncher
        leadId={leadId}
        customerName={lead.consumer_name?.trim() || lead.name?.trim() || undefined}
        customerPhone={lead.phone}
        connectionPhaseHint={lead.connection_type}
        labels={quickQuoteLabels}
        onCreated={(proposalId) => {
          void Promise.all([mutateTimeline(), mutateLead()]);
          router.push(buildProposalEditHref({ proposalId, leadId, inputMode: "requirement" }));
        }}
      />

      {/* ── 2. Activity Timeline ── */}
      <SectionCard
        title="Activity Timeline"
        icon={Clock3}
        open={timelineOpen}
        action={
          <button
            type="button"
            onClick={() => setTimelineOpen((open) => !open)}
            aria-expanded={timelineOpen}
            aria-label={timelineOpen ? "Collapse activity timeline" : "Expand activity timeline"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", timelineOpen && "rotate-180")}
              aria-hidden
            />
          </button>
        }
      >
        {Object.keys(timelineGroups).length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ol className="space-y-4">
            {Object.entries(timelineGroups).map(([day, events]) => (
              <li key={day}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{day}</p>
                <ol className="space-y-2">
                  {events.map((ev) => {
                    if (ev.kind === "project_milestone") {
                      const meta = MILESTONE_META[ev.event_type] ?? {
                        icon: FolderKanban,
                        label: ev.event_title,
                        cls: "bg-indigo-100 text-indigo-800",
                      };
                      const Icon = meta.icon;
                      const fromStage = ev.meta_json?.from_stage as string | undefined;
                      const toStage = ev.meta_json?.to_stage as string | undefined;
                      return (
                        <li key={ev.id} className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                              meta.cls
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {ev.event_title || meta.label}
                            </p>
                            {ev.project_label ? (
                              <p className="mt-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                                {ev.project_label}
                              </p>
                            ) : null}
                            {ev.event_type === "stage_changed" && fromStage && toStage ? (
                              <p className="mt-0.5 text-[11px] text-slate-600">
                                {String(fromStage).replace(/_/g, " ")} → {String(toStage).replace(/_/g, " ")}
                              </p>
                            ) : null}
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {formatCrmDateTime(ev.occurred_at)}
                            </p>
                          </div>
                        </li>
                      );
                    }

                    const meta = EVENT_META[ev.event_type] ?? {
                      icon: Clock3,
                      label: ev.event_type.replace(/_/g, " "),
                      cls: "bg-slate-100 text-slate-600",
                    };
                    const Icon = meta.icon;
                    const fromStage = ev.meta_json?.from as string | undefined;
                    const toStage = ev.meta_json?.to as string | undefined;
                    const callOutcome = ev.meta_json?.outcome as string | undefined;
                    const changedFields = Array.isArray(ev.meta_json?.fields)
                      ? (ev.meta_json.fields as string[]).join(", ")
                      : null;
                    const fileType = ev.meta_json?.file_type as string | undefined;

                    return (
                      <li key={ev.id} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                            meta.cls
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {meta.label}
                          </p>
                          {(ev.event_type === "status_changed" || ev.event_type === "pipeline_stage_changed") && fromStage && toStage ? (
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                                {LEAD_STATUS_BADGE[normalizeLeadStatus(fromStage)]?.label ?? fromStage}
                              </span>
                              <span className="text-slate-400">→</span>
                              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">
                                {LEAD_STATUS_BADGE[normalizeLeadStatus(toStage)]?.label ?? toStage}
                              </span>
                            </p>
                          ) : null}
                          {ev.event_type === "call_logged" && callOutcome ? (
                            <p className={cn("mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold", getOutcomeMeta(callOutcome).cls)}>
                              {getOutcomeMeta(callOutcome).label}
                            </p>
                          ) : null}
                          {ev.event_type === "lead_edited" && changedFields ? (
                            <p className="mt-0.5 text-[11px] text-slate-500">Fields: {changedFields}</p>
                          ) : null}
                          {ev.event_type === "file_uploaded" && fileType ? (
                            <p className="mt-0.5 text-[11px] capitalize text-slate-500">{fileType.replace(/_/g, " ")}</p>
                          ) : null}
                          <p className="mt-0.5 text-[11px] text-slate-400">{formatCrmDateTime(ev.occurred_at)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      {/* ── 3. Call History ── */}
      <SectionCard
        title="Call History"
        icon={PhoneCall}
        action={
          <Button
            type="button"
            size="sm"
            onClick={() => setShowLogCall(true)}
            className="h-8 gap-1.5 bg-teal-600 text-xs hover:bg-teal-700"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Log Call
          </Button>
        }
      >
        {/* Log call form */}
        {showLogCall ? (
          <div className="mb-4 space-y-3 rounded-xl border border-teal-200/80 bg-teal-50/50 p-3 dark:border-teal-800/40 dark:bg-teal-950/20">
            <p className="text-xs font-bold text-teal-800 dark:text-teal-200">Log a call</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Date & Time</label>
                <input
                  type="datetime-local"
                  value={callForm.called_at}
                  onChange={(e) => setCallForm((p) => ({ ...p, called_at: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Duration (seconds)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="120"
                  value={callForm.duration_seconds}
                  onChange={(e) => setCallForm((p) => ({ ...p, duration_seconds: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Outcome</label>
              <select
                value={callForm.outcome}
                onChange={(e) => setCallForm((p) => ({ ...p, outcome: e.target.value as CallLog["outcome"] }))}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
                >
                  {CALL_OUTCOMES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Notes</label>
              <textarea
                value={callForm.notes}
                onChange={(e) => setCallForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="What was discussed…"
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={savingCall} onClick={() => void submitCall()} className="h-10 gap-1.5 bg-teal-600 hover:bg-teal-700">
                <Save className="h-4 w-4" /> {savingCall ? "Saving…" : "Save"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowLogCall(false)} className="h-10">
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {callLogs.length === 0 && !showLogCall ? (
          <p className="text-sm text-slate-500">No calls logged yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5">Outcome</th>
                  <th className="px-3 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.map((log) => {
                  const om = getOutcomeMeta(log.outcome);
                  return (
                    <tr key={log.id} className="border-b border-slate-100 last:border-0 dark:border-white/[0.05]">
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{formatCrmDate(log.called_at)}</p>
                        <p className="text-[11px] text-slate-500">{formatCrmTime(log.called_at)}</p>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {fmtDuration(log.duration_seconds)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold", om.cls)}>
                          {om.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                        {log.notes ?? <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── 4. Smart callbacks ── */}
      <SectionCard
        title="Smart callbacks"
        icon={AlarmClock}
        action={
          <Button
            type="button"
            size="sm"
            onClick={() => setScheduleOpen(true)}
            className="h-8 gap-1.5 bg-teal-600 text-xs hover:bg-teal-700"
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            Schedule
          </Button>
        }
      >
        {pendingReminders.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
            <CallbackStatusBadge
              dueAt={pendingReminders[0]?.due_at}
              title={pendingReminders[0]?.title}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{nextCallback.label}</span>
          </div>
        ) : null}

        {pendingReminders.length === 0 ? (
          <p className="text-sm text-slate-500">No callback scheduled. Use Schedule for 3-month, post-monsoon, or custom dates.</p>
        ) : (
          <ol className="space-y-2">
            {pendingReminders.map((r) => {
              const info = describeCallback(r.due_at);
              return (
                <li
                  key={r.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3",
                    info.isOverdue
                      ? "border-rose-200/80 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20"
                      : info.state === "today"
                        ? "border-amber-200/70 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/10"
                        : "border-sky-200/70 bg-sky-50/40 dark:border-sky-800/30 dark:bg-sky-950/10"
                  )}
                >
                  <AlarmClock className={cn("mt-0.5 h-4 w-4 shrink-0", info.isOverdue ? "text-rose-600" : "text-amber-600")} aria-hidden />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {info.label}
                      {info.isOverdue ? <span className="ml-2 font-bold text-rose-600">Overdue</span> : null}
                    </p>
                    {r.notes ? <p className="text-xs text-slate-600 dark:text-slate-400">{r.notes}</p> : null}
                    <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", PRIORITY_META[r.priority])}>
                      {r.priority}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void completeReminder(r.id)}
                    className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 touch-manipulation dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                    title="Mark complete"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </SectionCard>

      {/* ── 5. Documents Hub ── */}
      <SectionCard title="Documents" icon={FolderOpen}>
        <CustomerDocumentsHub customerId={leadId} />
      </SectionCard>

      <ScheduleCallbackSheet
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        leadId={leadId}
        customerName={lead.name}
        onScheduled={() => void mutateReminders()}
      />

    </div>
  );
}
