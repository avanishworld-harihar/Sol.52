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
        "rounded-xl border border-slate-200/90 bg-white p-4 dark:border-white/10 dark:bg-[#0c1017] sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="ws-icon-well ws-icon-well--warning h-8 w-8" aria-hidden>
            <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Urgent attention
          </h3>
        </div>
        <Link
          href={projectFilterHref({ health: "blocked" })}
          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300"
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
                className="group flex items-start justify-between gap-3 py-2.5 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
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
