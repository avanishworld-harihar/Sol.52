import { NextRequest, NextResponse } from "next/server";
import { listProjects } from "@/lib/project-store";
import { isProjectStageId } from "@/lib/project-stages";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { applyProjectListPipeline, DEFAULT_LIST_FILTERS, type ProjectListFilters } from "@/lib/project-list-utils";
import type { ProjectHealth } from "@/lib/project-health";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;

    const url = req.nextUrl;
    const stageParam = url.searchParams.get("stage");
    const viewParam = url.searchParams.get("view");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const stage = stageParam && isProjectStageId(stageParam) ? stageParam : null;
    const view =
      viewParam === "completed" || viewParam === "drafts" || viewParam === "archived"
        ? (viewParam as "completed" | "drafts" | "archived")
        : "active";
    const limit = Math.min(200, Math.max(1, Number(limitParam ?? 100)));
    const offset = Math.max(0, Number(offsetParam ?? 0));

    const orgId = scope.organizationId;
    const paged = url.searchParams.get("paged") === "1";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get("pageSize") ?? 20)));
    const healthParam = url.searchParams.get("health");
    const health = (["on_track", "attention_needed", "delayed", "blocked"] as const).includes(healthParam as ProjectHealth)
      ? (healthParam as ProjectHealth)
      : "all";
    const sortParam = url.searchParams.get("sort");
    const sort = (["updated_at", "name", "value", "stage", "health", "target_completion"] as const).includes(sortParam as ProjectListFilters["sort"])
      ? (sortParam as ProjectListFilters["sort"])
      : "updated_at";
    const sortDir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";
    const rows = await listProjects({
      organizationId: orgId,
      includeNullOrg: scope.includeUnscopedRows,
      stage,
      view,
      limit: paged ? 5000 : limit,
      offset,
    });

    if (paged) {
      const result = applyProjectListPipeline(rows, {
        ...DEFAULT_LIST_FILTERS,
        search: url.searchParams.get("q") ?? "",
        stage: stage ?? "all",
        health,
        sort,
        sortDir,
        page,
        pageSize,
      });
      return NextResponse.json(
        { ok: true, data: { items: result.items, total: result.total, totalPages: result.totalPages, page: result.page } },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true, data: rows },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "list_failed";
    return NextResponse.json({ ok: false, error: message, data: [] }, { status: 500 });
  }
}
