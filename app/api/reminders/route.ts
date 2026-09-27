import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { createLeadReminder } from "@/lib/followup-store";

export const dynamic = "force-dynamic";

const generalReminderSchema = z.object({
  title: z.string().min(1).max(200),
  due_at: z.string().datetime(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  followup_type: z.enum(["call", "visit", "proposal", "payment", "general"]).default("general"),
  notes: z.string().max(1000).optional().nullable(),
  subject_label: z.string().max(120).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;
    const payload = generalReminderSchema.parse(await req.json());
    const created = await createLeadReminder({
      lead_id: null,
      organization_id: scope.organizationId,
      subject_type: "general",
      subject_label: payload.subject_label?.trim() || null,
      title: payload.title.trim(),
      due_at: payload.due_at,
      priority: payload.priority,
      followup_type: payload.followup_type,
      status: "pending",
      proposal_id: null,
      project_id: null,
      notes: payload.notes?.trim() || null,
      snoozed_until: null,
    });
    if (!created) {
      return NextResponse.json(
        { ok: false, error: "Could not create reminder. Apply migration 094 first." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 }
    );
  }
}
