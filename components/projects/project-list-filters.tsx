"use client";

import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { HEALTH_LABELS, type ProjectHealth } from "@/lib/project-health";
import { PROJECT_STAGE_ORDER, STAGE_LABELS } from "@/lib/project-stages";
import type { ProjectListFilters, ProjectSortKey } from "@/lib/project-list-utils";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

const SORT_OPTIONS: { value: ProjectSortKey; label: string }[] = [
  { value: "updated_at", label: "Last updated" },
  { value: "name", label: "Name" },
  { value: "value", label: "Project value" },
  { value: "stage", label: "Stage" },
  { value: "health", label: "Health" },
  { value: "target_completion", label: "Target date" },
];

function FilterSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
      <select value={value} onChange={onChange} className={cn("ss-select w-full min-w-0", className)}>
        {children}
      </select>
    </div>
  );
}

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const inputClass =
    "h-9 rounded-lg border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 focus:border-teal-500 focus:ring-teal-200/70 dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100 sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm";

  const searchClass =
    "h-8 rounded-lg border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-teal-500 focus:ring-teal-200/70 dark:border-white/10 dark:bg-[#0c1017] dark:text-slate-100 sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm";

  const advancedActive = useMemo(
    () =>
      filters.stage !== "all" ||
      filters.health !== "all" ||
      filters.sort !== "updated_at" ||
      filters.sortDir !== "desc",
    [filters.health, filters.sort, filters.sortDir, filters.stage]
  );

  const countLabel =
    filteredCount === totalCount
      ? `${totalCount} project${totalCount === 1 ? "" : "s"}`
      : `${filteredCount} of ${totalCount} projects`;

  const advancedFilters = (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <FilterSelect
        label="Stage"
        value={filters.stage}
        onChange={(e) =>
          onChange({ stage: e.target.value as ProjectListFilters["stage"], page: 1 })
        }
        className={inputClass}
      >
        <option value="all">All stages</option>
        {PROJECT_STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Health"
        value={filters.health}
        onChange={(e) =>
          onChange({ health: e.target.value as ProjectListFilters["health"], page: 1 })
        }
        className={inputClass}
      >
        <option value="all">All health</option>
        {(Object.keys(HEALTH_LABELS) as ProjectHealth[]).map((h) => (
          <option key={h} value={h}>
            {HEALTH_LABELS[h]}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Sort by"
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value as ProjectSortKey, page: 1 })}
        className={inputClass}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Order"
        value={filters.sortDir}
        onChange={(e) =>
          onChange({ sortDir: e.target.value as ProjectListFilters["sortDir"], page: 1 })
        }
        className={inputClass}
      >
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </FilterSelect>
    </div>
  );

  return (
    <div
      className={cn(
        "page-lite-item rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-[#0c1017] sm:p-5",
        className
      )}
    >
      {/* Mobile: search + collapsible filters */}
      <div className="space-y-1 sm:hidden">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <FloatingLabelInput
            label="Search projects"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className={cn(searchClass, "pl-7")}
            containerClassName="my-0"
          />
        </div>

        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="project-list-advanced-filters"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex min-h-[28px] w-full items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-slate-50/80 px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
        >
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Filters & sort
            {advancedActive ? (
              <span className="rounded-full bg-teal-600 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-white">
                On
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
              advancedOpen && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {advancedOpen ? (
          <div id="project-list-advanced-filters" className="pt-0.5">
            {advancedFilters}
          </div>
        ) : null}

        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{countLabel}</p>
      </div>

      {/* Desktop / tablet: search on top, filters in one row below */}
      <div className="hidden space-y-3 sm:block">
        <div className="relative min-w-0 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <FloatingLabelInput
            label="Search projects"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className={cn(inputClass, "pl-9")}
            containerClassName="my-0"
          />
        </div>
        {advancedFilters}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {countLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
