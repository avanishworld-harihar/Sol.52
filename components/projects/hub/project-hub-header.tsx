"use client";

import { ProjectHealthBadge } from "@/components/projects/project-health-badge";
import { ProjectStageBadge } from "@/components/projects/project-stage-badge";
import { ProjectStageProgressBar } from "@/components/projects/hub/project-stage-progress-bar";
import { ProjectHubStageActions } from "@/components/projects/hub/project-hub-stage-actions";
import { Button } from "@/components/ui/button";
import type { ProjectListItem } from "@/lib/project-api-client";
import { projectDisplayName } from "@/lib/project-list-utils";
import {
  getNextStage,
  isNmSubstatus,
  isProjectStageId,
  NM_SUBSTATUS_LABELS,
  type NmSubstatus,
  type ProjectStageStatus,
} from "@/lib/project-stages";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, MoreHorizontal, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ProjectHubHeader({
  project,
  className,
  statusBusy,
  onAdvanceClick,
  onStageStatusChange,
  onNmSubstatusChange,
}: {
  project: ProjectListItem;
  className?: string;
  statusBusy?: boolean;
  onAdvanceClick?: () => void;
  onStageStatusChange?: (status: ProjectStageStatus) => void | Promise<void>;
  onNmSubstatusChange?: (substatus: NmSubstatus) => void | Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const name = projectDisplayName(project);

  const canAdvance =
    isProjectStageId(project.current_stage) && getNextStage(project.current_stage) != null;

  const nmLabel =
    project.current_stage === "net_metering" && isNmSubstatus(project.nm_substatus)
      ? NM_SUBSTATUS_LABELS[project.nm_substatus]
      : null;

  return (
    <header
      className={cn(
        "workspace-page-hero workspace-glass workspace-page-hero--projects overflow-hidden p-5 sm:p-6 md:p-7",
        className
      )}
    >
      <div className="relative z-[1] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-800 dark:text-slate-400 dark:hover:text-teal-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Projects
            </Link>
            <div>
              <p className="ws-type-eyebrow workspace-type-eyebrow">Project Hub</p>
              <h1 className="ws-type-greeting workspace-type-greeting mt-1 text-balance">{name}</h1>
              {project.project_code ? (
                <p className="mt-1 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {project.project_code}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAdvance || statusBusy}
              className="gap-1"
              onClick={onAdvanceClick}
            >
              Advance stage
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
                <span className="sr-only">Project actions</span>
              </Button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#0c1017]"
                  >
                    <Link
                      href="/projects"
                      role="menuitem"
                      className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      Back to project list
                    </Link>
                    {project.lead_id ? (
                      <Link
                        href={`/customers/${encodeURIComponent(project.lead_id)}`}
                        role="menuitem"
                        className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                        onClick={() => setMenuOpen(false)}
                      >
                        Open CRM customer
                      </Link>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ProjectStageBadge stage={project.current_stage} />
          <ProjectHealthBadge health={project.health} />
          {nmLabel ? (
            <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
              NM: {nmLabel}
            </span>
          ) : null}
        </div>

        {onStageStatusChange && onNmSubstatusChange ? (
          <ProjectHubStageActions
            project={project}
            disabled={statusBusy}
            onStageStatusChange={onStageStatusChange}
            onNmSubstatusChange={onNmSubstatusChange}
          />
        ) : null}

        <div className="grid gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            Manager: {project.manager_name?.trim() || "—"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            Technician: {project.tech_name?.trim() || "—"}
          </span>
        </div>

        <div className="border-t border-white/50 pt-4 dark:border-white/10">
          <ProjectStageProgressBar currentStage={project.current_stage} />
        </div>
      </div>
    </header>
  );
}
