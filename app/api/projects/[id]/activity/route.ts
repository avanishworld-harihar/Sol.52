/**
 * GET /api/projects/[id]/activity — Project activity log (chronological timeline)
 *
 * Supports cursor-based pagination via ?before=<ISO timestamp>
 * Returns newest events first (ORDER BY created_at DESC).
 */
import { NextRequest, NextResponse } from "next/server";
import { listProjectActivity } from "@/lib/project-store";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const url = req.nextUrl;
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
    const before = url.searchParams.get("before") ?? null;

    const data = await listProjectActivity(id, { limit, before });
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "get_activity_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
