import { NextResponse } from "next/server";
import { getProjectDashboardStats, resolveDefaultOrgId } from "@/lib/project-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orgId = await resolveDefaultOrgId();
    const stats = await getProjectDashboardStats(orgId);
    if (!stats) {
      return NextResponse.json(
        { ok: false, error: "db_unavailable" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { ok: true, data: stats },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "dashboard_stats_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
