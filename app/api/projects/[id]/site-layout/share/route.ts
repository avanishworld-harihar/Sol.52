import { NextRequest, NextResponse } from "next/server";
import { ensureDesignPackShareToken } from "@/lib/design-studio-pack-share";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/site-layout/share
 * Mint (or return) Design pack share token — not a proposal link.
 */
export async function POST(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const result = await ensureDesignPackShareToken(id);
    if (!result.ok) {
      const status =
        result.error === "site_layout_missing"
          ? 404
          : result.error === "db_unavailable"
            ? 503
            : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      process.env.VERCEL_URL?.replace(/\/$/, "") ||
      "";
    const base =
      origin && !origin.startsWith("http")
        ? `https://${origin}`
        : origin;

    return NextResponse.json({
      ok: true,
      data: {
        token: result.token,
        layoutId: result.layoutId,
        path: `/design/${result.token}`,
        url: base ? `${base}/design/${result.token}` : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "share_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
