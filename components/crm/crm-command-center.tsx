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
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSectionTitle } from "@/components/dashboard-section-title";
import { formatCrmDateTime, formatCrmTime, crmDatetimeLocalToIso } from "@/lib/crm-datetime";
import { resolveCallbackDueAt } from "@/lib/crm-callback-schedule";
import { createReminder, logCustomerContact, patchReminder } from "@/lib/followup-client";
import { buildCommandActionWhatsAppUrl } from "@/lib/crm-command-center-messages";
import { getInstallerBrandName } from "@/lib/installer-brand";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { LEAD_STATUS_BADGE, LEAD_STATUS_I18N_KEY, normalizeLeadStatus } from "@/lib/lead-status";
import { useLanguage } from "@/lib/language-context";
import type {
  CommandActionItem,
  CommandCenterPayload,
  CommandUrgency,
} from "@/lib/crm-command-center-types";

async function fetchCommandCenter(): Promise<CommandCenterPayload> {
  const res = await fetch("/api/crm/command-center", { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: CommandCenterPayload; error?: string };
  if (!res.ok || !json.ok) throw new Error(json.error || "command_center_load_failed");
  return (
    json.data ?? {
      kpis: { hot_leads: 0, overdue_followups: 0, today_tasks: 0, pipeline_at_risk_inr: 0 },
      actions: [],
      generated_at: new Date().toISOString(),
    }
  );
}

const URGENCY_STYLES: Record<
  CommandUrgency,
  { label: string; badge: string; ring: string }
> = {
  critical: {
    label: "Critical",
    badge: "border-rose-400/70 bg-rose-100 text-rose-900 dark:border-rose-500/50 dark:bg-rose-950/50 dark:text-rose-100",
    ring: "border-rose-300/80 dark:border-rose-500/40",
  },
  today: {
    label: "Today",
    badge: "border-amber-400/70 bg-amber-100 text-amber-950 dark:border-amber-500/45 dark:bg-amber-950/40 dark:text-amber-100",
    ring: "border-amber-300/80 dark:border-amber-500/35",
  },
  upcoming: {
    label: "Upcoming",
    badge: "border-sky-400/70 bg-sky-100 text-sky-950 dark:border-sky-500/40 dark:bg-sky-950/35 dark:text-sky-100",
    ring: "border-sky-300/80 dark:border-sky-500/30",
  },
  low: {
    label: "Low",
    badge: "border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-600/50 dark:bg-slate-900/50 dark:text-slate-300",
    ring: "border-slate-200/90 dark:border-slate-700/50",
  },
};

type SnoozePreset = "1h" | "tomorrow" | "next_week" | "custom";

function snoozeIso(preset: SnoozePreset, customLocal?: string): string {
  const now = new Date();
  if (preset === "1h") return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  if (preset === "tomorrow") return resolveCallbackDueAt("tomorrow");
  if (preset === "next_week") return resolveCallbackDueAt("next_week");
  if (preset === "custom" && customLocal?.trim()) return crmDatetimeLocalToIso(customLocal.trim());
  return resolveCallbackDueAt("tomorrow");
}

function KpiCard({
  label,
  value,
  sub,
  tone,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "rose" | "amber" | "sky" | "orange";
  icon: typeof Flame;
  loading?: boolean;
}) {
  const toneClass =
    tone === "rose"
      ? "from-rose-500/15 to-rose-400/5 text-rose-700 dark:text-rose-300"
      : tone === "amber"
        ? "from-amber-500/15 to-amber-400/5 text-amber-800 dark:text-amber-200"
        : tone === "orange"
          ? "from-orange-500/15 to-orange-400/5 text-orange-800 dark:text-orange-200"
          : "from-sky-500/15 to-sky-400/5 text-sky-800 dark:text-sky-200";

  return (
    <div
      className={`min-w-[9.5rem] shrink-0 snap-start rounded-xl border border-white/60 bg-gradient-to-br p-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] sm:min-w-0 sm:flex-1 sm:p-3.5 ${toneClass}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 dark:bg-white/10">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wide opacity-80 sm:text-[11px]">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-12 rounded-md" />
      ) : (
        <p className="mt-1.5 text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl">{value}</p>
      )}
      {sub ? <p className="mt-0.5 text-[10px] font-semibold opacity-75 sm:text-[11px]">{sub}</p> : null}
    </div>
  );
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
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [customSnooze, setCustomSnooze] = useState("");

  const urgency = URGENCY_STYLES[action.urgency];
  const statusKey = normalizeLeadStatus(action.stage);
  const statusBadge = LEAD_STATUS_BADGE[statusKey];
  const statusLabel = t(LEAD_STATUS_I18N_KEY[statusKey]);
  const waUrl = action.phone
    ? buildCommandActionWhatsAppUrl(action.phone, action.customer_name, installerName, action.reason)
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
        /* keep row visible on failure */
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
          title: `Follow-up — ${action.reason.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").slice(0, 80)}`,
          due_at: until,
          followup_type: "call",
          priority: action.urgency === "critical" ? "high" : "medium",
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
      className={`rounded-xl border bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:bg-[#0a1018]/80 sm:p-3.5 ${urgency.ring}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/customers?lead=${encodeURIComponent(action.lead_id)}`}
              className="truncate text-sm font-bold text-slate-900 hover:underline dark:text-white sm:text-base"
            >
              {action.customer_name}
            </Link>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadge.className}`}
            >
              {statusLabel}
            </span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${urgency.badge}`}>
              {urgency.label}
            </span>
          </div>

          <p className="mt-1.5 text-xs font-semibold leading-snug text-slate-800 dark:text-slate-200 sm:text-sm">
            <span aria-hidden>{action.reason_icon} </span>
            {action.reason}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
            {action.system_kw != null ? <span>{action.system_kw} kW</span> : null}
            {action.deal_value_inr != null && action.deal_value_inr > 0 ? (
              <span>{formatInrCompact(action.deal_value_inr)}</span>
            ) : null}
            <span>Due {dueLabel}</span>
          </div>
        </div>

        <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
        {action.phone ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 flex-1 gap-1 text-[11px] sm:h-9 sm:flex-none sm:px-3"
              asChild
              disabled={busy}
            >
              <a href={`tel:${action.phone}`} onClick={() => void logCustomerContact(action.lead_id, "call")}>
                <Phone className="h-3.5 w-3.5" aria-hidden />
                Call
              </a>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 flex-1 gap-1 text-[11px] sm:h-9 sm:flex-none sm:px-3"
              disabled={busy || !waUrl}
              onClick={() => void handleWhatsApp()}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              WhatsApp
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 flex-1 gap-1 text-[11px] sm:h-9 sm:flex-none sm:px-3"
          disabled={busy}
          onClick={() => void handleMarkDone()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Done
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 flex-1 gap-1 text-[11px] sm:h-9 sm:flex-none sm:px-3"
          disabled={busy}
          onClick={() => setSnoozeOpen((v) => !v)}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Snooze
        </Button>
      </div>

      {snoozeOpen ? (
        <div className="mt-2 space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/90 p-2.5 dark:border-slate-700/60 dark:bg-slate-900/40">
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
              Custom date
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

  const { data, error, isLoading, mutate } = useSWR("crm-command-center", fetchCommandCenter, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const actions = useMemo(
    () => (data?.actions ?? []).filter((a) => !dismissed.has(a.id)),
    [data?.actions, dismissed]
  );

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const loading = isLoading && !data;

  return (
    <section className="ws-zone-surface">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <DashboardSectionTitle>Command Center</DashboardSectionTitle>
          <p className="-mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            Your daily action list — overdue, hot leads, visits, and callbacks in one place.
          </p>
        </div>
        {!loading && data ? (
          <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">
            Updated {formatCrmTime(data.generated_at)}
          </p>
        ) : null}
      </div>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        <KpiCard
          label="Hot Leads"
          value={String(data?.kpis.hot_leads ?? 0)}
          sub="Proposal / bill activity"
          tone="orange"
          icon={Flame}
          loading={loading}
        />
        <KpiCard
          label="Overdue"
          value={String(data?.kpis.overdue_followups ?? 0)}
          sub="Follow-ups past due"
          tone="rose"
          icon={AlarmClock}
          loading={loading}
        />
        <KpiCard
          label="Today"
          value={String(data?.kpis.today_tasks ?? 0)}
          sub="Callbacks & visits"
          tone="amber"
          icon={CalendarCheck}
          loading={loading}
        />
        <KpiCard
          label="Pipeline at risk"
          value={formatInrCompact(data?.kpis.pipeline_at_risk_inr ?? 0)}
          sub="Inactive 7+ days"
          tone="sky"
          icon={IndianRupee}
          loading={loading}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200">
          Could not load command center. Pull to refresh or try again shortly.
        </p>
      ) : null}

      <div className="space-y-2 sm:space-y-2.5">
        {loading ? (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        ) : actions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/60 px-4 py-8 text-center dark:border-slate-600/50 dark:bg-slate-900/30">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">All clear for now</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              No overdue follow-ups, hot leads, or today&apos;s tasks. Check back after new proposal views or schedule
              callbacks from Customers.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/customers">Open customers</Link>
            </Button>
          </div>
        ) : (
          actions.map((action) => (
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
    </section>
  );
}
