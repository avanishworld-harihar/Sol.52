"use client";

import Link from "next/link";
import useSWR from "swr";
import { AlertTriangle, BarChart3, CalendarClock, CalendarX2, ChevronDown, Moon, ShieldCheck, TrendingUp, UserPlus } from "lucide-react";

import {
  CUSTOMER_INSIGHTS_SWR_KEY,
  fetchCustomerInsights,
} from "@/lib/customer-insights-client";
import type { LeadStatusKey } from "@/lib/lead-status";
import { cn } from "@/lib/utils";

const STAGE_META: Record<LeadStatusKey, { label: string; color: string; href: string }> = {
  new: { label: "New", color: "bg-sky-500", href: "/customers?view=new" },
  contacted: { label: "Contacted", color: "bg-violet-500", href: "/customers?stage=leads" },
  "proposal-sent": { label: "Proposal sent", color: "bg-indigo-500", href: "/customers?view=proposal-followup" },
  "site-survey": { label: "Site survey", color: "bg-amber-500", href: "/customers?stage=leads" },
  design: { label: "Design", color: "bg-cyan-500", href: "/customers?stage=leads" },
  won: { label: "Won", color: "bg-emerald-500", href: "/customers?view=won" },
};

function InsightSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.06]" />
      ))}
    </div>
  );
}

export function CustomerSalesInsights() {
  const { data, error, isLoading } = useSWR(
    CUSTOMER_INSIGHTS_SWR_KEY,
    fetchCustomerInsights,
    { dedupingInterval: 60_000, revalidateOnFocus: true, keepPreviousData: true }
  );

  return (
    <details
      className="group rounded-2xl border border-slate-200/80 bg-white/85 shadow-[0_10px_35px_-24px_rgba(15,23,42,0.3)] backdrop-blur-sm open:pb-4 dark:border-white/10 dark:bg-white/[0.035]"
      open
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 marker:hidden sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white shadow-sm">
            <BarChart3 className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">CRM intelligence</p>
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Pipeline health, conversion and attention signals</p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-4 border-t border-slate-100 px-3 pt-4 dark:border-white/[0.07] sm:px-4">
        {isLoading && !data ? <InsightSkeleton /> : null}
        {error && !data ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
            CRM insights अभी load नहीं हो सके. Customer queue बाकी पूरी तरह available है.
          </p>
        ) : null}

        {data ? (
          <>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                { label: "CRM health", value: `${data.summary.healthScore}%`, hint: "Coverage + overdue control", icon: ShieldCheck, tone: "text-teal-700 bg-teal-50 dark:text-teal-200 dark:bg-teal-950/35" },
                { label: "Won conversion", value: `${data.summary.conversionRate}%`, hint: `${data.summary.won} of ${data.summary.total} customers`, icon: TrendingUp, tone: "text-emerald-700 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-950/35" },
                { label: "Follow-up coverage", value: `${data.summary.followupCoverage}%`, hint: `${data.summary.openLeads} open leads`, icon: CalendarClock, tone: "text-indigo-700 bg-indigo-50 dark:text-indigo-200 dark:bg-indigo-950/35" },
                { label: "New this week", value: String(data.summary.newThisWeek), hint: `Avg bill ₹${data.summary.averageMonthlyBill.toLocaleString("en-IN")}`, icon: UserPlus, tone: "text-sky-700 bg-sky-50 dark:text-sky-200 dark:bg-sky-950/35" },
              ].map((metric) => (
                <div key={metric.label} className={cn("rounded-xl p-3", metric.tone)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide opacity-75">{metric.label}</p>
                    <metric.icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </div>
                  <p className="mt-1 text-xl font-black tabular-nums">{metric.value}</p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold opacity-65">{metric.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)]">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-black/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Pipeline movement</p>
                  <span className="text-[10px] font-bold text-slate-400">{data.summary.total} total</span>
                </div>
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-label="Pipeline distribution">
                  {data.stages.map((item) => (
                    <span
                      key={item.stage}
                      className={STAGE_META[item.stage].color}
                      style={{ width: `${data.summary.total > 0 ? (item.count / data.summary.total) * 100 : 0}%` }}
                      title={`${STAGE_META[item.stage].label}: ${item.count}`}
                    />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
                  {data.stages.map((item) => (
                    <Link key={item.stage} href={STAGE_META[item.stage].href} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white">
                      <span className="flex min-w-0 items-center gap-1.5"><span className={cn("h-2 w-2 shrink-0 rounded-full", STAGE_META[item.stage].color)} /><span className="truncate">{STAGE_META[item.stage].label}</span></span>
                      <span className="tabular-nums">{item.count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-black/10">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Needs attention</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { label: "Overdue", count: data.attention.overdue, href: "/customers?view=overdue", icon: AlertTriangle, tone: "text-rose-700 bg-rose-50 dark:text-rose-200 dark:bg-rose-950/30" },
                    { label: "Due today", count: data.attention.dueToday, href: "/customers?view=today", icon: CalendarClock, tone: "text-amber-800 bg-amber-50 dark:text-amber-100 dark:bg-amber-950/30" },
                    { label: "No action", count: data.attention.noNextAction, href: "/customers?view=no-action", icon: CalendarX2, tone: "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-white/[0.07]" },
                    { label: "Dormant", count: data.attention.dormant, href: "/customers?view=dormant", icon: Moon, tone: "text-violet-700 bg-violet-50 dark:text-violet-200 dark:bg-violet-950/30" },
                  ].map((item) => (
                    <Link key={item.label} href={item.href} className={cn("rounded-lg p-2.5 transition hover:brightness-95", item.tone)}>
                      <div className="flex items-center justify-between"><item.icon className="h-3.5 w-3.5 opacity-70" aria-hidden /><span className="text-lg font-black tabular-nums">{item.count}</span></div>
                      <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wide opacity-75">{item.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {data.sources.length > 0 ? (
              <div className="flex snap-x gap-2 overflow-x-auto pb-1" aria-label="Lead source performance">
                {data.sources.map((source) => (
                  <div key={source.source} className="min-w-[9rem] snap-start rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="truncate text-[10px] font-extrabold text-slate-700 dark:text-slate-200">{source.label}</p>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <span className="text-base font-black tabular-nums text-slate-900 dark:text-white">{source.total}</span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-300">{source.conversionRate}% won</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </details>
  );
}
