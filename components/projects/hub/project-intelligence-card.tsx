"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ProjectListItem } from "@/lib/project-api-client";
import { getProjectIntelligence } from "@/lib/project-intelligence";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export function ProjectIntelligenceCard({ project }: { project: ProjectListItem }) {
  const insight = getProjectIntelligence(project);
  const risky = insight.priority !== "normal";
  return (
    <Card className={risky ? "border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-950/20" : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-950/20"}>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[auto,1fr,1fr] lg:items-center">
        <div className="flex items-center gap-3"><div className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${risky ? "border-amber-200 text-amber-700" : "border-emerald-200 text-emerald-700"}`}><span className="text-lg font-black">{insight.score}</span></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Delivery health</p><p className="font-extrabold text-slate-900 dark:text-white">{insight.headline}</p></div></div>
        <div><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{risky ? <AlertTriangle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}Why</p><ul className="mt-1 space-y-1">{insight.reasons.slice(0, 3).map((reason) => <li key={reason} className="flex items-start gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 opacity-60" />{reason}</li>)}</ul></div>
        <div className="rounded-xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Next best action</p><p className="mt-1 flex items-start gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{insight.nextBestAction}</p></div>
      </CardContent>
    </Card>
  );
}
