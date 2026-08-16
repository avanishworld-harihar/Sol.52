"use client";

import Link from "next/link";
import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";
import {
  AlarmClock,
  CalendarCheck,
  Flame,
  IndianRupee,
  Phone,
  MessageCircle,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Zap,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCrmDateTime, formatCrmTime, crmDatetimeLocalToIso } from "@/lib/crm-datetime";
import { resolveCallbackDueAt } from "@/lib/crm-callback-schedule";
import { createReminder, logCustomerContact, patchReminder } from "@/lib/followup-client";
import { buildCommandActionWhatsAppUrl } from "@/lib/crm-command-center-messages";
import { getInstallerBrandName } from "@/lib/installer-brand";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import {
  countForFilter,
  matchesFilter,
  URGENCY_VISUAL,
} from "@/lib/crm-command-center-display";
import type {
  CommandActionItem,
  CommandCenterPayload,
  CommandFilterId,
} from "@/lib/crm-command-center-types";
import { cn } from "@/lib/utils";

async function fetchCommandCenter(): Promise<CommandCenterPayload> {
  const res = await fetch("/api/crm/command-center", { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: CommandCenterPayload; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "command_center_load_failed");
  return (
    json.data ?? {
      kpis: { hot_leads: 0, overdue_followups: 0, today_tasks: 0, pipeline_at_risk_inr: 0, critical_count: 0 },
      actions: [],
      generated_at: new Date().toISOString(),
    }
  );
}

const FILTERS: { id: CommandFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "today", label: "Today" },
  { id: "hot", label: "Hot Leads" },
  { id: "upcoming", label: "Upcoming" },
];

type SnoozePreset = "1h" | "tomorrow" | "next_week" | "custom";

function snoozeIso(preset: SnoozePreset, customLocal?: string): string {
  const now = new Date();
  if (preset === "1h") return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  if (preset === "tomorrow") return resolveCallbackDueAt("tomorrow");
  if (preset === "next_week") return resolveCallbackDueAt("next_week");
  if (preset === "custom" && customLocal?.trim()) return crmDatetimeLocalToIso(customLocal.trim());
  return resolveCallbackDueAt("tomorrow");
}

type KpiTone = "rose" | "amber" | "violet" | "cyan";

const KPI_TONES: Record<
  KpiTone,
  { shell: string; glow: string; value: string; icon: string }
> = {
  rose: {
    shell: "border-red-300/70 bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-[#0a1018]",
    glow: "shadow-[0_0_24px_rgba(239,68,68,0.12)]",
    value: "text-red-700 dark:text-red-300",
    icon: "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  },
  amber: {
    shell: "border-amber-300/70 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/35 dark:to-[#0a1018]",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    value: "text-amber-800 dark:text-amber-200",
    icon: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  },
  violet: {
    shell: "border-violet-300/70 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/35 dark:to-[#0a1018]",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.1)]",
    value: "text-violet-800 dark:text-violet-200",
    icon: "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
  },
  cyan: {
    shell: "border-cyan-300/70 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/30 dark:to-[#0a1018]",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.1)]",
    value: "text-cyan-800 dark:text-cyan-200",
    icon: "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200",
  },
};

function KpiCard({
  label,
  value,
  sub,
  tone,
  icon: Icon,
  loading,
  emphasis,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  tone: KpiTone;
  icon: typeof Flame;
  loading?: boolean;
  emphasis?: boolean;
  onClick?: () => void;
}) {
  const t = KPI_TONES[tone];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "cc-kpi-card min-w-[10.5rem] shrink-0 snap-start rounded-2xl border p-3.5 text-left backdrop-blur-md transition sm:min-w-0 sm:flex-1 sm:p-4",
        t.shell,
        t.glow,
        emphasis && "ring-2 ring-red-400/40 dark:ring-red-500/30",
        onClick && "cursor-pointer hover:brightness-[1.02] active:scale-[0.99]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400 sm:text-[11px]">
          {label}
        </p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", t.icon)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2.5 h-8 w-14 rounded-lg" />
      ) : (
        <p className={cn("mt-2 text-2xl font-black tabular-nums tracking-tight sm:text-3xl", t.value)}>{value}</p>
      )}
      <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-[11px]">{sub}</p>
    </Tag>
  );
}

function kindIcon(kind: CommandActionItem["kind"]): string {
  if (kind.startsWith("visit")) return "📍";
  if (kind.startsWith("hot")) return "🔥";
  if (kind === "payment_pending") return "💰";
  if (kind === "reminder_overdue") return "⚠️";
  return "📞";
}

function ActionRow({
  action,
  installerName,
  onMutate,
  onDismiss,
}: {
  action: CommandActionItem;
  installerName: string;
  onMutate: () => void;
  onDismiss: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [customSnooze, setCustomSnooze] = useState("");

  const visual = URGENCY_VISUAL[action.urgency];
  const waUrl = action.phone
    ? buildCommandActionWhatsAppUrl(action.phone, action.customer_name, installerName, action.event_context || action.reason)
    : null;

  const dueLabel = action.due_at
    ? action.urgency === "today" || action.kind.startsWith("visit")
      ? formatCrmTime(action.due_at)
      : formatCrmDateTime(action.due_at)
    : "—";

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      try {
        await fn();
        onMutate();
      } catch {
        /* keep row */
      } finally {
        setBusy(false);
      }
    },
    [busy, onMutate]
  );

  async function handleMarkDone() {
    await run(async () => {
      if (action.reminder_id) {
        await patchReminder(action.reminder_id, { status: "completed" });
      } else {
        await logCustomerContact(action.lead_id, "call");
      }
      onDismiss(action.id);
    });
  }

  async function handleSnooze(preset: SnoozePreset) {
    const until = snoozeIso(preset, customSnooze);
    await run(async () => {
      if (action.reminder_id) {
        await patchReminder(action.reminder_id, {
          status: "snoozed",
          snoozed_until: until,
          due_at: until,
        });
      } else {
        await createReminder(action.lead_id, {
          title: `Follow-up — ${(action.event_context || action.action_title).slice(0, 80)}`,
          due_at: until,
          followup_type: "call",
          priority: action.urgency === "critical" || action.urgency === "overdue" ? "high" : "medium",
        });
      }
      onDismiss(action.id);
      setSnoozeOpen(false);
    });
  }

  async function handleWhatsApp() {
    if (!waUrl) return;
    await logCustomerContact(action.lead_id, "whatsapp");
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <article
      className={cn(
        "cc-action-row group rounded-xl border border-slate-200/80 p-3 shadow-sm backdrop-blur-sm transition hover:border-slate-300/90 hover:shadow-md dark:border-white/10 dark:hover:border-white/20 sm:p-3.5",
        visual.row,
        visual.pulse && "cc-row-pulse"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        {/* LEFT — context */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-base shadow-sm dark:bg-white/10"
            aria-hidden
          >
            {kindIcon(action.kind)}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/customers/${encodeURIComponent(action.lead_id)}`}
              className="block min-w-0 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-white sm:text-[15px]">
                {action.customer_name}
              </span>
              {action.location ? (
                <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={2.4} aria-hidden />
                  <span className="truncate">{action.location}</span>
                </span>
              ) : null}
            </Link>
            <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">{action.action_title}</p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 dark:text-slate-400 sm:text-xs">
              {action.system_kw != null ? <span>{action.system_kw} kW</span> : null}
              {action.system_kw != null && action.event_context ? <span> · </span> : null}
              {action.event_context ? <span>{action.event_context}</span> : null}
              {action.deal_value_inr != null && action.deal_value_inr > 0 ? (
                <span className="ml-1.5 font-semibold text-slate-600 dark:text-slate-300">
                  · {formatInrCompact(action.deal_value_inr)}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* CENTER — urgency + time */}
        <div className="flex shrink-0 items-center gap-2 pl-12 lg:flex-col lg:items-end lg:pl-0 lg:text-right">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide", visual.badge)}>
            {visual.label}
          </span>
          <span className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-slate-300">{dueLabel}</span>
        </div>

        {/* RIGHT — actions (Call primary) */}
        <div className="flex flex-wrap items-center gap-1.5 pl-12 sm:gap-2 lg:shrink-0 lg:pl-0">
          {action.phone ? (
            <Button
              type="button"
              variant="emeraldCta"
              size="sm"
              className="cc-call-btn h-10 min-w-[5.5rem] flex-1 gap-1.5 px-4 text-xs font-extrabold shadow-md shadow-emerald-600/20 sm:h-10 sm:flex-none"
              asChild
              disabled={busy}
            >
              <a href={`tel:${action.phone}`} onClick={() => void logCustomerContact(action.lead_id, "call")}>
                <Phone className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                Call
              </a>
            </Button>
          ) : null}
          {action.phone && waUrl ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 w-9 shrink-0 p-0 sm:h-9 sm:w-auto sm:px-3"
              disabled={busy}
              onClick={() => void handleWhatsApp()}
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline sm:ml-1">WA</span>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 w-9 shrink-0 p-0 sm:h-9 sm:w-auto sm:px-3"
            disabled={busy}
            onClick={() => void handleMarkDone()}
            aria-label="Mark done"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden />}
            <span className="hidden sm:inline sm:ml-1">Done</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 shrink-0 px-2 text-[11px] font-bold text-slate-600"
            disabled={busy}
            onClick={() => setSnoozeOpen((v) => !v)}
          >
            <Clock className="h-3.5 w-3.5 sm:mr-1" aria-hidden />
            <span className="hidden sm:inline">Snooze</span>
          </Button>
        </div>
      </div>

      {snoozeOpen ? (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/95 p-2.5 dark:border-slate-700/60 dark:bg-slate-900/50">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["1h", "1 hour"],
                ["tomorrow", "Tomorrow"],
                ["next_week", "Next week"],
              ] as const
            ).map(([preset, label]) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-[11px]"
                disabled={busy}
                onClick={() => void handleSnooze(preset)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <input
              type="datetime-local"
              value={customSnooze}
              onChange={(e) => setCustomSnooze(e.target.value)}
              className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-600 dark:bg-slate-950"
              aria-label="Custom snooze date and time"
            />
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 text-[11px]"
              disabled={busy || !customSnooze.trim()}
              onClick={() => void handleSnooze("custom")}
            >
              Custom
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function CrmCommandCenter() {
  const installerName = getInstallerBrandName();
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<CommandFilterId>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data, error, isLoading, mutate, isValidating } = useSWR("crm-command-center", fetchCommandCenter, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const visibleActions = useMemo(() => {
    const base = (data?.actions ?? []).filter((a) => !dismissed.has(a.id));
    return base.filter((a) => matchesFilter(a, filter));
  }, [data?.actions, dismissed, filter]);

  const allActions = useMemo(
    () => (data?.actions ?? []).filter((a) => !dismissed.has(a.id)),
    [data?.actions, dismissed]
  );

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const loading = isLoading && !data;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await mutate();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="cc-hero-shell">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 sm:mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/15 text-red-600 dark:from-red-500/25 dark:to-amber-500/20 dark:text-red-300">
              <Zap className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </span>
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800 dark:text-white sm:text-base">
              Command Center
            </h2>
          </div>
          <p className="mt-1 pl-10 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            Aaj kya karna hai — overdue, callbacks, hot leads, visits.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!loading && data ? (
            <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              Updated {formatCrmTime(data.generated_at)}
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => void handleRefresh()}
            disabled={refreshing || isValidating}
            aria-label="Refresh command center"
          >
            <RefreshCw className={cn("h-4 w-4", (refreshing || isValidating) && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPI strip — Overdue first (highest weight) */}
      <div className="-mx-0.5 mb-4 flex gap-2.5 overflow-x-auto px-0.5 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible lg:grid-cols-4">
        <KpiCard
          label="Overdue"
          value={String(data?.kpis.overdue_followups ?? 0)}
          sub="Follow-ups pending"
          tone="rose"
          icon={AlarmClock}
          loading={loading}
          emphasis={(data?.kpis.overdue_followups ?? 0) > 0}
          onClick={() => setFilter("critical")}
        />
        <KpiCard
          label="Today"
          value={String(data?.kpis.today_tasks ?? 0)}
          sub="Tasks due today"
          tone="amber"
          icon={CalendarCheck}
          loading={loading}
          onClick={() => setFilter("today")}
        />
        <KpiCard
          label="Hot Leads"
          value={String(data?.kpis.hot_leads ?? 0)}
          sub="Active engagement"
          tone="violet"
          icon={Flame}
          loading={loading}
          onClick={() => setFilter("hot")}
        />
        <KpiCard
          label="Pipeline at risk"
          value={formatInrCompact(data?.kpis.pipeline_at_risk_inr ?? 0)}
          sub="Inactive 7+ days"
          tone="cyan"
          icon={IndianRupee}
          loading={loading}
        />
      </div>

      {error ? (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200">
          Could not load command center. Tap refresh to try again.
        </p>
      ) : null}

      {/* Priority actions */}
      <div className="cc-actions-panel rounded-2xl border border-white/70 bg-white/55 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#070b12]/75 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200 sm:text-sm">
            Today&apos;s priority actions
          </h3>
          {!loading ? (
            <span className="text-[10px] font-bold text-slate-400 sm:text-xs">{visibleActions.length} shown</span>
          ) : null}
        </div>

        {/* Filters */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5 snap-x">
          {FILTERS.map((f) => {
            const count = countForFilter(allActions, f.id);
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 snap-start rounded-full border px-3 py-1.5 text-[11px] font-bold transition",
                  active
                    ? "border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200/90 bg-white/80 text-slate-600 hover:border-slate-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
                )}
              >
                {f.label}
                <span className={cn("ml-1.5 tabular-nums", active ? "opacity-80" : "opacity-50")}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {loading ? (
            <>
              <Skeleton className="h-[4.5rem] w-full rounded-xl" />
              <Skeleton className="h-[4.5rem] w-full rounded-xl" />
              <Skeleton className="h-[4.5rem] w-full rounded-xl" />
            </>
          ) : visibleActions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/60 px-4 py-8 text-center dark:border-slate-600/50 dark:bg-slate-900/30">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {filter === "all" ? "All clear for now" : `No ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} actions`}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Schedule callbacks from Customers — 3/5 month follow-ups surface here automatically.
              </p>
              {filter !== "all" ? (
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setFilter("all")}>
                  Show all
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/customers">Open customers</Link>
                </Button>
              )}
            </div>
          ) : (
            visibleActions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                installerName={installerName}
                onMutate={() => void mutate()}
                onDismiss={dismiss}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
