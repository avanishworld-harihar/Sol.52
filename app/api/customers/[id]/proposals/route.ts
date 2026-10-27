import { NextRequest, NextResponse } from "next/server";
import { authorizeLeadRequest } from "@/lib/auth/data-access";
import { listLeadProposalHistory } from "@/lib/followup-store";

type RouteCtx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const denied = await authorizeLeadRequest(req, id); if (denied) return denied;
  const url = req.nextUrl;
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  const data = await listLeadProposalHistory(id, { limit, offset });
  return NextResponse.json({ ok: true, data });
}
