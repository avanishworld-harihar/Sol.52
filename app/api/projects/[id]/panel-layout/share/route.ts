import { NextRequest, NextResponse } from "next/server";
import { assertProjectSldAccess } from "@/lib/billing/design-studio-entitlements";
import { isBillingEntitlementError } from "@/lib/billing/errors";
import { ensureSldPackShareToken } from "@/lib/design-studio-sld-share";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/panel-layout/share
 * Mint (or return) SLD pack share token — not a proposal link.
 */
export async function POST(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    await assertProjectSldAccess(id);

    const result = await ensureSldPackShareToken(id);
    if (!result.ok) {
      const status =
        result.error === "panel_layout_missing"
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
        path: `/sld/${result.token}`,
        url: base ? `${base}/sld/${result.token}` : null,
      },
    });
  } catch (error) {
    if (isBillingEntitlementError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code, details: error.details },
        { status: 402 }
      );
    }
    const message = error instanceof Error ? error.message : "share_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
