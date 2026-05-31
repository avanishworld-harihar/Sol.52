"use client";

import { cn } from "@/lib/utils";
import {
  STAGE_COLOR_CLASS,
  STAGE_LABELS,
  STAGE_SHORT_LABELS,
  isProjectStageId,
  type ProjectStageId,
} from "@/lib/project-stages";

export function ProjectStageBadge({
  stage,
  compact = false,
  className,
}: {
  stage: string;
  compact?: boolean;
  className?: string;
}) {
  const id: ProjectStageId = isProjectStageId(stage) ? stage : "survey";
  const label = compact ? STAGE_SHORT_LABELS[id] : STAGE_LABELS[id];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]",
        STAGE_COLOR_CLASS[id],
        className
      )}
    >
      {label}
    </span>
  );
}
