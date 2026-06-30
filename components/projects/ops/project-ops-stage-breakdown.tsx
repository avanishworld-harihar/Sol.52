"use client";

import { opsPanelClass, opsPanelTitleClass } from "@/components/projects/ops/ops-panel-styles";
import type { ProjectDashboardStats } from "@/lib/project-api-client";
import { STAGE_BAR_FILL_CLASS, STAGE_COLOR_CLASS } from "@/lib/project-stages";
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
    <article className={cn(opsPanelClass("p-4 sm:p-5"), className)}>
      <h3 className={opsPanelTitleClass()}>Stage breakdown</h3>
      <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
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
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    STAGE_BAR_FILL_CLASS[seg.id]
                  )}
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
