import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendActivityEvent, createLeadVisit, listLeadVisits } from "@/lib/followup-store";

type RouteCtx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

const visitSchema = z.object({
  scheduled_at: z.string().min(1),
  visit_status: z.enum(["scheduled", "completed", "cancelled", "rescheduled"]).default("scheduled"),
  summary: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  proposal_id: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const url = req.nextUrl;
  const limit = Number(url.searchParams.get("limit") ?? 30);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  const data = await listLeadVisits(id, { limit, offset });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    const parsed = visitSchema.parse(await req.json());
    const created = await createLeadVisit({ lead_id: id, ...parsed });
    if (!created) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 400 });
    await appendActivityEvent({
      leadId: id,
      eventType: created.visit_status === "completed" ? "visit_completed" : "visit_scheduled",
      meta: { visitId: created.id, scheduledAt: created.scheduled_at },
    });
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
