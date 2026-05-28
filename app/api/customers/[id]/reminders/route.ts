import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendActivityEvent, createLeadReminder, listLeadReminders } from "@/lib/followup-store";

type RouteCtx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  followup_type: z.enum(["call", "visit", "proposal", "payment", "general"]).default("general"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_at: z.string().min(1),
  status: z.enum(["pending", "completed", "snoozed"]).default("pending"),
  proposal_id: z.string().optional().nullable(),
  project_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  snoozed_until: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const url = req.nextUrl;
  const limit = Number(url.searchParams.get("limit") ?? 30);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  const data = await listLeadReminders(id, { limit, offset });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    const parsed = reminderSchema.parse(await req.json());
    const created = await createLeadReminder({ lead_id: id, ...parsed });
    if (!created) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 400 });
    await appendActivityEvent({
      leadId: id,
      eventType: "followup_created",
      meta: { reminderId: created.id, dueAt: created.due_at, followupType: created.followup_type },
    });
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
