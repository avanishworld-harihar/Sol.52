"use client";

import { FloatingLabelInput, FloatingLabelSelect } from "@/components/ui/floating-label-input";
import { HEALTH_LABELS, type ProjectHealth } from "@/lib/project-health";
import { PROJECT_STAGE_ORDER, STAGE_LABELS } from "@/lib/project-stages";
import type { ProjectListFilters, ProjectSortKey } from "@/lib/project-list-utils";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";

const SORT_OPTIONS: { value: ProjectSortKey; label: string }[] = [
  { value: "updated_at", label: "Last updated" },
  { value: "name", label: "Name" },
  { value: "value", label: "Project value" },
  { value: "stage", label: "Stage" },
  { value: "health", label: "Health" },
  { value: "target_completion", label: "Target date" },
];

export function ProjectListFiltersBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
  className,
}: {
  filters: ProjectListFilters;
  onChange: (patch: Partial<ProjectListFilters>) => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
}) {
  const inputClass =
    "h-9 rounded-lg border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 focus:border-teal-500 focus:ring-teal-200/70 dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100 max-sm:h-8 max-sm:px-2.5 max-sm:text-xs sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm";

  return (
    <div className={cn("page-lite-item space-y-2 max-sm:space-y-1.5 sm:space-y-3", className)}>
      <div className="flex flex-col gap-2 max-sm:gap-1.5 lg:flex-row lg:items-end lg:gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:left-3 sm:h-4 sm:w-4" />
          <FloatingLabelInput
            label="Search projects"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className={cn(inputClass, "pl-8 sm:pl-9")}
            containerClassName="my-0"
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5 max-sm:gap-1 sm:grid-cols-4 sm:gap-2 lg:flex lg:flex-wrap lg:gap-2">
          <FloatingLabelSelect
            label="Stage"
            value={filters.stage}
            onChange={(e) =>
              onChange({ stage: e.target.value as ProjectListFilters["stage"], page: 1 })
            }
            className={inputClass}
            containerClassName="my-0 min-w-[8rem]"
          >
            <option value="all">All stages</option>
            {PROJECT_STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </FloatingLabelSelect>

          <FloatingLabelSelect
            label="Health"
            value={filters.health}
            onChange={(e) =>
              onChange({ health: e.target.value as ProjectListFilters["health"], page: 1 })
            }
            className={inputClass}
            containerClassName="my-0 min-w-[8rem]"
          >
            <option value="all">All health</option>
            {(Object.keys(HEALTH_LABELS) as ProjectHealth[]).map((h) => (
              <option key={h} value={h}>
                {HEALTH_LABELS[h]}
              </option>
            ))}
          </FloatingLabelSelect>

          <FloatingLabelSelect
            label="Sort by"
            value={filters.sort}
            onChange={(e) =>
              onChange({ sort: e.target.value as ProjectSortKey, page: 1 })
            }
            className={inputClass}
            containerClassName="my-0 min-w-[8rem]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FloatingLabelSelect>

          <FloatingLabelSelect
            label="Order"
            value={filters.sortDir}
            onChange={(e) =>
              onChange({ sortDir: e.target.value as ProjectListFilters["sortDir"], page: 1 })
            }
            className={inputClass}
            containerClassName="my-0 min-w-[7rem]"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </FloatingLabelSelect>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1.5 px-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 max-sm:py-0 sm:px-1 sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {filteredCount === totalCount
            ? `${totalCount} project${totalCount === 1 ? "" : "s"}`
            : `${filteredCount} of ${totalCount} projects`}
        </span>
      </div>
    </div>
  );
}
