"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Building2, CalendarClock, IndianRupee, MapPin, MessageCircle, Pencil, Phone, PhoneCall, Trash2, Users, Wifi } from "lucide-react";

import type { CustomerLead } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LEAD_STATUS_BADGE,
  LEAD_STATUS_I18N_KEY,
  LEAD_STATUS_OPTIONS,
  normalizeLeadStatus,
  type LeadStatusKey
} from "@/lib/lead-status";
import { getInstallerBrandName } from "@/lib/installer-brand";
import { useLanguage } from "@/lib/language-context";
import { formatLastFollowUpLocale } from "@/lib/time-i18n";
import { formatLeadPhoneForDisplay } from "@/lib/lead-phone";
import { buildLeadWhatsAppUrl } from "@/lib/whatsapp-lead";
import { readLeadFollowUpMap, recordLeadFollowUp } from "@/lib/lead-followup-storage";
import { normalizeSource, SOURCE_META, isLeadStale } from "@/lib/lead-source";
import { resolveCustomerCommercialCta } from "@/lib/customer-crm-cta";
import { formatCrmDateTime, formatCrmShortDate } from "@/lib/crm-datetime";
import { describeCallback } from "@/lib/crm-callback-display";
import { CallbackStatusBadge } from "@/components/crm/callback-status-badge";
import { ScheduleCallbackSheet } from "@/components/crm/schedule-callback-sheet";

export type { CustomerLead };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LeadStatusBadge({ statusKey, label }: { statusKey: LeadStatusKey; label: string }) {
  const meta = LEAD_STATUS_BADGE[statusKey];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center justify-center rounded-full border-[0.5px] px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm sm:text-xs",
        meta.className
      )}
    >
      <span className="leading-tight">{label}</span>
    </span>
  );
}

/**
 * Editable variant — used when the parent passes an `onStatusChange` callback.
 * Visually identical to `LeadStatusBadge` (so the row keeps its color hierarchy)
 * but a real `<select>` underneath, which gives free OS-native pickers on
 * mobile and full a11y/keyboard support on desktop.
 */
export function LeadStatusPillSelect({
  leadId,
  statusKey,
  label,
  t,
  onChange
}: {
  leadId: string;
  statusKey: LeadStatusKey;
  label: string;
  t: (key: string) => string;
  onChange: (leadId: string, next: LeadStatusKey) => void;
}) {
  const meta = LEAD_STATUS_BADGE[statusKey];
  return (
    <span
      className={cn(
        "relative inline-flex max-w-full items-center justify-center rounded-full border-[0.5px] px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm transition-shadow hover:shadow-md sm:text-xs",
        meta.className
      )}
    >
      <span className="pointer-events-none leading-tight">{label}</span>
      <select
        value={statusKey}
        onChange={(e) => {
          const next = e.target.value as LeadStatusKey;
          if (next !== statusKey) onChange(leadId, next);
        }}
        aria-label={`Change pipeline status (currently ${label})`}
        className="absolute inset-0 cursor-pointer rounded-full opacity-0"
      >
        {LEAD_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(LEAD_STATUS_I18N_KEY[opt.value])}
          </option>
        ))}
      </select>
    </span>
  );
}

function LeadMobileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0c1017]">
      <div className="flex gap-3">
        <Skeleton className="h-14 w-14 shrink-0 rounded-2xl bg-slate-200/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-[66%] rounded-md bg-slate-200/80" />
          <Skeleton className="h-4 w-1/2 rounded-md bg-slate-200/60" />
          <Skeleton className="h-10 w-full rounded-xl bg-slate-200/50" />
        </div>
      </div>
    </div>
  );
}

/** Compact blue/red dots; hover, focus, or tap reveals edit/delete icons in place. */
function LeadRowActions({
  onEdit,
  onDelete,
  editAria,
  deleteAria,
  className,
  size = "md"
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editAria: string;
  deleteAria: string;
  className?: string;
  size?: "md" | "sm";
}) {
  const [revealed, setRevealed] = useState(false);
  const shell = size === "sm" ? "h-8 min-w-[2.75rem]" : "h-9 min-w-[3rem]";
  const btn = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-3.5 w-3.5";
  const dot = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  const showIcons = revealed;

  return (
    <div
      className={cn("relative shrink-0", className)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="group"
        aria-label="Lead actions"
        className={cn("group/actions relative flex items-center justify-end", shell)}
        onMouseEnter={() => setRevealed(true)}
        onMouseLeave={() => setRevealed(false)}
        onFocusCapture={() => setRevealed(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setRevealed(false);
        }}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center gap-2 transition-all duration-150",
            showIcons ? "scale-75 opacity-0" : "scale-100 opacity-100"
          )}
          aria-hidden
        >
          {onEdit ? (
            <span className={cn(dot, "rounded-full bg-sky-500 shadow-sm ring-2 ring-sky-400/25")} />
          ) : null}
          {onDelete ? (
            <span className={cn(dot, "rounded-full bg-red-500 shadow-sm ring-2 ring-red-400/25")} />
          ) : null}
        </div>

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-1 transition-all duration-150",
            showIcons
              ? "pointer-events-auto scale-100 opacity-100"
              : "pointer-events-none scale-90 opacity-0"
          )}
        >
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                btn,
                "inline-flex touch-manipulation items-center justify-center rounded-lg border border-sky-200/90 bg-white text-sky-600 shadow-sm transition-colors hover:bg-sky-50 active:bg-sky-100 dark:border-sky-500/35 dark:bg-sky-950/40 dark:text-sky-300"
              )}
              aria-label={editAria}
            >
              <Pencil className={icon} strokeWidth={2} />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className={cn(
                btn,
                "inline-flex touch-manipulation items-center justify-center rounded-lg border border-red-200/90 bg-white text-red-600 shadow-sm transition-colors hover:bg-red-50 active:bg-red-100 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-300"
              )}
              aria-label={deleteAria}
            >
              <Trash2 className={icon} strokeWidth={2} />
            </button>
          ) : null}
        </div>

        {!showIcons ? (
          <button
            type="button"
            className="absolute inset-0 z-[1] touch-manipulation rounded-lg"
            aria-label="Show edit and delete options"
            onClick={() => setRevealed(true)}
          />
        ) : null}
      </div>
    </div>
  );
}

function LeadRowSkeleton() {
  return (
    <div className="border-b border-slate-100 p-4 last:border-b-0 dark:border-white/[0.06] lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 lg:px-5">
      <div className="flex items-center gap-3 lg:col-span-5">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36 rounded-md bg-slate-200/80" />
          <Skeleton className="h-3 w-24 rounded-md bg-slate-200/60" />
        </div>
      </div>
      <Skeleton className="mt-3 hidden h-10 rounded-lg bg-slate-200/60 lg:col-span-3 lg:mt-0 lg:block" />
      <Skeleton className="mt-2 hidden h-8 w-20 rounded-lg bg-slate-200/60 lg:col-span-2 lg:mt-0 lg:block" />
      <div className="mt-3 flex justify-start lg:col-span-2 lg:mt-0 lg:justify-end">
        <Skeleton className="h-7 w-28 rounded-full bg-slate-200/70" />
      </div>
    </div>
  );
}

/**
 * Tiny source attribution pill rendered on each lead row.
 * Stripe/Linear style: muted, informational, never competes with status.
 */
function LeadSourceBadge({ sourceRaw }: { sourceRaw: string | null | undefined }) {
  const key = normalizeSource(sourceRaw);
  if (key === "manual") return null;
  const meta = SOURCE_META[key];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border-[0.5px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px]",
        meta.badgeClass
      )}
    >
      <Wifi className="h-2.5 w-2.5 shrink-0" strokeWidth={2.5} />
      {meta.shortLabel}
    </span>
  );
}

type CustomerStage = "lead" | "in-pipeline" | "active-project";

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

export function fmtActivityType(type: string | null | undefined): string {
  if (!type) return "Activity";
  const MAP: Record<string, string> = {
    lead_created: "Lead created",
    lead_edited: "Profile updated",
    status_changed: "Stage changed",
    pipeline_stage_changed: "Stage changed",
    proposal_created: "Proposal generated",
    proposal_opened: "Proposal viewed",
    proposal_downloaded: "Proposal downloaded",
    customer_contacted: "Contacted",
    call_logged: "Call logged",
    followup_created: "Follow-up added",
    reminder_completed: "Follow-up done",
    visit_scheduled: "Visit scheduled",
    visit_completed: "Visit done",
    note_added: "Note added",
    file_uploaded: "File uploaded",
    followup_snoozed: "Snoozed",
  };
  return MAP[type] ?? type.replace(/_/g, " ");
}

export function formatLeadLastActivity(iso: string | null | undefined, locale: string): string {
  return formatCrmShortDate(iso, locale);
}

export function CustomersLeadList({
  customers,
  loading,
  onStatusChange,
  onEditLead,
  onDeleteLead,
  selectedLeadId,
  onSelectLead
}: {
  customers: CustomerLead[];
  loading: boolean;
  /**
   * When provided, the status badge becomes an inline dropdown. The parent
   * owns optimistic SWR updates + PATCH so the list stays a pure presentation
   * component.
   */
  onStatusChange?: (leadId: string, next: LeadStatusKey) => void;
  onEditLead?: (customer: CustomerLead) => void;
  onDeleteLead?: (customer: CustomerLead) => void;
  /** Tablet split-pane: highlights row and syncs right workspace. */
  selectedLeadId?: string | null;
  onSelectLead?: (leadId: string) => void;
}) {
  const { locale, t } = useLanguage();
  const showHeader = !loading && customers.length > 0;
  const installerName = getInstallerBrandName();
  const [followMap, setFollowMap] = useState<Record<string, number>>({});
  const [scheduleTarget, setScheduleTarget] = useState<CustomerLead | null>(null);

  const refreshFollowMap = useCallback(() => {
    setFollowMap({ ...readLeadFollowUpMap() });
  }, []);

  useEffect(() => {
    refreshFollowMap();
  }, [customers, refreshFollowMap]);

  const openWhatsApp = useCallback(
    (leadId: string, url: string) => {
      recordLeadFollowUp(leadId);
      refreshFollowMap();
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [refreshFollowMap]
  );

  /**
   * One-click `tel:` dial — the field-sales team's most-used button. Recording
   * the follow-up locally bumps the "last touched" label immediately;
   * server-side `last_touched_at` is bumped via the lead status PATCH if the
   * stage changes. Tapping the link itself triggers the OS dialer.
   */
  const handlePhoneCall = useCallback(
    (leadId: string) => {
      recordLeadFollowUp(leadId);
      refreshFollowMap();
    },
    [refreshFollowMap]
  );

  return (
    <div className="space-y-4">
      {!loading && customers.length === 0 ? (
        <div className="px-0.5 py-1">
          <CustomersLeadListEmpty t={t} />
        </div>
      ) : null}

      {loading ? (
        <>
          <div className="space-y-3 px-0.5 md:max-lg:space-y-2 lg:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <LeadMobileCardSkeleton key={`m-sk-${i}`} />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1017] lg:block">
            {Array.from({ length: 5 }).map((_, i) => (
              <LeadRowSkeleton key={i} />
            ))}
          </div>
        </>
      ) : null}

      {!loading && customers.length > 0 ? (
        <>
          <div className="space-y-3 px-0.5 md:max-lg:space-y-2 lg:hidden">
            {customers.map((customer) => {
              const statusKey = normalizeLeadStatus(customer.status);
              const commercialCta = resolveCustomerCommercialCta(customer);
              const bill = Number(customer.monthly_bill || 0);
              const ts = followMap[customer.id];
              // Phase 2: prefer server-side next followup; fall back to localStorage
              const nextFollowupAt = customer.next_followup_at ?? null;
              const nextFollowupTitle = customer.next_followup_title ?? null;
              const callbackInfo = describeCallback(nextFollowupAt);
              // Phase 2: last activity from server (activity_events)
              const lastActivityAt = customer.last_activity_at ?? customer.last_touched_at ?? null;
              const lastActivityType = customer.last_activity_type ?? null;
              const lastActivityLabel = lastActivityAt
                ? `${fmtActivityType(lastActivityType)} · ${formatCrmDateTime(lastActivityAt)}`
                : formatLeadLastActivity(customer.last_touched_at, locale);
              const waUrl = customer.phone ? buildLeadWhatsAppUrl(customer.phone, customer.name, installerName, locale) : null;
              const statusLabel = t(LEAD_STATUS_I18N_KEY[statusKey]);
              const stale = isLeadStale(customer.last_touched_at);
              const stage = (customer.customer_stage ?? "lead") as CustomerStage;
              const stageMeta = CUSTOMER_STAGE_META[stage];
              const activeProject = stage === "active-project";
              const canMutateLead =
                Boolean(onEditLead || onDeleteLead) && !customer.id.startsWith("optimistic-");
              // Phase 2: display name — "ConsumerName (LeadName)" or just LeadName
              const displayName = customer.consumer_name
                ? `${customer.consumer_name} (${customer.name})`
                : customer.name;

              return (
                <article
                  key={`m-${customer.id}`}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0c1017]",
                    "md:max-lg:rounded-xl md:max-lg:p-3 md:max-lg:shadow-sm",
                    activeProject && "border-l-[4px] border-l-indigo-500 bg-indigo-50/25 dark:border-l-indigo-400 dark:bg-indigo-950/25",
                    onSelectLead && selectedLeadId === customer.id && "ring-2 ring-brand-500/50 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#0c1017]"
                  )}
                  onClick={(e) => {
                    if (!onSelectLead) return;
                    if ((e.target as HTMLElement).closest("a, button, select, label")) return;
                    onSelectLead(customer.id);
                  }}
                  onKeyDown={
                    onSelectLead
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectLead(customer.id);
                          }
                        }
                      : undefined
                  }
                  role={onSelectLead ? "button" : undefined}
                  tabIndex={onSelectLead ? 0 : undefined}
                >
                  {canMutateLead ? (
                    <LeadRowActions
                      className="absolute right-2 top-2 z-10"
                      size="sm"
                      onEdit={onEditLead ? () => onEditLead(customer) : undefined}
                      onDelete={onDeleteLead ? () => onDeleteLead(customer) : undefined}
                      editAria={t("customers_editLeadAria")}
                      deleteAria={t("customers_deleteLeadAria")}
                    />
                  ) : null}

                  <div className={cn("flex gap-3", canMutateLead ? "pr-12" : "")}>
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-base font-extrabold text-slate-800 dark:border-white/10 dark:bg-[#1a1f28] dark:text-slate-100",
                          "md:max-lg:h-11 md:max-lg:w-11 md:max-lg:rounded-xl md:max-lg:text-sm",
                          stale && "border-amber-300/80 ring-2 ring-amber-400/40"
                        )}
                        aria-hidden
                      >
                        {initials(customer.consumer_name ?? customer.name)}
                      </div>
                      {stale ? (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-amber-400 ring-2 ring-white"
                          title="No activity in 14+ days"
                          aria-label="Stale lead"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="pr-2 text-lg font-extrabold leading-tight text-slate-900 dark:text-slate-50 md:max-lg:text-base">
                        {displayName}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 md:max-lg:mt-1 md:max-lg:gap-1.5">
                        <LeadSourceBadge sourceRaw={customer.source} />
                        <CallbackStatusBadge dueAt={nextFollowupAt} title={nextFollowupTitle} compact />
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                            "md:max-lg:px-2 md:max-lg:py-0.5 md:max-lg:text-[9px]",
                            stageMeta.className
                          )}
                        >
                          {t(stageMeta.labelKey)}
                        </span>
                      </div>
                      <div className="mt-3 max-w-full md:max-lg:mt-2">
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
                  </div>

                  <dl className="mt-4 space-y-3 rounded-2xl bg-slate-50/90 px-4 py-3.5 text-sm dark:bg-white/[0.05] md:max-lg:mt-2 md:max-lg:space-y-2 md:max-lg:rounded-xl md:max-lg:px-3 md:max-lg:py-2.5 md:max-lg:text-[13px]">
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t("customers_tableLocation")}</dt>
                      <dd className="min-w-0 text-right font-semibold text-slate-900 dark:text-slate-100">
                        <span className="block truncate">{customer.city}</span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-slate-600 dark:text-slate-400 md:max-lg:text-[11px]">
                          {customer.discom}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10 md:max-lg:pt-2">
                      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t("customers_monthlyBillShort")}</dt>
                      <dd className="text-lg font-black tabular-nums text-slate-900 dark:text-slate-50 md:max-lg:text-base">
                        ₹{bill.toLocaleString("en-IN")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs dark:border-white/10 md:max-lg:pt-2 md:max-lg:text-[11px]">
                      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">Last activity</dt>
                      <dd className="font-bold text-slate-800 dark:text-slate-200">{lastActivityLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs dark:border-white/10 md:max-lg:pt-2 md:max-lg:text-[11px]">
                      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">Next callback</dt>
                      <dd className={cn(
                        "max-w-[58%] text-right font-semibold leading-snug",
                        callbackInfo.isOverdue ? "text-rose-700 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"
                      )}>
                        {nextFollowupTitle ? <span className="block truncate text-[10px] font-bold uppercase text-slate-400">{nextFollowupTitle}</span> : null}
                        <span>{nextFollowupAt ? callbackInfo.label : ts != null ? formatLastFollowUpLocale(locale, ts) : t("customers_neverFollowedUp")}</span>
                      </dd>
                    </div>
                    {customer.phone ? (
                      <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10 md:max-lg:pt-2">
                        <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t("customers_tablePhone")}</dt>
                        <dd className="min-w-0 max-w-[70%] text-right">
                          <a
                            href={`tel:${customer.phone}`}
                            onClick={() => handlePhoneCall(customer.id)}
                            className="block break-all text-sm font-bold tabular-nums leading-snug text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                          >
                            {formatLeadPhoneForDisplay(customer.phone)}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-4 flex flex-col gap-2 md:max-lg:mt-2.5 md:max-lg:gap-1.5">
                    <button
                      type="button"
                      onClick={() => setScheduleTarget(customer)}
                      className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 text-sm font-bold text-amber-900 touch-manipulation hover:bg-amber-100 dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100"
                    >
                      <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                      Schedule callback
                    </button>
                    {customer.phone || waUrl ? (
                      <div className="flex w-full min-w-0 gap-2">
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            onClick={() => handlePhoneCall(customer.id)}
                            className="flex min-h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl bg-indigo-600 px-2 text-sm font-bold text-white shadow-md active:bg-indigo-700 sm:min-h-[3rem] sm:px-3 sm:text-base md:max-lg:min-h-10 md:max-lg:rounded-lg md:max-lg:text-sm"
                            aria-label={t("customers_mobileCall")}
                          >
                            <Phone className="h-5 w-5 shrink-0 md:max-lg:h-4 md:max-lg:w-4" strokeWidth={2} aria-hidden />
                            <span className="truncate">{t("customers_mobileCall")}</span>
                          </a>
                        ) : null}
                        {waUrl ? (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(customer.id, waUrl)}
                            className="flex min-h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl border border-emerald-300/90 bg-emerald-50 px-2 text-sm font-bold text-emerald-900 shadow-sm active:bg-emerald-100 dark:border-emerald-500/45 dark:bg-emerald-950/55 dark:text-emerald-100 dark:active:bg-emerald-900/50 sm:min-h-[3rem] sm:px-3 md:max-lg:min-h-10 md:max-lg:rounded-lg md:max-lg:text-xs"
                            aria-label={t("customers_whatsappAria")}
                          >
                            <MessageCircle className="h-5 w-5 shrink-0 md:max-lg:h-4 md:max-lg:w-4" strokeWidth={2} aria-hidden />
                            <span className="truncate">{t("customers_whatsappShort")}</span>
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    <Link
                      href={commercialCta.href}
                      className="ss-cta-primary min-h-12 w-full touch-manipulation md:max-lg:min-h-10"
                    >
                      {t(commercialCta.labelKey)}
                    </Link>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 px-3 text-xs font-bold text-teal-800 touch-manipulation hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-950/30 dark:text-teal-200"
                    >
                      View profile →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1017] lg:block">
            {showHeader && (
              <div className="border-b border-slate-200 bg-slate-100 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-[#141a22] dark:text-slate-400 lg:grid lg:grid-cols-12 lg:gap-4 lg:px-5">
                <div className="col-span-5 pl-14">{t("customers_tableLead")}</div>
                <div className="col-span-3">{t("customers_tableLocation")}</div>
                <div className="col-span-2">{t("customers_tableBill")}</div>
                <div className="col-span-2 text-right">{t("customers_tablePipeline")}</div>
              </div>
            )}

            <div>
              {customers.map((customer) => {
                const statusKey = normalizeLeadStatus(customer.status);
                const commercialCta = resolveCustomerCommercialCta(customer);
                const bill = Number(customer.monthly_bill || 0);
                const ts = followMap[customer.id];
                const nextFollowupAt = customer.next_followup_at ?? null;
                const nextFollowupTitle = customer.next_followup_title ?? null;
                const callbackInfo = describeCallback(nextFollowupAt);
                const followLabel = nextFollowupAt
                  ? callbackInfo.label
                  : ts != null ? formatLastFollowUpLocale(locale, ts) : t("customers_neverFollowedUp");
                const lastActivityAt = customer.last_activity_at ?? customer.last_touched_at ?? null;
                const lastActivityType = customer.last_activity_type ?? null;
                const desktopDisplayName = customer.consumer_name
                  ? `${customer.consumer_name} (${customer.name})`
                  : customer.name;
                const waUrl = customer.phone ? buildLeadWhatsAppUrl(customer.phone, customer.name, installerName, locale) : null;
                const statusLabel = t(LEAD_STATUS_I18N_KEY[statusKey]);
                const stale = isLeadStale(customer.last_touched_at);
                const stage = (customer.customer_stage ?? "lead") as CustomerStage;
                const stageMeta = CUSTOMER_STAGE_META[stage];
                const activeProject = stage === "active-project";

                const canMutateLead =
                  Boolean(onEditLead || onDeleteLead) && !customer.id.startsWith("optimistic-");

                return (
                  <article
                    key={customer.id}
                    className={cn(
                      "group/row relative border-b border-slate-200 p-4 transition-colors last:border-b-0 hover:bg-slate-50/90 dark:border-white/[0.07] dark:hover:bg-white/[0.03]",
                      "lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 lg:px-5",
                      activeProject && "border-l-[3px] border-l-indigo-500 bg-indigo-50/30 dark:border-l-indigo-400 dark:bg-indigo-950/20",
                      onSelectLead && selectedLeadId === customer.id &&
                        "border-l-[3px] border-l-teal-500 bg-teal-50/55 ring-1 ring-inset ring-teal-400/35 dark:border-l-teal-400 dark:bg-teal-950/30 dark:ring-teal-400/25"
                    )}
                    onClick={(e) => {
                      if (!onSelectLead) return;
                      if ((e.target as HTMLElement).closest("a, button, select, label")) return;
                      onSelectLead(customer.id);
                    }}
                    onKeyDown={
                      onSelectLead
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelectLead(customer.id);
                            }
                          }
                        : undefined
                    }
                    role={onSelectLead ? "button" : undefined}
                    tabIndex={onSelectLead ? 0 : undefined}
                  >
                    <div className="relative lg:col-span-5">
                      <div className="relative flex items-start gap-3 lg:items-center lg:gap-4">
                        <div className="relative shrink-0">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-extrabold text-slate-800 shadow-sm dark:border-white/10 dark:bg-[#1a1f28] dark:text-slate-100 sm:h-14 sm:w-14 sm:text-base",
                              stale && "border-amber-300/80 ring-2 ring-amber-400/50"
                            )}
                            aria-hidden
                          >
                            {initials(customer.consumer_name ?? customer.name)}
                          </div>
                          {stale && (
                            <span
                              className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-amber-400 ring-2 ring-white"
                              title="No activity in 14+ days"
                              aria-label="Stale lead"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="truncate text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
                              {desktopDisplayName}
                            </h3>
                            <LeadSourceBadge sourceRaw={customer.source} />
                            <CallbackStatusBadge dueAt={nextFollowupAt} title={nextFollowupTitle} compact />
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px]",
                                stageMeta.className
                              )}
                            >
                              {t(stageMeta.labelKey)}
                            </span>
                          </div>
                          {customer.phone ? (
                            <div className="mt-1 space-y-2">
                              <a
                                href={`tel:${customer.phone}`}
                                onClick={() => handlePhoneCall(customer.id)}
                                className="flex w-full min-w-0 items-start gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200"
                              >
                                <PhoneCall className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.85} aria-hidden />
                                <span className="min-w-0 break-all tabular-nums leading-snug">{formatLeadPhoneForDisplay(customer.phone)}</span>
                              </a>
                              <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={`tel:${customer.phone}`}
                                onClick={() => handlePhoneCall(customer.id)}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-[0.5px] border-indigo-200/80 bg-indigo-50/90 text-indigo-600 shadow-sm transition-colors hover:bg-indigo-100 hover:text-indigo-700"
                                aria-label={`Call ${customer.name}`}
                              >
                                <Phone className="h-4 w-4" strokeWidth={1.9} />
                              </a>
                              {waUrl ? (
                                <button
                                  type="button"
                                  onClick={() => openWhatsApp(customer.id, waUrl)}
                                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-[0.5px] border-emerald-200/80 bg-emerald-50/90 text-emerald-600 shadow-sm transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                                  aria-label={t("customers_whatsappAria")}
                                >
                                  <MessageCircle className="h-4 w-4" strokeWidth={1.9} />
                                </button>
                              ) : null}
                              <Link
                                href={commercialCta.href}
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-teal-600/75 bg-gradient-to-r from-teal-50 to-indigo-50 px-3 text-[11px] font-extrabold uppercase tracking-wide text-teal-900 shadow-sm transition hover:brightness-105 dark:border-teal-400/45 dark:from-teal-950/50 dark:to-indigo-950/40 dark:text-teal-50"
                              >
                                {t(commercialCta.labelKey)}
                              </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400 sm:text-sm">
                              <p>{t("customers_noPhoneOnFile")}</p>
                              <Link
                                href={commercialCta.href}
                                className="inline-flex h-9 max-w-full items-center justify-center rounded-lg border border-teal-600/75 bg-gradient-to-r from-teal-50 to-indigo-50 px-3 text-[11px] font-extrabold uppercase tracking-wide text-teal-900 shadow-sm transition hover:brightness-105 dark:border-teal-400/45 dark:from-teal-950/50 dark:to-indigo-950/40 dark:text-teal-50"
                              >
                                {t(commercialCta.labelKey)}
                              </Link>
                            </div>
                          )}
                          {stale && (
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 sm:text-[10px]">
                              No activity · 14+ days
                            </p>
                          )}
                          <p className="mt-1 text-[10px] font-semibold leading-snug text-slate-500 sm:text-[11px]">
                            <span className="text-slate-400">Last: </span>
                            {lastActivityAt
                              ? <span>{fmtActivityType(lastActivityType)} · {formatCrmDateTime(lastActivityAt)}</span>
                              : <span>{formatLeadLastActivity(customer.last_touched_at, locale)}</span>
                            }
                          </p>
                          {nextFollowupAt ? (
                            <p className={cn("mt-0.5 text-[10px] font-semibold sm:text-[11px]", callbackInfo.isOverdue ? "text-rose-600 dark:text-rose-400" : "text-sky-800 dark:text-sky-200")}>
                              Next callback: {followLabel}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setScheduleTarget(customer)}
                            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 hover:bg-amber-100 dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100"
                          >
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                            Schedule
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-4 flex flex-col gap-1 border-t border-slate-100 pt-3 dark:border-white/[0.06] lg:col-span-3 lg:mt-0 lg:border-t-0 lg:pt-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <MapPin className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
                        <span className="truncate">{customer.city}</span>
                      </p>
                      <p className="flex items-center gap-2 pl-6 text-xs font-medium text-slate-600 sm:text-sm">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                        <span className="truncate">{customer.discom}</span>
                      </p>
                    </div>

                    <div className="relative mt-3 flex items-center gap-2 lg:col-span-2 lg:mt-0">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-[#141a22] dark:text-slate-300 lg:h-10 lg:w-10">
                        <IndianRupee className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("customers_monthlyBillShort")}</p>
                        <p className="text-base font-extrabold tabular-nums text-slate-900 dark:text-slate-100 sm:text-lg">
                          ₹{bill.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-4 flex flex-col items-end gap-2 lg:col-span-2 lg:mt-0">
                      {canMutateLead ? (
                        <LeadRowActions
                          onEdit={onEditLead ? () => onEditLead(customer) : undefined}
                          onDelete={onDeleteLead ? () => onDeleteLead(customer) : undefined}
                          editAria={t("customers_editLeadAria")}
                          deleteAria={t("customers_deleteLeadAria")}
                        />
                      ) : null}
                      {onStatusChange ? (
                        <LeadStatusPillSelect
                          key={`${customer.id}-${statusKey}`}
                          leadId={customer.id}
                          statusKey={statusKey}
                          label={statusLabel}
                          t={t}
                          onChange={onStatusChange}
                        />
                      ) : (
                        <LeadStatusBadge statusKey={statusKey} label={statusLabel} />
                      )}
                      <Link
                        href={`/customers/${customer.id}`}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-teal-200 bg-teal-50/70 px-2 text-[10px] font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-950/30 dark:text-teal-200"
                      >
                        View profile →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {scheduleTarget ? (
        <ScheduleCallbackSheet
          open={Boolean(scheduleTarget)}
          onClose={() => setScheduleTarget(null)}
          leadId={scheduleTarget.id}
          customerName={scheduleTarget.consumer_name ?? scheduleTarget.name}
          onScheduled={() => setScheduleTarget(null)}
        />
      ) : null}
    </div>
  );
}

export function CustomersLeadListEmpty({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-[0.5px] border-dashed border-brand-200/80 bg-gradient-to-b from-white/50 to-indigo-50/30 px-6 py-14 text-center shadow-[0_12px_36px_rgba(11,34,64,0.08)] backdrop-blur-sm">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-[0.5px] border-white/60 bg-white/80 text-brand-600 shadow-inner ring-1 ring-brand-100">
        <Users className="h-8 w-8" strokeWidth={2} aria-hidden />
      </span>
      <p className="mt-4 text-base font-extrabold text-brand-900">{t("customers_emptyList")}</p>
      <p className="mt-1 max-w-sm text-sm font-medium leading-relaxed text-slate-600">{t("customers_emptySub")}</p>
    </div>
  );
}
