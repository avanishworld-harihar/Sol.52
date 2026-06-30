"use client";

import { opsPanelClass, opsPanelTitleClass } from "@/components/projects/ops/ops-panel-styles";
import type { ProjectDashboardStats } from "@/lib/project-api-client";
import {
  buildHealthRingGradient,
  buildHealthSegments,
  projectFilterHref,
} from "@/lib/project-ops-dashboard-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ProjectOpsHealthRing({
  stats,
  className,
}: {
  stats: ProjectDashboardStats | null | undefined;
  className?: string;
}) {
  const segments = buildHealthSegments(stats);
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const gradient = buildHealthRingGradient(segments);

  return (
    <article className={cn(opsPanelClass("p-4 sm:p-5"), className)}>
      <h3 className={opsPanelTitleClass()}>Project health</h3>
      <div className="mt-3 flex flex-col items-center gap-3 sm:mt-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
          <div
            className="h-full w-full rounded-full shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]"
            style={{ background: gradient }}
            role="img"
            aria-label={`Health breakdown for ${total} projects`}
          />
          <div className="absolute inset-[16%] flex flex-col items-center justify-center rounded-full bg-white shadow-inner dark:bg-[#0c1017]">
            <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
              {total}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px]">
              total
            </span>
          </div>
        </div>
        <ul className="w-full min-w-0 space-y-1 max-sm:space-y-0.5 sm:space-y-2">
          {segments.map((seg) => (
            <li key={seg.id}>
              <Link
                href={projectFilterHref({ health: seg.id })}
                className="group flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition hover:bg-slate-50 dark:hover:bg-white/[0.04] sm:rounded-lg sm:px-2 sm:py-1.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", seg.colorClass)} />
                  <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
                    {seg.label}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-extrabold tabular-nums text-slate-900 dark:text-white sm:text-sm">
                  {seg.count}
                  <span className="ml-1 text-[10px] font-bold text-slate-400">
                    {total > 0 ? `${seg.pct}%` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
