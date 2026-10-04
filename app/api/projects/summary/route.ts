import { NextRequest, NextResponse } from "next/server";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { getProjectViewCounts } from "@/lib/project-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;
    const data = await getProjectViewCounts(scope.organizationId);
    if (!data) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "summary_failed" },
      { status: 500 }
    );
  }
}
