import { NextRequest, NextResponse } from "next/server";
import { listProjects, repairPreWonProjectVisibility } from "@/lib/project-store";
import { isProjectStageId } from "@/lib/project-stages";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";

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
      viewParam === "hidden" || viewParam === "archived"
        ? (viewParam as "hidden" | "archived")
        : "active";
    const limit = Math.min(200, Math.max(1, Number(limitParam ?? 100)));
    const offset = Math.max(0, Number(offsetParam ?? 0));

    const orgId = scope.organizationId;
    await repairPreWonProjectVisibility();
    const rows = await listProjects({
      organizationId: orgId,
      includeNullOrg: scope.includeUnscopedRows,
      stage,
      view,
      limit,
      offset,
    });

    return NextResponse.json(
      { ok: true, data: rows },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "list_failed";
    return NextResponse.json({ ok: false, error: message, data: [] }, { status: 500 });
  }
}
