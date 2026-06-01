"use client";

import type { ProjectListItem } from "@/lib/project-api-client";
import {
  isNmSubstatus,
  isProjectStageStatus,
  NM_SUBSTATUS_LABELS,
  NM_SUBSTATUS_ORDER,
  STAGE_STATUS_LABELS,
  type NmSubstatus,
  type ProjectStageStatus,
} from "@/lib/project-stages";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const selectClass = cn(
  "h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-800",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100",
  "max-sm:h-7 max-sm:rounded-md max-sm:px-1.5 max-sm:text-[10px] sm:h-9 sm:rounded-lg sm:px-2.5 sm:text-xs"
);

export function ProjectHubStageActions({
  project,
  disabled,
  onStageStatusChange,
  onNmSubstatusChange,
}: {
  project: ProjectListItem;
  disabled?: boolean;
  onStageStatusChange: (status: ProjectStageStatus) => void | Promise<void>;
  onNmSubstatusChange: (substatus: NmSubstatus) => void | Promise<void>;
}) {
  const stageStatus: ProjectStageStatus = isProjectStageStatus(project.stage_status)
    ? project.stage_status
    : "in_progress";
  const nmSubstatus: NmSubstatus = isNmSubstatus(project.nm_substatus)
    ? project.nm_substatus
    : "not_started";
  const showNm = project.current_stage === "net_metering";

  return (
    <div
      className={cn(
        "grid gap-1 max-sm:grid-cols-2 sm:flex sm:flex-row sm:flex-wrap sm:items-end sm:gap-3"
      )}
    >
      <label className="flex min-w-0 items-center gap-1 max-sm:col-span-1 sm:min-w-[10rem] sm:flex-col sm:items-stretch sm:gap-1">
        <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:text-[10px]">
          Status
        </span>
        <span className="relative inline-flex min-w-0 flex-1 items-center">
          <select
            className={selectClass}
            value={stageStatus}
            disabled={disabled}
            onChange={(e) => {
              const value = e.target.value;
              if (isProjectStageStatus(value)) void onStageStatusChange(value);
            }}
            aria-label="Project stage status"
          >
            {(Object.keys(STAGE_STATUS_LABELS) as ProjectStageStatus[]).map((key) => (
              <option key={key} value={key}>
                {STAGE_STATUS_LABELS[key]}
              </option>
            ))}
          </select>
          {disabled ? (
            <Loader2
              className="pointer-events-none absolute right-1.5 h-3 w-3 animate-spin text-slate-400 sm:right-2 sm:h-3.5 sm:w-3.5"
              aria-hidden
            />
          ) : null}
        </span>
      </label>

      {showNm ? (
        <label className="flex min-w-0 items-center gap-1 max-sm:col-span-2 sm:min-w-[12rem] sm:flex-col sm:items-stretch sm:gap-1">
          <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-purple-500 dark:text-purple-400 sm:text-[10px]">
            NM status
          </span>
          <span className="relative inline-flex min-w-0 flex-1 items-center">
            <select
              className={cn(selectClass, "border-purple-200 dark:border-purple-500/30")}
              value={nmSubstatus}
              disabled={disabled}
              onChange={(e) => {
                const value = e.target.value;
                if (isNmSubstatus(value)) void onNmSubstatusChange(value);
              }}
              aria-label="Net metering sub-status"
            >
              {NM_SUBSTATUS_ORDER.map((key) => (
                <option key={key} value={key}>
                  {NM_SUBSTATUS_LABELS[key]}
                </option>
              ))}
            </select>
            {disabled ? (
              <Loader2
                className="pointer-events-none absolute right-1.5 h-3 w-3 animate-spin text-purple-400 sm:right-2 sm:h-3.5 sm:w-3.5"
                aria-hidden
              />
            ) : null}
          </span>
        </label>
      ) : null}
    </div>
  );
}
