"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectListItem } from "@/lib/project-api-client";
import { STAGE_LABELS, isProjectStageId } from "@/lib/project-stages";
import { CalendarClock, CheckCircle2, ClipboardList, Gauge, UserRound, Zap } from "lucide-react";

function dateLabel(value: string | null) {
  if (!value) return "Not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ProjectHubExecutionTab({ project, onOpenTasks }: { project: ProjectListItem; onOpenTasks: () => void }) {
  const stage = isProjectStageId(project.current_stage) ? STAGE_LABELS[project.current_stage] : project.current_stage;
  const rows = [
    { label: "Current stage", value: stage, icon: Gauge },
    { label: "Target completion", value: dateLabel(project.target_completion), icon: CalendarClock },
    { label: "Project manager", value: project.manager_name?.trim() || "Unassigned", icon: UserRound },
    { label: "Technician", value: project.tech_name?.trim() || "Unassigned", icon: UserRound },
  ];
  return (
    <div id="project-hub-panel-execution" role="tabpanel" aria-labelledby="project-hub-tab-execution" className="space-y-4">
      <Card className="border-slate-200/90 dark:border-white/10">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-extrabold">Delivery control</CardTitle></CardHeader>
        <CardContent className="grid gap-2 pt-0 sm:grid-cols-2">
          {rows.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-white/[0.04]"><Icon className="h-4 w-4 text-teal-600" /><p className="mt-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{value}</p></div>)}
        </CardContent>
      </Card>
      <Card className="border-slate-200/90 dark:border-white/10">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Next best action</p><p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">{project.next_action?.trim() || "Define the next action and owner"}</p></div>
          <Button onClick={onOpenTasks} className="gap-1.5"><ClipboardList className="h-4 w-4" />Open checklist</Button>
        </CardContent>
      </Card>
      {project.current_stage === "net_metering" ? <Card className="border-purple-200/80 bg-purple-50/60 dark:border-purple-500/20 dark:bg-purple-950/20"><CardContent className="grid gap-3 p-4 sm:grid-cols-3"><div><Zap className="h-4 w-4 text-purple-600" /><p className="mt-2 text-[10px] font-bold uppercase text-purple-600">Application</p><p className="font-bold">{project.discom_application_no || "Pending"}</p></div><div><CalendarClock className="h-4 w-4 text-purple-600" /><p className="mt-2 text-[10px] font-bold uppercase text-purple-600">Filed</p><p className="font-bold">{dateLabel(project.nm_application_date)}</p></div><div><CheckCircle2 className="h-4 w-4 text-purple-600" /><p className="mt-2 text-[10px] font-bold uppercase text-purple-600">Activation</p><p className="font-bold">{dateLabel(project.nm_activation_date)}</p></div></CardContent></Card> : null}
    </div>
  );
}
