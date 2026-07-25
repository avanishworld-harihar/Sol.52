"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Building2, MapPin, MessageCircle, Pencil, Phone, PhoneCall, Trash2, Users, Wifi } from "lucide-react";

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
import { CustomerCallbackChip } from "@/components/crm/customer-callback-chip";
import { ScheduleCallbackSheet } from "@/components/crm/schedule-callback-sheet";

export type { CustomerLead };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-teal-500 to-emerald-600",
  "from-sky-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
] as const;

function avatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash];
}

function LeadAvatar({
  name,
  stale,
  size = "md",
}: {
  name: string;
  stale?: boolean;
  size?: "md" | "sm";
}) {
  const shell = size === "sm" ? "h-11 w-11 rounded-xl text-sm" : "h-12 w-12 rounded-xl text-sm sm:text-base";
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(15,23,42,0.35)] ring-2 ring-white dark:ring-[#0c1017]",
          avatarGradient(name),
          shell,
          stale && "ring-amber-300/80"
        )}
        aria-hidden
      >
        {initials(name)}
      </div>
      {stale ? (
        <span
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#0c1017]"
          title="No activity in 14+ days"
          aria-label="Stale lead"
        />
      ) : null}
    </div>
  );
}

function LeadLocationMeta({ city, discom }: { city: string; discom: string }) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-2">
        <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" strokeWidth={2.25} aria-hidden />
        <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{city}</span>
      </div>
      <div className="grid grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-2">
        <Building2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} aria-hidden />
        <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{discom}</span>
      </div>
    </div>
  );
}

function LeadBillMetric({ bill, label }: { bill: number; label: string }) {
  return (
    <div className="text-right lg:text-left">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
        ₹{bill.toLocaleString("en-IN")}
      </p>
    </div>
  );
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

/** Always-visible edit/delete for CRM rows (no hover-only dots). */
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
  const btn = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-3.5 w-3.5";

  return (
    <div
      className={cn("relative shrink-0", className)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="group"
        aria-label="Lead actions"
        className="flex items-center justify-end gap-1"
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
    </div>
  );
}

function LeadRowSkeleton() {
  return (
    <div className="border-b border-slate-100 p-4 last:border-b-0 dark:border-white/[0.06] xl:grid xl:grid-cols-12 xl:items-center xl:gap-4 xl:px-5">
      <div className="flex items-center gap-3 xl:col-span-5">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36 rounded-md bg-slate-200/80" />
          <Skeleton className="h-3 w-24 rounded-md bg-slate-200/60" />
        </div>
      </div>
      <Skeleton className="mt-3 hidden h-10 rounded-lg bg-slate-200/60 xl:col-span-3 xl:mt-0 xl:block" />
      <Skeleton className="mt-2 hidden h-8 w-20 rounded-lg bg-slate-200/60 xl:col-span-2 xl:mt-0 xl:block" />
      <div className="mt-3 flex justify-start xl:col-span-2 xl:mt-0 xl:justify-end">
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
          <div className="space-y-3 px-0.5 md:max-xl:space-y-2 xl:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <LeadMobileCardSkeleton key={`m-sk-${i}`} />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1017] xl:block">
            {Array.from({ length: 5 }).map((_, i) => (
              <LeadRowSkeleton key={i} />
            ))}
          </div>
        </>
      ) : null}

      {!loading && customers.length > 0 ? (
        <>
          <div className="space-y-3 px-0.5 md:max-xl:space-y-2 xl:hidden">
            {customers.map((customer) => {
              const statusKey = normalizeLeadStatus(customer.status);
              const commercialCta = resolveCustomerCommercialCta(customer);
              const bill = Number(customer.monthly_bill || 0);
              // Phase 2: prefer server-side next followup; fall back to localStorage
              const nextFollowupAt = customer.next_followup_at ?? null;
              const nextFollowupTitle = customer.next_followup_title ?? null;
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
              // Lead / contact name only — do not mash bill/husband name into the title.
              const displayName = customer.name;

              return (
                <article
                  key={`m-${customer.id}`}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#0c1017]",
                    /* iPad split pane: dense selectable row — detail lives in workspace */
                    "md:max-xl:rounded-xl md:max-xl:border-slate-200/70 md:max-xl:p-2.5 md:max-xl:shadow-none dark:md:max-xl:border-white/[0.08]",
                    activeProject && "border-l-[4px] border-l-indigo-500 bg-indigo-50/25 dark:border-l-indigo-400 dark:bg-indigo-950/25",
                    onSelectLead && selectedLeadId === customer.id && "ring-2 ring-brand-500/50 ring-offset-2 ring-offset-slate-50 dark:ring-offset-[#0c1017] md:max-xl:ring-offset-0 md:max-xl:bg-brand-50/40 dark:md:max-xl:bg-brand-950/25"
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
                      className="absolute right-2 top-2 z-10 md:max-xl:right-1.5 md:max-xl:top-1.5"
                      size="sm"
                      onEdit={onEditLead ? () => onEditLead(customer) : undefined}
                      onDelete={onDeleteLead ? () => onDeleteLead(customer) : undefined}
                      editAria={t("customers_editLeadAria")}
                      deleteAria={t("customers_deleteLeadAria")}
                    />
                  ) : null}

                  <div className={cn("flex gap-3 md:max-xl:gap-2.5", canMutateLead ? "pr-12 md:max-xl:pr-10" : "")}>
                    <LeadAvatar
                      name={customer.name}
                      stale={stale}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate pr-1 text-lg font-extrabold leading-tight text-slate-900 dark:text-slate-50 md:max-xl:text-[15px] md:max-xl:leading-snug">
                        {displayName}
                      </h3>
                      {customer.household_member_names && customer.household_member_names.length > 0 ? (
                        <p className="mt-0.5 truncate text-[11px] font-medium text-teal-700 dark:text-teal-300">
                          Family · {customer.household_member_names.join(", ")}
                          {customer.is_whatsapp_contact ? " · WhatsApp contact" : ""}
                        </p>
                      ) : customer.is_whatsapp_contact ? (
                        <p className="mt-0.5 text-[11px] font-medium text-teal-700/80 dark:text-teal-300/80">
                          WhatsApp contact
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 md:max-xl:mt-1 md:max-xl:gap-1">
                        <LeadSourceBadge sourceRaw={customer.source} />
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                            "md:max-xl:px-1.5 md:max-xl:py-0 md:max-xl:text-[9px]",
                            stageMeta.className
                          )}
                        >
                          {t(stageMeta.labelKey)}
                        </span>
                        {/* Status sits with badges on tablet to save vertical space */}
                        <span className="hidden md:max-xl:inline-flex">
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
                        </span>
                      </div>

                      {/* Phone: prominent callback + status */}
                      <div className="mt-3 space-y-3 md:max-xl:hidden">
                        <CustomerCallbackChip
                          dueAt={nextFollowupAt}
                          title={nextFollowupTitle}
                          onSchedule={() => setScheduleTarget(customer)}
                        />
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

                      {/* Tablet: compact callback only */}
                      <div className="mt-1.5 hidden max-w-full md:max-xl:block">
                        <CustomerCallbackChip
                          variant="compact"
                          dueAt={nextFollowupAt}
                          title={nextFollowupTitle}
                          onSchedule={() => setScheduleTarget(customer)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone: full meta panel */}
                  <dl className="mt-4 space-y-3 rounded-2xl bg-slate-50/90 px-4 py-3.5 text-sm dark:bg-white/[0.05] md:max-xl:hidden">
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t("customers_tableLocation")}</dt>
                      <dd className="min-w-0 text-right font-semibold text-slate-900 dark:text-slate-100">
                        <span className="block truncate">{customer.city}</span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                          {customer.discom}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
                      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">{t("customers_monthlyBillShort")}</dt>
                      <dd className="text-lg font-black tabular-nums text-slate-900 dark:text-slate-50">
                        ₹{bill.toLocaleString("en-IN")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs dark:border-white/10">
                      <dt className="shrink-0 font-semibold text-slate-500 dark:text-slate-400">Last activity</dt>
                      <dd className="font-bold text-slate-800 dark:text-slate-200">{lastActivityLabel}</dd>
                    </div>
                    {customer.phone ? (
                      <div className="flex justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
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

                  {/* Tablet: one-line meta (workspace shows the rest) */}
                  <div className="mt-2 hidden min-w-0 md:max-xl:block">
                    <p className="truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                      {[customer.city, customer.discom].filter(Boolean).join(" · ")}
                      {bill > 0 ? ` · ₹${bill.toLocaleString("en-IN")}` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {lastActivityLabel}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 md:max-xl:mt-2 md:max-xl:gap-1.5">
                    {customer.phone || waUrl ? (
                      <div className="flex w-full min-w-0 gap-2">
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            onClick={() => handlePhoneCall(customer.id)}
                            className={cn(
                              "flex min-h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl bg-indigo-600 px-2 text-sm font-bold text-white shadow-md active:bg-indigo-700 sm:min-h-[3rem] sm:px-3 sm:text-base",
                              "md:max-xl:min-h-9 md:max-xl:flex-none md:max-xl:rounded-lg md:max-xl:px-2.5 md:max-xl:shadow-sm"
                            )}
                            aria-label={t("customers_mobileCall")}
                            title={t("customers_mobileCall")}
                          >
                            <Phone className="h-5 w-5 shrink-0 md:max-xl:h-4 md:max-xl:w-4" strokeWidth={2} aria-hidden />
                            <span className="truncate md:max-xl:hidden">{t("customers_mobileCall")}</span>
                          </a>
                        ) : null}
                        {waUrl ? (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(customer.id, waUrl)}
                            className={cn(
                              "flex min-h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl border border-emerald-300/90 bg-emerald-50 px-2 text-sm font-bold text-emerald-900 shadow-sm active:bg-emerald-100 dark:border-emerald-500/45 dark:bg-emerald-950/55 dark:text-emerald-100 dark:active:bg-emerald-900/50 sm:min-h-[3rem] sm:px-3",
                              "md:max-xl:min-h-9 md:max-xl:flex-none md:max-xl:rounded-lg md:max-xl:px-2.5"
                            )}
                            aria-label={t("customers_whatsappAria")}
                            title={t("customers_whatsappShort")}
                          >
                            <MessageCircle className="h-5 w-5 shrink-0 md:max-xl:h-4 md:max-xl:w-4" strokeWidth={2} aria-hidden />
                            <span className="truncate md:max-xl:hidden">{t("customers_whatsappShort")}</span>
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {/* Full commercial CTA on phone; on tablet split the workspace owns this */}
                    <Link
                      href={commercialCta.href}
                      className={cn(
                        "ss-cta-primary min-h-12 w-full touch-manipulation",
                        onSelectLead && "md:max-xl:hidden"
                      )}
                    >
                      {t(commercialCta.labelKey)}
                    </Link>
                    {onSelectLead ? null : (
                    <Link
                      href={`/customers/${customer.id}`}
                      className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 px-3 text-xs font-bold text-teal-800 touch-manipulation hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-950/30 dark:text-teal-200"
                    >
                      View profile →
                    </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#0c1017] xl:block">
            {showHeader && (
              <div className="grid grid-cols-12 gap-4 border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:from-[#141a22] dark:to-[#0c1017] dark:text-slate-400">
                <div className="col-span-5 pl-[3.25rem]">{t("customers_tableLead")}</div>
                <div className="col-span-3">{t("customers_tableLocation")}</div>
                <div className="col-span-2">{t("customers_tableBill")}</div>
                <div className="col-span-2 text-right">{t("customers_tablePipeline")}</div>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {customers.map((customer) => {
                const statusKey = normalizeLeadStatus(customer.status);
                const commercialCta = resolveCustomerCommercialCta(customer);
                const bill = Number(customer.monthly_bill || 0);
                const nextFollowupAt = customer.next_followup_at ?? null;
                const nextFollowupTitle = customer.next_followup_title ?? null;
                const lastActivityAt = customer.last_activity_at ?? customer.last_touched_at ?? null;
                const lastActivityType = customer.last_activity_type ?? null;
                const desktopDisplayName = customer.name;
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
                      "group/row relative grid grid-cols-12 items-center gap-4 px-5 py-3.5 transition-all duration-200",
                      "hover:bg-slate-50/90 dark:hover:bg-white/[0.025]",
                      activeProject && "bg-indigo-50/40 dark:bg-indigo-950/20",
                      onSelectLead && selectedLeadId === customer.id &&
                        "bg-teal-50/60 ring-1 ring-inset ring-teal-400/30 dark:bg-teal-950/25 dark:ring-teal-400/20"
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
                    <div
                      className={cn(
                        "pointer-events-none absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-teal-500 opacity-0 transition-opacity group-hover/row:opacity-100",
                        activeProject && "bg-indigo-500 opacity-100",
                        onSelectLead && selectedLeadId === customer.id && "opacity-100"
                      )}
                      aria-hidden
                    />

                    <div className="col-span-5 min-w-0">
                      <div className="flex items-start gap-3">
                        <LeadAvatar name={customer.name} stale={stale} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
                              {desktopDisplayName}
                            </h3>
                            <LeadSourceBadge sourceRaw={customer.source} />
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                stageMeta.className
                              )}
                            >
                              {t(stageMeta.labelKey)}
                            </span>
                          </div>
                          {customer.household_member_names && customer.household_member_names.length > 0 ? (
                            <p className="mt-0.5 truncate text-[11px] font-medium text-teal-700 dark:text-teal-300">
                              Family · {customer.household_member_names.join(", ")}
                              {customer.is_whatsapp_contact ? " · WhatsApp contact" : ""}
                            </p>
                          ) : null}

                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <CustomerCallbackChip
                              dueAt={nextFollowupAt}
                              title={nextFollowupTitle}
                              variant="compact"
                              onSchedule={() => setScheduleTarget(customer)}
                            />
                            {stale ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
                                Stale · 14+ days
                              </span>
                            ) : null}
                          </div>

                          {customer.phone ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <a
                                href={`tel:${customer.phone}`}
                                onClick={() => handlePhoneCall(customer.id)}
                                className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold tabular-nums text-slate-600 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300"
                              >
                                <PhoneCall className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
                                <span className="truncate">{formatLeadPhoneForDisplay(customer.phone)}</span>
                              </a>
                              <div className="flex items-center gap-1">
                                <a
                                  href={`tel:${customer.phone}`}
                                  onClick={() => handlePhoneCall(customer.id)}
                                  className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg border border-slate-200/90 bg-white text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-indigo-950/40"
                                  aria-label={`Call ${customer.name}`}
                                >
                                  <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                                </a>
                                {waUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => openWhatsApp(customer.id, waUrl)}
                                    className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg border border-slate-200/90 bg-white text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-emerald-950/40"
                                    aria-label={t("customers_whatsappAria")}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                                  </button>
                                ) : null}
                                <Link
                                  href={commercialCta.href}
                                  className="inline-flex h-8 items-center rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-3 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm transition hover:brightness-105"
                                >
                                  {t(commercialCta.labelKey)}
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-slate-400">{t("customers_noPhoneOnFile")}</span>
                              <Link
                                href={commercialCta.href}
                                className="inline-flex h-8 items-center rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-3 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm transition hover:brightness-105"
                              >
                                {t(commercialCta.labelKey)}
                              </Link>
                            </div>
                          )}

                          <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                            {lastActivityAt
                              ? (
                                  <>
                                    <span className="text-slate-500">{fmtActivityType(lastActivityType)}</span>
                                    {" · "}
                                    {formatCrmDateTime(lastActivityAt)}
                                  </>
                                )
                              : formatLeadLastActivity(customer.last_touched_at, locale)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 min-w-0">
                      <LeadLocationMeta city={customer.city} discom={customer.discom} />
                    </div>

                    <div className="col-span-2 min-w-0">
                      <LeadBillMetric bill={bill} label={t("customers_monthlyBillShort")} />
                    </div>

                    <div className="col-span-2 flex flex-col items-end gap-2">
                      {canMutateLead ? (
                        <LeadRowActions
                          size="sm"
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
                        className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 hover:text-teal-900 dark:text-teal-300 dark:hover:bg-teal-950/40"
                      >
                        View profile
                        <span aria-hidden>→</span>
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
          customerName={scheduleTarget.name}
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
