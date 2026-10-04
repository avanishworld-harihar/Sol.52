"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowUpRight, CircleAlert, Flame, Phone, Sparkles, ThermometerSun, Wrench } from "lucide-react";

import { CUSTOMER_INSIGHTS_SWR_KEY, fetchCustomerInsights } from "@/lib/customer-insights-client";
import { cn } from "@/lib/utils";

const TEMPERATURE = {
  hot: {
    label: "Hot",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/35 dark:text-rose-200",
    icon: Flame,
  },
  warm: {
    label: "Warm",
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/35 dark:text-amber-100",
    icon: ThermometerSun,
  },
  nurture: {
    label: "Nurture",
    className: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300",
    icon: Sparkles,
  },
} as const;

export function CustomerFocusPlan() {
  const { data } = useSWR(CUSTOMER_INSIGHTS_SWR_KEY, fetchCustomerInsights, {
    dedupingInterval: 60_000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  if (!data || data.priorityLeads.length === 0) return null;

  const qualityItems = [
    { label: "High-value without action", count: data.quality.highValueNoAction, href: "/customers?view=no-action" },
    { label: "Untouched new leads", count: data.quality.untouchedNew, href: "/customers?view=new" },
    { label: "Stale proposals", count: data.quality.staleProposals, href: "/customers?view=proposal-followup" },
    { label: "Missing phone", count: data.quality.missingPhone, href: "/customers" },
    { label: "Missing bill", count: data.quality.missingBill, href: "/customers" },
  ].filter((item) => item.count > 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-teal-50/70 shadow-[0_14px_40px_-26px_rgba(79,70,229,0.5)] dark:border-indigo-500/25 dark:from-indigo-950/35 dark:via-white/[0.025] dark:to-teal-950/25" aria-labelledby="focus-plan-title">
      <div className="flex flex-col gap-3 border-b border-indigo-100/80 px-3 py-3 dark:border-indigo-500/15 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p id="focus-plan-title" className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">Sales focus plan</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Best opportunities ranked by stage, value, activity and callback urgency.</p>
          </div>
        </div>
        <span className="self-start rounded-full border border-indigo-200 bg-white/80 px-2.5 py-1 text-[9px] font-bold text-indigo-700 dark:border-indigo-500/25 dark:bg-white/[0.05] dark:text-indigo-200 sm:self-auto">
          Transparent scoring · no black box
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex snap-x gap-3 overflow-x-auto pb-1" aria-label="Priority leads">
          {data.priorityLeads.map((lead, index) => {
            const temperature = TEMPERATURE[lead.temperature];
            const TemperatureIcon = temperature.icon;
            return (
              <article key={lead.id} className="min-w-[17rem] max-w-[19rem] flex-1 snap-start rounded-xl border border-white/90 bg-white/90 p-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-[#0c1017]/90">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tabular-nums text-slate-400">#{index + 1}</span>
                      <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{lead.name}</h3>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{lead.city || "Location not added"} · {lead.reason}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900" title="Opportunity score">
                    <span className="text-sm font-black leading-none tabular-nums">{lead.score}</span>
                    <span className="mt-0.5 text-[7px] font-bold uppercase opacity-65">score</span>
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-extrabold", temperature.className)}>
                    <TemperatureIcon className="h-3 w-3" aria-hidden />
                    {temperature.label}
                  </span>
                  <span className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-400">{lead.status.replace(/-/g, " ")}</span>
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/[0.05]">
                  <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Recommended next action</p>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">{lead.nextAction}</p>
                </div>

                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <Link href={`/customers/${encodeURIComponent(lead.id)}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[10px] font-extrabold text-white transition hover:bg-indigo-700">
                    Open customer <ArrowUpRight className="h-3 w-3" aria-hidden />
                  </Link>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-indigo-600 transition hover:bg-indigo-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-indigo-300" aria-label={`Call ${lead.name}`}>
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : (
                    <Link href={`/customers/${encodeURIComponent(lead.id)}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200" aria-label={`Complete ${lead.name} profile`}>
                      <Wrench className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {qualityItems.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1" aria-label="CRM quality gaps">
            <span className="flex shrink-0 items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-slate-400"><CircleAlert className="h-3 w-3" aria-hidden /> Fix next</span>
            {qualityItems.map((item) => (
              <Link key={item.label} href={item.href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[9px] font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-200">
                <span className="font-black tabular-nums text-slate-900 dark:text-white">{item.count}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
