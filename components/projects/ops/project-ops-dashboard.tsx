"use client";

import { ProjectOpsHealthRing } from "@/components/projects/ops/project-ops-health-ring";
import { ProjectOpsMetricsStrip } from "@/components/projects/ops/project-ops-metrics-strip";
import { ProjectOpsPaymentsDue } from "@/components/projects/ops/project-ops-payments-due";
import { ProjectOpsDashboardSkeleton } from "@/components/projects/ops/project-ops-dashboard-skeleton";
import { ProjectOpsStageBreakdown } from "@/components/projects/ops/project-ops-stage-breakdown";
import { ProjectOpsUrgentList } from "@/components/projects/ops/project-ops-urgent-list";
import type { ProjectDashboardStats, ProjectListItem } from "@/lib/project-api-client";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

function OpsDashboardBody({
  stats,
  projects,
  className,
  onPendingCollectionClick,
}: {
  stats: ProjectDashboardStats | null | undefined;
  projects: ProjectListItem[] | null | undefined;
  className?: string;
  onPendingCollectionClick?: () => void;
}) {
  return (
    <section
      className={cn("page-lite-item space-y-2 max-sm:space-y-1.5 sm:space-y-4", className)}
      aria-label="Operations dashboard"
    >
      <ProjectOpsMetricsStrip
        stats={stats}
        onPendingCollectionClick={onPendingCollectionClick}
      />

      <div className="grid gap-2 max-sm:gap-1.5 sm:gap-4 lg:grid-cols-12">
        <ProjectOpsHealthRing stats={stats} className="lg:col-span-5" />
        <ProjectOpsStageBreakdown stats={stats} className="lg:col-span-7" />
        <ProjectOpsUrgentList projects={projects} className="lg:col-span-6" />
        <ProjectOpsPaymentsDue projects={projects} className="lg:col-span-6" />
      </div>
    </section>
  );
}

export function ProjectOpsDashboard({
  stats,
  projects,
  loading,
  className,
  onPendingCollectionClick,
}: {
  stats: ProjectDashboardStats | null | undefined;
  projects: ProjectListItem[] | null | undefined;
  loading?: boolean;
  className?: string;
  onPendingCollectionClick?: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading && !stats) {
    return <ProjectOpsDashboardSkeleton className={className} />;
  }

  return (
    <>
      <div className={cn("sm:hidden", className)}>
        <button
          type="button"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="flex min-h-[28px] w-full items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-white/90 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-200"
        >
          <span>Operations dashboard</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", mobileOpen && "rotate-180")}
            aria-hidden
          />
        </button>
        {mobileOpen ? (
          <div className="mt-1">
            <OpsDashboardBody
              stats={stats}
              projects={projects}
              className="!p-0"
              onPendingCollectionClick={onPendingCollectionClick}
            />
          </div>
        ) : null}
      </div>

      <div className="hidden sm:block">
        <OpsDashboardBody
          stats={stats}
          projects={projects}
          className={className}
          onPendingCollectionClick={onPendingCollectionClick}
        />
      </div>
    </>
  );
}
