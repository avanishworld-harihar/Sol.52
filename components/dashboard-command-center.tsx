"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStatsPayload } from "@/lib/dashboard-stats-client";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlarmClock,
  ArrowRight,
  CalendarCheck,
  CircleDollarSign,
  ClipboardList,
  Flame,
  Send,
  Sun,
  UserPlus,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { buildNewProposalHref, prepareNewProposalNavigation } from "@/lib/proposal-builder-session";
import { useEffect, useState } from "react";
import useSWR from "swr";
import type { CommandCenterPayload } from "@/lib/crm-command-center-types";

type DashboardCommandCenterProps = {
  name?: string;
  stats?: DashboardStatsPayload | null;
  loading?: boolean;
  className?: string;
};

function formatInr(n: number): string {
  return `₹${Math.round(Math.max(0, n)).toLocaleString("en-IN")}`;
}

async function fetchDailyBrief(): Promise<CommandCenterPayload> {
  const res = await fetch("/api/crm/command-center", { cache: "no-store" });
  const json = (await res.json()) as { ok?: boolean; data?: CommandCenterPayload; error?: string };
  if (!res.ok || !json.ok || !json.data) throw new Error(json.error || "daily_brief_load_failed");
  return json.data;
}

function useAnimatedInt(target: number, enabled: boolean, durationMs = 680) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled || !Number.isFinite(target)) {
      setValue(target);
      return;
    }
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    setValue(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, durationMs]);
  return value;
}

export function DashboardCommandCenter({ name, stats, loading, className }: DashboardCommandCenterProps) {
  const { t, locale } = useLanguage();
  const reduced = useReducedMotion();
  const uiLang = locale === "en" ? "en" : "hi";
  const rawDisplayName = name?.trim();
  const displayName = rawDisplayName
    ? `${rawDisplayName.charAt(0).toLocaleUpperCase()}${rawDisplayName.slice(1)}`
    : "";
  const greeting = displayName ? `Hi! ${displayName}` : uiLang === "hi" ? "नमस्ते!" : "Hi!";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });

  const pipeline = [
    {
      key: "leads",
      tone: "sky" as const,
      label: uiLang === "hi" ? "लीड्स" : "Leads",
      raw: stats?.totalLeads ?? 0,
      format: (n: number) => String(n),
      icon: UserPlus,
      href: "/customers?stage=leads"
    },
    {
      key: "proposals",
      tone: "emerald" as const,
      label: uiLang === "hi" ? "प्रस्ताव" : "Proposals",
      raw: stats?.proposalsSent ?? 0,
      format: (n: number) => String(n),
      icon: Send,
      href: "/customers?stage=proposal-sent"
    },
    {
      key: "orders",
      tone: "amber" as const,
      label: uiLang === "hi" ? "ऑर्डर" : "Orders",
      raw: stats?.orders ?? 0,
      format: (n: number) => String(n),
      icon: ClipboardList,
      href: "/projects"
    },
    {
      key: "kw",
      tone: "teal" as const,
      label: uiLang === "hi" ? "इंस्टॉल kW" : "Installed",
      raw: Math.round(stats?.installedKw ?? 0),
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: Sun,
      href: "/projects?stage=completed"
    }
  ];

  const animate = Boolean(stats) && !loading;
  const anim = {
    leads: useAnimatedInt(stats?.totalLeads ?? 0, animate),
    proposals: useAnimatedInt(stats?.proposalsSent ?? 0, animate),
    orders: useAnimatedInt(stats?.orders ?? 0, animate),
    kw: useAnimatedInt(Math.round(stats?.installedKw ?? 0), animate)
  };

  const isLive = Boolean(stats) && !loading;
  const { data: dailyBrief, isLoading: briefLoading } = useSWR<CommandCenterPayload>("crm-command-center", fetchDailyBrief, {
    dedupingInterval: 30_000,
    revalidateOnFocus: true,
  });
  const briefItems = [
    { label: "Overdue", value: dailyBrief?.kpis.overdue_followups ?? 0, icon: AlarmClock, href: "/agenda?filter=critical#priority-queue", tone: "rose" },
    { label: "Due today", value: dailyBrief?.kpis.today_tasks ?? 0, icon: CalendarCheck, href: "/agenda?filter=today#priority-queue", tone: "amber" },
    { label: "Hot leads", value: dailyBrief?.kpis.hot_leads ?? 0, icon: Flame, href: "/agenda?filter=hot#priority-queue", tone: "violet" },
    { label: "To collect", value: stats ? formatInr(stats.pendingPayments) : "—", icon: Wallet, href: "/projects?collections=1", tone: "teal" },
  ] as const;
  const briefTone = {
    rose: "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-500/25 dark:bg-rose-950/25 dark:text-rose-300",
    amber: "border-amber-200 bg-amber-50/80 text-amber-800 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-200",
    violet: "border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-500/25 dark:bg-violet-950/25 dark:text-violet-300",
    teal: "border-teal-200 bg-teal-50/80 text-teal-700 dark:border-teal-500/25 dark:bg-teal-950/25 dark:text-teal-300",
  } as const;

  return (
    <header className={cn("glass-command-center isolate ws-command-enter", className)}>
      <div className="glass-command-rim pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden />
      <div className="glass-command-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="glass-hero-bloom pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div className="glass-command-sheen pointer-events-none absolute inset-0" aria-hidden />
      <div className="glass-command-reflect pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden />
      <div className="glass-hero-noise pointer-events-none absolute inset-0 opacity-[0.2]" aria-hidden />

      <motion.div className="dashboard-command-content relative flex flex-col gap-4 p-4 sm:p-5 lg:p-6">
        {/* Status rail — workspace label + greeting + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-4">
          <div className="min-w-0 space-y-1.5 lg:space-y-2">
            <div className="flex flex-wrap items-center gap-2 lg:gap-2.5">
              <span className="ws-type-eyebrow">{uiLang === "hi" ? "वर्कस्पेस" : "Workspace"}</span>
              {isLive ? (
                <span className="ws-live-pill inline-flex items-center gap-1.5">
                  <span className="ws-live-dot" aria-hidden />
                  {uiLang === "hi" ? "लाइव" : "Live"}
                </span>
              ) : loading ? (
                <span className="ws-live-pill ws-live-pill--muted">{uiLang === "hi" ? "सिंक" : "Sync"}</span>
              ) : null}
            </div>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="relative flex h-3 w-3 shrink-0" aria-label={uiLang === "hi" ? "ऑनलाइन" : "Online"} role="status">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 motion-safe:animate-ping" aria-hidden />
                <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.9)] dark:border-slate-900" aria-hidden />
              </span>
              <p className="ws-type-greeting min-w-0 text-balance">
                {greeting}
                <span className="ws-type-greeting-meta"> · {dateStr}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 lg:gap-2.5">
            <Link
              href="/customers?add=1"
              className="glass-hero-cta-secondary hidden rounded-lg px-3 py-2 text-xs font-semibold sm:inline-flex lg:px-4 lg:py-2.5 lg:text-sm"
            >
              {t("dashboard_addCustomerCta")}
            </Link>
            <Link
              href={buildNewProposalHref()}
              onClick={prepareNewProposalNavigation}
              className="glass-hero-cta group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white lg:px-5 lg:py-3 lg:text-base"
            >
              {t("actions_newProposal")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 lg:h-4 lg:w-4" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Daily brief — the four signals needed before starting work. */}
        <section aria-labelledby="daily-brief-heading">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p id="daily-brief-heading" className="ws-type-label">{uiLang === "hi" ? "आज का सार" : "Today at a glance"}</p>
            <Link href="/agenda#priority-queue" className="text-[10px] font-extrabold text-teal-700 hover:underline dark:text-teal-300 sm:text-xs">Open priorities →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {briefItems.map((item) => {
              const Icon = item.icon;
              const waiting = item.label === "To collect" ? loading && !stats : briefLoading && !dailyBrief;
              return (
                <Link key={item.label} href={item.href} className={cn("group flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-sm", briefTone[item.tone])}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/75 shadow-sm dark:bg-white/10"><Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden /></span>
                  <span className="min-w-0"><span className="block text-[9px] font-extrabold uppercase tracking-wide opacity-75 sm:text-[10px]">{item.label}</span>{waiting ? <Skeleton className="mt-1 h-5 w-10 rounded" /> : <span className="block truncate text-base font-black tabular-nums sm:text-lg">{item.value}</span>}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Pipeline console — single compact control strip. */}
        <nav className="glass-pipeline-console !grid grid-cols-4 sm:!flex" aria-label={uiLang === "hi" ? "पाइपलाइन कंसोल" : "Pipeline console"}>
          {pipeline.map((seg, i) => {
            const Icon = seg.icon;
            const val = loading && !stats ? "—" : seg.format(anim[seg.key as keyof typeof anim] ?? seg.raw);
            const segment = (
              <Link
                href={seg.href}
                className={cn(
                  "glass-pipeline-segment group !flex-col !gap-1 !px-1.5 !py-2.5 text-center sm:!flex-row sm:!gap-3 sm:!px-4 sm:!py-4 sm:text-left lg:!gap-3.5 lg:!px-5 lg:!py-4",
                  `glass-pipeline-segment--${seg.tone}`,
                  i > 0 && "glass-pipeline-segment--divider"
                )}
              >
                <span className={cn("ws-icon-well h-7 w-7 shrink-0 sm:h-9 sm:w-9 lg:h-10 lg:w-10", `ws-icon-well--${seg.tone}`)} aria-hidden>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-[1.125rem] lg:w-[1.125rem]" strokeWidth={2.25} />
                </span>
                <span className="min-w-0">
                  <span className="glass-pipeline-segment-value tabular-nums">{val}</span>
                  <span className="glass-pipeline-segment-label">{seg.label}</span>
                </span>
              </Link>
            );
            if (reduced) return <div key={seg.key}>{segment}</div>;
            return (
              <motion.div
                key={seg.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.04 * i }}
              >
                {segment}
              </motion.div>
            );
          })}
        </nav>

        {/* Financial pulse — intentionally slim when there is little data. */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-white/65 bg-white/45 px-3 py-2.5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.035] sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <span className="ws-icon-well ws-icon-well--emerald h-8 w-8 shrink-0" aria-hidden><CircleDollarSign className="h-4 w-4" strokeWidth={2.25} /></span>
          <span className="min-w-0 flex-1"><span className="block text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{uiLang === "hi" ? "वित्तीय पल्स" : "Financial pulse"}</span><span className="mt-0.5 block text-xs font-semibold text-slate-600 dark:text-slate-300 sm:text-sm">Revenue <strong className="text-slate-950 dark:text-white">{stats ? formatInr(stats.revenue) : "—"}</strong><span className="mx-2 text-slate-300 dark:text-slate-600">•</span>Pending <strong className={cn(stats && stats.pendingPayments > 0 ? "text-rose-600 dark:text-rose-300" : "text-slate-950 dark:text-white")}>{stats ? formatInr(stats.pendingPayments) : "—"}</strong></span></span>
          <div className="col-span-2 flex gap-1.5 sm:col-span-1 sm:shrink-0">
            <Link href="/projects?collections=1" className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-teal-200 bg-white/75 px-3 text-[11px] font-extrabold text-teal-800 transition hover:bg-white dark:border-teal-500/25 dark:bg-white/5 dark:text-teal-200 sm:flex-none">Collections</Link>
            <Link href="/projects?health=attention_needed" className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-white/75 px-3 text-[11px] font-extrabold text-amber-800 transition hover:bg-white dark:border-amber-500/25 dark:bg-white/5 dark:text-amber-200 sm:flex-none">Needs attention <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
