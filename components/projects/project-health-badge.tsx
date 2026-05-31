"use client";

import { cn } from "@/lib/utils";
import {
  HEALTH_COLOR_CLASS,
  HEALTH_DOT_CLASS,
  HEALTH_LABELS,
  type ProjectHealth,
} from "@/lib/project-health";

export function ProjectHealthBadge({
  health,
  showLabel = true,
  className,
}: {
  health: ProjectHealth;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-bold sm:text-[11px]",
        HEALTH_COLOR_CLASS[health],
        className
      )}
    >
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", HEALTH_DOT_CLASS[health])}
        aria-hidden
      />
      {showLabel ? HEALTH_LABELS[health] : null}
    </span>
  );
}
