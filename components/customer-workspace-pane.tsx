"use client";

import Link from "next/link";
import { Building2, CalendarClock, IndianRupee, MapPin, MessageCircle, Phone, PhoneCall } from "lucide-react";
import useSWR from "swr";

import {
  LeadStatusBadge,
  LeadStatusPillSelect,
  formatLeadLastActivity
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
import type { ActivityEvent, FollowupReminder, LeadNote, LeadVisit } from "@/lib/followup-types";
import { useCallback, useEffect, useMemo, useState } from "react";

type CustomerStage = "lead" | "in-pipeline" | "active-project";
type FollowupTab = "timeline" | "reminders" | "notes" | "visits" | "proposals";

const CUSTOMER_STAGE_META: Record<CustomerStage, { labelKey: string; className: string }> = {
  lead: {
    labelKey: "customers_stageLead",
    className: "border-slate-200/90 bg-slate-50/90 text-slate-700"
  },
  "in-pipeline": {
    labelKey: "customers_stageInPipeline",
    className: "border-amber-200/90 bg-amber-50/90 text-amber-800"
  },
  "active-project": {
    labelKey: "customers_stageActiveProject",
    className: "border-emerald-200/90 bg-emerald-50/90 text-emerald-800"
  }
};

export function CustomerWorkspacePane({
  customer,
  onStatusChange
}: {
  customer: CustomerLead | null;
  onStatusChange?: (leadId: string, next: LeadStatusKey) => void;
}) {
  const { locale, t } = useLanguage();
  const installerName = getInstallerBrandName();
  const [followMap, setFollowMap] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<FollowupTab>("timeline");
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDueAt, setNewReminderDueAt] = useState("");
  const [newReminderType, setNewReminderType] = useState<FollowupReminder["followup_type"]>("call");
  const [newReminderPriority, setNewReminderPriority] = useState<FollowupReminder["priority"]>("medium");
  const [newNote, setNewNote] = useState("");
  const [visitAt, setVisitAt] = useState("");
  const [visitSummary, setVisitSummary] = useState("");
  const [visitLocation, setVisitLocation] = useState("");

  const refreshFollowMap = useCallback(() => {
    setFollowMap({ ...readLeadFollowUpMap() });
  }, []);

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
  const followLabel = ts != null ? formatLastFollowUpLocale(locale, ts) : t("customers_neverFollowedUp");
  const waUrl = customer.phone ? buildLeadWhatsAppUrl(customer.phone, customer.name, installerName, locale) : null;
  const statusLabel = t(LEAD_STATUS_I18N_KEY[statusKey]);
  const stale = isLeadStale(customer.last_touched_at);
  const stage = (customer.customer_stage ?? "lead") as CustomerStage;
  const stageMeta = CUSTOMER_STAGE_META[stage];
  const commercialCta = resolveCustomerCommercialCta(customer);
  const lastActivityLabel = formatLeadLastActivity(customer.last_touched_at, locale);
  const leadId = customer.id;
  const timelineKey = leadId ? `/api/customers/${leadId}/timeline` : null;
  const remindersKey = leadId ? `/api/customers/${leadId}/reminders` : null;
  const notesKey = leadId ? `/api/customers/${leadId}/notes` : null;
  const visitsKey = leadId ? `/api/customers/${leadId}/visits` : null;
  const proposalsKey = leadId ? `/api/customers/${leadId}/proposals` : null;

  const { data: timeline = [], mutate: mutateTimeline } = useSWR<ActivityEvent[]>(
    timelineKey,
    () => fetchLeadTimeline(leadId)
  );
  const { data: reminders = [], mutate: mutateReminders } = useSWR<FollowupReminder[]>(
    remindersKey,
    () => fetchLeadReminders(leadId)
  );
  const { data: notes = [], mutate: mutateNotes } = useSWR<LeadNote[]>(notesKey, () => fetchLeadNotes(leadId));
  const { data: visits = [], mutate: mutateVisits } = useSWR<LeadVisit[]>(visitsKey, () => fetchLeadVisits(leadId));
  const { data: proposals = [] } = useSWR<Record<string, unknown>[]>(proposalsKey, () => fetchLeadProposals(leadId));

  const tabCounts = useMemo(
    () => ({
      timeline: timeline.length,
      reminders: reminders.length,
      notes: notes.length,
      visits: visits.length,
      proposals: proposals.length,
    }),
    [notes.length, proposals.length, reminders.length, timeline.length, visits.length]
  );

  async function submitReminder() {
    if (!newReminderTitle.trim() || !newReminderDueAt) return;
    const dueAtIso = new Date(newReminderDueAt).toISOString();
    await createReminder(leadId, {
      title: newReminderTitle.trim(),
      due_at: dueAtIso,
      followup_type: newReminderType,
      priority: newReminderPriority,
      status: "pending",
    });
    setNewReminderTitle("");
    setNewReminderDueAt("");
    await mutateReminders();
    await mutateTimeline();
  }

  async function completeReminder(id: string) {
    await patchReminder(id, { status: "completed" });
    await mutateReminders();
    await mutateTimeline();
  }

  async function snoozeReminder(id: string, days: number) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await patchReminder(id, { status: "snoozed", snoozed_until: until });
    await mutateReminders();
    await mutateTimeline();
  }

  async function submitNote() {
    if (!newNote.trim()) return;
    await createLeadNote(leadId, { body_text: newNote.trim() });
    setNewNote("");
    await mutateNotes();
    await mutateTimeline();
  }

  async function submitVisit() {
    if (!visitAt) return;
    await createLeadVisit(leadId, {
      scheduled_at: new Date(visitAt).toISOString(),
      summary: visitSummary.trim() || undefined,
      location: visitLocation.trim() || undefined,
      visit_status: "scheduled",
    });
    setVisitAt("");
    setVisitSummary("");
    setVisitLocation("");
    await mutateVisits();
    await mutateTimeline();
  }

  function eventLabel(ev: ActivityEvent) {
    const when = new Date(ev.occurred_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    return `${ev.event_type.replaceAll("_", " ")} · ${when}`;
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-200/40 dark:border-white/10 dark:bg-[#0c1017] dark:ring-white/[0.06]">
      <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#0c1017]/95">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("customers_workspaceTitle")}</p>
        <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-slate-50">{customer.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              stageMeta.className
            )}
          >
            {t(stageMeta.labelKey)}
          </span>
          {onStatusChange ? (
            <LeadStatusPillSelect
              leadId={customer.id}
              statusKey={statusKey}
              label={statusLabel}
              t={t}
              onChange={onStatusChange}
            />
          ) : (
            <LeadStatusBadge statusKey={statusKey} label={statusLabel} />
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
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
            <a
              href={`tel:${customer.phone}`}
              onClick={() => handlePhoneCall(customer.id)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-sm font-bold text-white shadow-sm active:bg-indigo-700"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {t("customers_mobileCall")}
            </a>
          ) : null}
          {waUrl ? (
            <button
              type="button"
              onClick={() => openWhatsApp(customer.id, waUrl)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50 px-3 text-sm font-bold text-emerald-800 active:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t("customers_whatsappShort")}
            </button>
          ) : null}
          <Link
            href={commercialCta.href}
            className="ss-cta-primary min-h-11 w-full text-center text-sm"
          >
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
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-bold",
                  activeTab === tab ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                )}
              >
                {label} ({tabCounts[tab]})
              </button>
            ))}
          </div>

          {activeTab === "timeline" ? (
            <div className="space-y-1.5">
              {timeline.length === 0 ? <p className="text-xs text-slate-500">No activity yet.</p> : null}
              {timeline.map((ev) => (
                <p key={ev.id} className="rounded-lg border border-slate-200/80 px-2 py-1.5 text-xs text-slate-700 dark:border-white/10 dark:text-slate-200">
                  {eventLabel(ev)}
                </p>
              ))}
            </div>
          ) : null}

          {activeTab === "reminders" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  placeholder="Reminder title"
                  className="col-span-2 rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent"
                />
                <input
                  type="datetime-local"
                  value={newReminderDueAt}
                  onChange={(e) => setNewReminderDueAt(e.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent"
                />
                <select
                  value={newReminderType}
                  onChange={(e) => setNewReminderType(e.target.value as FollowupReminder["followup_type"])}
                  className="rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent"
                >
                  <option value="call">Call</option>
                  <option value="visit">Visit</option>
                  <option value="proposal">Proposal</option>
                  <option value="payment">Payment</option>
                  <option value="general">General</option>
                </select>
                <select
                  value={newReminderPriority}
                  onChange={(e) => setNewReminderPriority(e.target.value as FollowupReminder["priority"])}
                  className="rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button type="button" onClick={() => void submitReminder()} className="rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-bold text-white">
                  Add
                </button>
              </div>
              {reminders.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-200/80 p-2 text-xs dark:border-white/10">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-slate-500">{new Date(r.due_at).toLocaleString("en-IN")} · {r.followup_type} · {r.priority}</p>
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => void completeReminder(r.id)} className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">Complete</button>
                    <button type="button" onClick={() => void snoozeReminder(r.id, 1)} className="rounded bg-amber-500 px-2 py-1 text-[10px] font-bold text-white">Snooze 1d</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "notes" ? (
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write follow-up note..."
                rows={3}
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent"
              />
              <button type="button" onClick={() => void submitNote()} className="rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-bold text-white">Save note</button>
              <p className="text-[10px] text-slate-500">Image notes supported now. Voice/Pencil sketch architecture reserved via `voice_ref` / `sketch_ref`.</p>
              {notes.map((n) => (
                <p key={n.id} className="rounded-lg border border-slate-200/80 px-2 py-1.5 text-xs dark:border-white/10">{n.body_text || "—"}</p>
              ))}
            </div>
          ) : null}

          {activeTab === "visits" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <input type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent" />
                <input value={visitLocation} onChange={(e) => setVisitLocation(e.target.value)} placeholder="Visit location" className="rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent" />
                <input value={visitSummary} onChange={(e) => setVisitSummary(e.target.value)} placeholder="Visit note" className="col-span-2 rounded-md border border-slate-200 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-transparent" />
                <button type="button" onClick={() => void submitVisit()} className="inline-flex items-center justify-center gap-1 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-bold text-white">
                  <CalendarClock className="h-3 w-3" /> Schedule
                </button>
              </div>
              {visits.map((v) => (
                <p key={v.id} className="rounded-lg border border-slate-200/80 px-2 py-1.5 text-xs dark:border-white/10">
                  {new Date(v.scheduled_at).toLocaleString("en-IN")} · {v.visit_status} {v.location ? `· ${v.location}` : ""}
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
                  <Link key={id} href={`/proposals/${id}`} className="block rounded-lg border border-slate-200/80 px-2 py-1.5 text-xs hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                    {String(p.customer_name ?? "Proposal")} · {String(p.generated_at ?? "").slice(0, 10)}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
