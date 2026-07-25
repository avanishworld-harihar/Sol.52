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
import { ArrowLeft, ChevronRight, MoreHorizontal } from "lucide-react";
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

  const teamLine = `Mgr ${project.manager_name?.trim() || "—"} · Tech ${project.tech_name?.trim() || "—"}`;

  return (
    <header
      className={cn(
        "workspace-page-hero workspace-glass workspace-page-hero--projects overflow-hidden",
        "max-sm:p-2 sm:p-6 md:p-7",
        className
      )}
    >
      <div className="relative z-[1] space-y-1.5 max-sm:space-y-1 sm:space-y-4">
        <div className="flex items-start gap-2 max-sm:gap-1.5 sm:gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href="/projects"
              className="inline-flex min-h-[28px] items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-teal-800 dark:text-slate-400 dark:hover:text-teal-300 sm:text-xs"
            >
              <ArrowLeft className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden />
              <span className="max-sm:sr-only sm:not-sr-only">Projects</span>
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-1 sm:mt-1 sm:gap-1.5">
              <h1 className="min-w-0 flex-1 truncate text-[15px] font-extrabold leading-tight text-slate-900 dark:text-slate-50 sm:text-xl lg:text-[1.65rem]">
                {name}
              </h1>
              <ProjectStageBadge stage={project.current_stage} compact />
              <ProjectHealthBadge health={project.health} />
            </div>
            {project.project_code ? (
              <p className="mt-px truncate font-mono text-[9px] font-semibold text-slate-500 dark:text-slate-400 sm:mt-0.5 sm:text-xs">
                {project.project_code}
              </p>
            ) : null}
            {nmLabel ? (
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300 sm:hidden">
                NM: {nmLabel}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canAdvance || statusBusy}
              className="h-7 min-w-[28px] gap-0.5 px-2 text-[10px] max-sm:px-1.5 sm:h-9 sm:gap-1 sm:px-3 sm:text-sm"
              onClick={onAdvanceClick}
            >
              <span className="sm:hidden">Adv</span>
              <span className="hidden sm:inline">Advance stage</span>
              <ChevronRight className="hidden h-3.5 w-3.5 sm:inline" aria-hidden />
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 min-w-[28px] sm:h-9 sm:w-9"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
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

        <p className="truncate text-[10px] font-medium text-slate-600 dark:text-slate-400 sm:hidden">
          {teamLine}
        </p>

        <div className="hidden flex-wrap items-center gap-2 sm:flex">
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

        <p className="hidden truncate text-xs font-medium text-slate-600 dark:text-slate-400 sm:block">
          {teamLine}
        </p>

        <div className="border-t border-white/50 pt-1 dark:border-white/10 max-sm:pt-1 sm:pt-4">
          <ProjectStageProgressBar currentStage={project.current_stage} />
        </div>
      </div>
    </header>
  );
}
