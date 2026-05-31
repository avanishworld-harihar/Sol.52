"use client";

import { ProjectOpsHealthRing } from "@/components/projects/ops/project-ops-health-ring";
import { ProjectOpsMetricsStrip } from "@/components/projects/ops/project-ops-metrics-strip";
import { ProjectOpsPaymentsDue } from "@/components/projects/ops/project-ops-payments-due";
import { ProjectOpsDashboardSkeleton } from "@/components/projects/ops/project-ops-dashboard-skeleton";
import { ProjectOpsStageBreakdown } from "@/components/projects/ops/project-ops-stage-breakdown";
import { ProjectOpsUrgentList } from "@/components/projects/ops/project-ops-urgent-list";
import type { ProjectDashboardStats, ProjectListItem } from "@/lib/project-api-client";
import { cn } from "@/lib/utils";

export function ProjectOpsDashboard({
  stats,
  projects,
  loading,
  className,
}: {
  stats: ProjectDashboardStats | null | undefined;
  projects: ProjectListItem[] | null | undefined;
  loading?: boolean;
  className?: string;
}) {
  if (loading && !stats) {
    return <ProjectOpsDashboardSkeleton className={className} />;
  }

  return (
    <section
      className={cn("page-lite-item space-y-4", className)}
      aria-label="Operations dashboard"
    >
      <ProjectOpsMetricsStrip stats={stats} />

      <div className="grid gap-4 lg:grid-cols-12">
        <ProjectOpsHealthRing stats={stats} className="lg:col-span-5" />
        <ProjectOpsStageBreakdown stats={stats} className="lg:col-span-7" />
        <ProjectOpsUrgentList projects={projects} className="lg:col-span-6" />
        <ProjectOpsPaymentsDue projects={projects} className="lg:col-span-6" />
      </div>
    </section>
  );
}
