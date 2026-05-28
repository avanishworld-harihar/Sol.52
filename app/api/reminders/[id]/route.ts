import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendActivityEvent, updateLeadReminder } from "@/lib/followup-store";

type RouteCtx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

const reminderPatchSchema = z.object({
  status: z.enum(["pending", "completed", "snoozed"]).optional(),
  due_at: z.string().optional(),
  snoozed_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  title: z.string().min(1).max(200).optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    const patch = reminderPatchSchema.parse(await req.json());
    const updated = await updateLeadReminder(id, patch);
    if (!updated) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    if (patch.status === "completed") {
      await appendActivityEvent({
        leadId: updated.lead_id,
        eventType: "reminder_completed",
        meta: { reminderId: updated.id, title: updated.title },
      });
    } else if (patch.status === "snoozed") {
      await appendActivityEvent({
        leadId: updated.lead_id,
        eventType: "followup_snoozed",
        meta: { reminderId: updated.id, snoozedUntil: updated.snoozed_until },
      });
    }
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
