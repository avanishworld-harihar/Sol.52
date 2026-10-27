import { NextRequest, NextResponse } from "next/server";
import {
  getProjectDashboardStats,
  listOutstandingCollections,
} from "@/lib/project-store";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { employeeAssignmentUserId } from "@/lib/auth/data-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;

    const orgId = scope.organizationId;
    const assignedToUserId = employeeAssignmentUserId(scope);
    const stats = await getProjectDashboardStats(orgId, assignedToUserId);
    if (!stats) {
      return NextResponse.json(
        { ok: false, error: "db_unavailable" },
        { status: 503 }
      );
    }

    const includeCollections = req.nextUrl.searchParams.get("collections") === "1";
    if (!includeCollections) {
      return NextResponse.json(
        { ok: true, data: stats },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const collections = await listOutstandingCollections(orgId, assignedToUserId);
    return NextResponse.json(
      { ok: true, data: { ...stats, collections } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "dashboard_stats_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
