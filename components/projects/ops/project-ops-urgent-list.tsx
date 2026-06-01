"use client";

import { ProjectHealthBadge } from "@/components/projects/project-health-badge";
import { ProjectStageBadge } from "@/components/projects/project-stage-badge";
import type { ProjectListItem } from "@/lib/project-api-client";
import {
  pickUrgentProjects,
  projectFilterHref,
  urgentProjectSubtitle,
} from "@/lib/project-ops-dashboard-utils";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ProjectOpsUrgentList({
  projects,
  className,
}: {
  projects: ProjectListItem[] | null | undefined;
  className?: string;
}) {
  const rows = pickUrgentProjects(projects, 5);

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-3 dark:border-white/10 dark:bg-[#0c1017] max-sm:p-2.5 sm:p-5",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 max-sm:mb-1.5 sm:mb-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className="ws-icon-well ws-icon-well--warning h-7 w-7 shrink-0 max-sm:h-6 max-sm:w-6 sm:h-8 sm:w-8" aria-hidden>
            <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <h3 className="truncate text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 max-sm:text-[9px] sm:text-xs">
            Urgent attention
          </h3>
        </div>
        <Link
          href={projectFilterHref({ health: "blocked" })}
          className="shrink-0 text-[10px] font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300 max-sm:text-[9px] sm:text-[11px]"
        >
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/20 dark:text-emerald-200">
          No blocked or delayed projects — pipeline is on track.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${encodeURIComponent(p.id)}`}
                className="group flex items-start justify-between gap-2 py-1.5 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03] max-sm:py-1 sm:gap-3 sm:py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-white sm:text-sm">
                    {urgentProjectSubtitle(p)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <ProjectStageBadge stage={p.current_stage} compact />
                    <ProjectHealthBadge health={p.health} />
                  </div>
                </div>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
