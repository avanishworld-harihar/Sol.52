"use client";

import type { ProjectListItem } from "@/lib/project-api-client";
import {
  formatDueLabel,
  pickPaymentsDue,
  projectFilterHref,
  urgentProjectSubtitle,
} from "@/lib/project-ops-dashboard-utils";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import { CalendarClock, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ProjectOpsPaymentsDue({
  projects,
  className,
}: {
  projects: ProjectListItem[] | null | undefined;
  className?: string;
}) {
  const rows = pickPaymentsDue(projects, 5);

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white p-4 dark:border-white/10 dark:bg-[#0c1017] sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="ws-icon-well ws-icon-well--teal h-8 w-8" aria-hidden>
            <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Payments & milestones
          </h3>
        </div>
        <Link
          href={projectFilterHref({ health: "attention_needed" })}
          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300"
        >
          View due soon
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No upcoming milestone dates with outstanding balance.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {rows.map((p) => {
            const overdue = (p.days_until_due ?? 0) < 0;
            const dueSoon =
              p.days_until_due != null && p.days_until_due >= 0 && p.days_until_due <= 7;
            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${encodeURIComponent(p.id)}`}
                  className="group flex items-start justify-between gap-3 py-2.5 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                      {urgentProjectSubtitle(p)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Pending {formatInrCompact(p.pending_inr)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-xs font-bold",
                        overdue && "text-red-600 dark:text-red-400",
                        dueSoon && !overdue && "text-amber-700 dark:text-amber-300",
                        !overdue && !dueSoon && "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {formatDueLabel(p.days_until_due)}
                    </p>
                    <ArrowRight
                      className="ml-auto mt-1 h-4 w-4 text-slate-400 opacity-0 transition group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
