/**
 * Sol.52 — Phase 3A client-side list helpers.
 * Search, filter, sort, and paginate project list rows after API fetch.
 */

import type { ProjectHealth } from "@/lib/project-health";
import type { ProjectListItem } from "@/lib/project-api-client";
import { formatPipelineDisplayName } from "@/lib/supabase";
import type { ProjectStageId } from "@/lib/project-stages";
import { STAGE_LABELS } from "@/lib/project-stages";

export type ProjectSortKey =
  | "updated_at"
  | "name"
  | "value"
  | "stage"
  | "health"
  | "target_completion";

export type ProjectSortDir = "asc" | "desc";

export interface ProjectListFilters {
  search: string;
  stage: ProjectStageId | "all";
  health: ProjectHealth | "all";
  sort: ProjectSortKey;
  sortDir: ProjectSortDir;
  page: number;
  pageSize: number;
}

export const DEFAULT_LIST_FILTERS: ProjectListFilters = {
  search: "",
  stage: "all",
  health: "all",
  sort: "updated_at",
  sortDir: "desc",
  page: 1,
  pageSize: 20,
};

const HEALTH_ORDER: Record<ProjectHealth, number> = {
  blocked: 0,
  delayed: 1,
  attention_needed: 2,
  on_track: 3,
};

export function projectDisplayName(p: ProjectListItem): string {
  return formatPipelineDisplayName(p.official_name, p.lead_name);
}

export function projectSearchHaystack(p: ProjectListItem): string {
  return [
    projectDisplayName(p),
    p.project_code,
    p.lead_name,
    p.lead_phone,
    p.lead_city,
    p.manager_name,
    p.tech_name,
    p.official_name,
    STAGE_LABELS[p.current_stage as ProjectStageId],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterProjects(
  rows: ProjectListItem[],
  filters: Pick<ProjectListFilters, "search" | "stage" | "health">
): ProjectListItem[] {
  const q = filters.search.trim().toLowerCase();

  return rows.filter((p) => {
    if (filters.stage !== "all" && p.current_stage !== filters.stage) return false;
    if (filters.health !== "all" && p.health !== filters.health) return false;
    if (q && !projectSearchHaystack(p).includes(q)) return false;
    return true;
  });
}

export function sortProjects(
  rows: ProjectListItem[],
  sort: ProjectSortKey,
  sortDir: ProjectSortDir
): ProjectListItem[] {
  const dir = sortDir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    switch (sort) {
      case "name":
        return dir * projectDisplayName(a).localeCompare(projectDisplayName(b));
      case "value":
        return dir * ((a.contract_amount_inr ?? 0) - (b.contract_amount_inr ?? 0));
      case "stage":
        return dir * a.current_stage.localeCompare(b.current_stage);
      case "health":
        return dir * (HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]);
      case "target_completion": {
        const ta = a.target_completion ? Date.parse(a.target_completion) : 0;
        const tb = b.target_completion ? Date.parse(b.target_completion) : 0;
        return dir * (ta - tb);
      }
      case "updated_at":
      default: {
        const ta = Date.parse(a.updated_at) || 0;
        const tb = Date.parse(b.updated_at) || 0;
        return dir * (ta - tb);
      }
    }
  });
}

export function paginateProjects<T>(
  rows: T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; totalPages: number; page: number } {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
  };
}

export function applyProjectListPipeline(
  rows: ProjectListItem[],
  filters: ProjectListFilters
) {
  const filtered = filterProjects(rows, filters);
  const sorted = sortProjects(filtered, filters.sort, filters.sortDir);
  const paged = paginateProjects(sorted, filters.page, filters.pageSize);
  return { filtered, sorted, ...paged };
}

export function buildProjectListUrl(opts: {
  view?: "active" | "hidden" | "archived";
  stage?: string | null;
  limit?: number;
}): string {
  const params = new URLSearchParams();
  if (opts.view && opts.view !== "active") params.set("view", opts.view);
  if (opts.stage) params.set("stage", opts.stage);
  params.set("limit", String(opts.limit ?? 200));
  const qs = params.toString();
  return qs ? `/api/projects/list?${qs}` : "/api/projects/list";
}
