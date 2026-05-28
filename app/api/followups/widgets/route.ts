import { NextResponse } from "next/server";
import { getFollowupDashboardWidgets } from "@/lib/followup-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getFollowupDashboardWidgets();
  return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}
