import { NextRequest, NextResponse } from "next/server";
import { getDashboardStatsFast } from "@/lib/supabase-stats";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { employeeAssignmentUserId } from "@/lib/auth/data-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
/** Route handlers have no default timeout; slowness was from sequential Supabase probes + wide selects. */
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope); if (denied) return denied;
    const stats = await getDashboardStatsFast({
      organizationId: scope.organizationId,
      includeNullOrg: scope.includeUnscopedRows,
      assignedToUserId: employeeAssignmentUserId(scope),
    });
    return NextResponse.json({
      ok: true,
      data: stats,
      message: "Counts resolved from customers, proposals, projects with active recent projects."
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard stats";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
