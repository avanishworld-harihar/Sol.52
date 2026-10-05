"use client";

import { fetchProjectReports, PROJECT_REPORTS_KEY } from "@/lib/project-api-client";
import { BarChart3, CalendarCheck2, Clock3, Zap } from "lucide-react";
import useSWR from "swr";

export function ProjectOpsReports() {
  const { data } = useSWR(PROJECT_REPORTS_KEY, fetchProjectReports, { revalidateOnFocus: false, dedupingInterval: 60_000 });
  if (!data) return null;
  const metrics = [
    { label: "Completed this month", value: data.completed_this_month, icon: CalendarCheck2 },
    { label: "Capacity delivered", value: `${data.completed_capacity_kw} kW`, icon: Zap },
    { label: "Average cycle", value: data.average_cycle_days == null ? "—" : `${data.average_cycle_days} days`, icon: Clock3 },
    { label: "No update for 14d", value: data.stale_projects, icon: BarChart3 },
  ];
  return <section className="rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-white/10 dark:bg-[#0c1017]" aria-label="Delivery reports"><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Delivery performance</h3><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Live portfolio</span></div><div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.04]"><Icon className="h-4 w-4 text-teal-600" /><p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-base font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p></div>)}</div>{data.manager_workload.length ? <div className="mt-3 flex flex-wrap gap-2">{data.manager_workload.map((row) => <span key={row.name} className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{row.name}: {row.count}</span>)}</div> : null}</section>;
}
