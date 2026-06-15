import { NextResponse } from "next/server";
import { buildOrgUsageSummary } from "@/lib/billing/usage-summary";
import { resolveDefaultOrgId } from "@/lib/project-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orgId = await resolveDefaultOrgId();
    if (!orgId) {
      return NextResponse.json(
        { ok: true, data: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await buildOrgUsageSummary(orgId);
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "usage_fetch_failed";
    return NextResponse.json({ ok: false, error: message, data: null }, { status: 500 });
  }
}
