import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  proposalDeckUpdateBodySchema,
  updateProposalDeckFromBody,
} from "@/lib/proposal-deck-update";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id || !UUID_RX.test(id.trim())) {
      return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
    }

    const payload = proposalDeckUpdateBodySchema.parse(await req.json());
    const result = await updateProposalDeckFromBody(id.trim(), payload);
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 503;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    const origin = req.headers.get("origin") || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const shareUrl = `${origin}/proposal/${id.trim()}`;

    return NextResponse.json(
      {
        ok: true,
        persisted: true,
        id: id.trim(),
        shareUrl,
        customerName: payload.customerName,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "deck_update_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
