"use client";

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
    <article
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-4 dark:border-white/10 dark:bg-[#0c1017] sm:p-5",
        className
      )}
    >
      <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Project health
      </h3>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <div
            className="h-full w-full rounded-full"
            style={{ background: gradient }}
            role="img"
            aria-label={`Health breakdown for ${total} projects`}
          />
          <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white dark:bg-[#0c1017]">
            <span className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {total}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              total
            </span>
          </div>
        </div>
        <ul className="w-full min-w-0 space-y-2">
          {segments.map((seg) => (
            <li key={seg.id}>
              <Link
                href={projectFilterHref({ health: seg.id })}
                className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", seg.colorClass)} />
                  <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {seg.label}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
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
