import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendActivityEvent } from "@/lib/followup-store";

type RouteCtx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  channel: z.enum(["call", "whatsapp", "sms", "email", "other"]).default("other"),
  note: z.string().max(200).optional(),
});

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    const body = bodySchema.parse(await req.json());
    const ev = await appendActivityEvent({
      leadId: id,
      eventType: "customer_contacted",
      meta: { channel: body.channel, note: body.note ?? null },
    });
    return NextResponse.json({ ok: true, data: ev });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
