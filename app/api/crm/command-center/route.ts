import { NextResponse } from "next/server";
import { getCommandCenterPayload } from "@/lib/crm-command-center-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getCommandCenterPayload();
  return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}
