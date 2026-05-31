"use client";

import {
  PROJECT_STAGE_ORDER,
  STAGE_SHORT_LABELS,
  getStageIndex,
  isProjectStageId,
  type ProjectStageId,
} from "@/lib/project-stages";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function ProjectStageProgressBar({
  currentStage,
  className,
}: {
  currentStage: string;
  className?: string;
}) {
  const stageId: ProjectStageId = isProjectStageId(currentStage) ? currentStage : "survey";
  const activeIndex = getStageIndex(stageId);

  return (
    <nav
      className={cn(
        "flex min-w-0 items-center gap-0 overflow-x-auto pb-0.5 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      aria-label="Project stage progress"
    >
      {PROJECT_STAGE_ORDER.map((stage, i) => (
        <div key={stage} className="flex min-w-0 shrink-0 items-center">
          {i > 0 ? (
            <ChevronRight
              className="mx-0.5 h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600"
              aria-hidden
            />
          ) : null}
          <span
            className={cn(
              "whitespace-nowrap rounded-md px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide sm:px-2 sm:text-[10px]",
              i < activeIndex && "text-slate-400 dark:text-slate-500",
              i === activeIndex &&
                "bg-teal-50 text-teal-900 ring-1 ring-teal-500/30 dark:bg-teal-950/55 dark:text-teal-100 dark:ring-teal-400/35",
              i > activeIndex && "text-slate-300 dark:text-slate-600"
            )}
            aria-current={i === activeIndex ? "step" : undefined}
          >
            {STAGE_SHORT_LABELS[stage]}
          </span>
        </div>
      ))}
    </nav>
  );
}
