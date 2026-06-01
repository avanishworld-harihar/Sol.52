"use client";

import type { ProjectDashboardStats } from "@/lib/project-api-client";
import { STAGE_COLOR_CLASS } from "@/lib/project-stages";
import { buildStageSegments, projectFilterHref } from "@/lib/project-ops-dashboard-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ProjectOpsStageBreakdown({
  stats,
  className,
}: {
  stats: ProjectDashboardStats | null | undefined;
  className?: string;
}) {
  const segments = buildStageSegments(stats);
  const max = Math.max(1, ...segments.map((s) => s.count));

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-3 dark:border-white/10 dark:bg-[#0c1017] max-sm:p-2.5 sm:p-5",
        className
      )}
    >
      <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 max-sm:text-[9px] sm:text-xs">
        Stage breakdown
      </h3>
      <ul className="mt-2 space-y-1.5 max-sm:mt-1.5 max-sm:space-y-1 sm:mt-4 sm:space-y-2.5">
        {segments.map((seg) => (
          <li key={seg.id}>
            <Link
              href={projectFilterHref({ stage: seg.id })}
              className="group block rounded-md px-0.5 py-0 transition hover:bg-slate-50 dark:hover:bg-white/[0.04] sm:rounded-lg sm:px-1 sm:py-0.5"
            >
              <div className="mb-0.5 flex items-center justify-between gap-2 sm:mb-1">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    STAGE_COLOR_CLASS[seg.id]
                  )}
                >
                  {seg.label}
                </span>
                <span className="text-xs font-extrabold tabular-nums text-slate-900 dark:text-white sm:text-sm">
                  {seg.count}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10 max-sm:h-1 sm:h-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width] duration-500"
                  style={{ width: `${Math.round((seg.count / max) * 100)}%` }}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
