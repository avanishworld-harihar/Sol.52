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
  "h-8 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-800 max-sm:h-7 max-sm:px-2 max-sm:text-[10px] sm:h-9 sm:px-2.5 sm:text-xs",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100"
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
    <div className="flex flex-col gap-2 max-sm:gap-1.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-0.5 max-sm:gap-0 sm:min-w-[10rem] sm:gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 max-sm:text-[8px] sm:text-[10px]">
          Stage status
        </span>
        <span className="relative inline-flex items-center">
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
              className="pointer-events-none absolute right-2 h-3.5 w-3.5 animate-spin text-slate-400"
              aria-hidden
            />
          ) : null}
        </span>
      </label>

      {showNm ? (
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-purple-500 dark:text-purple-400">
            Net metering sub-status
          </span>
          <span className="relative inline-flex items-center">
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
                className="pointer-events-none absolute right-2 h-3.5 w-3.5 animate-spin text-purple-400"
                aria-hidden
              />
            ) : null}
          </span>
        </label>
      ) : null}
    </div>
  );
}
