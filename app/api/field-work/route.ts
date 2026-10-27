import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { getOrganizationMemberWorkRole } from "@/lib/auth/data-access";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { appendActivityEvent } from "@/lib/followup-store";
import { listOrgMembers } from "@/lib/team/invites";

export const dynamic = "force-dynamic";

const assignmentTypes = ["site_survey", "document_collection", "customer_concern", "follow_up_visit"] as const;
const assignmentStatuses = ["assigned", "accepted", "in_progress", "completed", "cancelled"] as const;

const createSchema = z.object({
  leadId: z.string().uuid(),
  assignedUserId: z.string().uuid(),
  assignmentType: z.enum(assignmentTypes).default("site_survey"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueAt: z.string().datetime().optional().nullable(),
  instructions: z.string().max(3000).optional().nullable(),
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("assignment"),
    assignmentId: z.string().uuid(),
    status: z.enum(assignmentStatuses).optional(),
    fieldNotes: z.string().max(5000).optional().nullable(),
    dueAt: z.string().datetime().optional().nullable(),
    assignedUserId: z.string().uuid().optional().nullable(),
  }),
  z.object({
    action: z.literal("survey"),
    leadId: z.string().uuid(),
    surveyStatus: z.enum(["not_started", "scheduled", "complete"]),
    assignmentId: z.string().uuid().optional(),
    fieldNotes: z.string().max(5000).optional().nullable(),
  }),
]);

function missingMigration(message: string) {
  return /lead_work_assignments|work_role|schema cache|does not exist|could not find/i.test(message);
}

async function context(req: NextRequest) {
  const scope = await resolveOrgScope(req);
  const denied = denyIfStrictUnauthenticated(scope);
  if (denied) return { denied } as const;
  if (!scope.organizationId) {
    return { denied: NextResponse.json({ ok: false, error: "Organization not configured." }, { status: 403 }) } as const;
  }
  const db = createSupabaseAdmin();
  if (!db) return { denied: NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 }) } as const;
  const workRole = scope.session
    ? await getOrganizationMemberWorkRole(scope.organizationId, scope.session.userId)
    : "hybrid";
  return { scope, db, workRole } as const;
}

async function readLead(db: NonNullable<ReturnType<typeof createSupabaseAdmin>>, organizationId: string, leadId: string) {
  const { data, error } = await db
    .from("leads")
    .select("id, organization_id, assigned_to_user_id, name, consumer_name, phone, city, state, location, discom, survey_status, status")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  return { data: data as Record<string, unknown> | null, error };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await context(req);
    if ("denied" in ctx) return ctx.denied;
    const { scope, db, workRole } = ctx;
    const organizationId = scope.organizationId!;
    const userId = scope.session?.userId ?? null;
    const isAdmin = scope.session?.orgRole === "company_admin" || scope.mode === "legacy";
    const canFieldOperate = isAdmin || workRole === "field_staff" || workRole === "hybrid";
    const leadId = req.nextUrl.searchParams.get("leadId")?.trim();

    if (leadId) {
      const leadResult = await readLead(db, organizationId, leadId);
      if (leadResult.error) return NextResponse.json({ ok: false, error: leadResult.error.message }, { status: 400 });
      if (!leadResult.data) return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
      const isOwner = Boolean(userId && String(leadResult.data.assigned_to_user_id ?? "") === userId);
      if (!isAdmin && !isOwner && !canFieldOperate) {
        return NextResponse.json({ ok: false, error: "Field work access denied." }, { status: 403 });
      }

      const [{ data: assignments, error: assignmentError }, members] = await Promise.all([
        db.from("lead_work_assignments").select("*").eq("organization_id", organizationId).eq("lead_id", leadId).order("created_at", { ascending: false }),
        listOrgMembers(organizationId),
      ]);
      if (assignmentError) {
        const error = missingMigration(assignmentError.message)
          ? "Field Work is not installed yet. Run migration 101_field_work_assignments.sql."
          : assignmentError.message;
        return NextResponse.json({ ok: false, error }, { status: 503 });
      }
      const fieldMembers = members.filter((member) => member.work_role === "field_staff" || member.work_role === "hybrid");
      return NextResponse.json({
        ok: true,
        data: {
          lead: leadResult.data,
          assignments: assignments ?? [],
          fieldMembers,
          permissions: { canManage: isAdmin || isOwner, canOperate: canFieldOperate, isOwner, isAdmin, workRole },
        },
      });
    }

    let leadQuery = db
      .from("leads")
      .select("id, assigned_to_user_id, name, consumer_name, phone, city, state, location, discom, survey_status, status, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (!isAdmin && !canFieldOperate && userId) leadQuery = leadQuery.eq("assigned_to_user_id", userId);

    const assignmentQuery = db
      .from("lead_work_assignments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(1000);
    const [{ data: leads, error: leadError }, { data: assignments, error: assignmentError }] = await Promise.all([
      leadQuery,
      assignmentQuery,
    ]);
    if (leadError) return NextResponse.json({ ok: false, error: leadError.message }, { status: 400 });
    if (assignmentError) {
      const error = missingMigration(assignmentError.message)
        ? "Field Work is not installed yet. Run migration 101_field_work_assignments.sql."
        : assignmentError.message;
      return NextResponse.json({ ok: false, error }, { status: 503 });
    }

    const visibleAssignments = isAdmin
      ? assignments ?? []
      : (assignments ?? []).filter((row) => row.assigned_user_id === userId || (leads ?? []).some((lead) => lead.id === row.lead_id && lead.assigned_to_user_id === userId));
    return NextResponse.json({
      ok: true,
      data: {
        leads: leads ?? [],
        assignments: visibleAssignments,
        currentUserId: userId,
        permissions: { canSeeDirectory: isAdmin || canFieldOperate, canOperate: canFieldOperate, isAdmin, workRole },
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Field work load failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await context(req);
    if ("denied" in ctx) return ctx.denied;
    const { scope, db } = ctx;
    const organizationId = scope.organizationId!;
    const userId = scope.session?.userId ?? null;
    const input = createSchema.parse(await req.json());
    const leadResult = await readLead(db, organizationId, input.leadId);
    if (leadResult.error || !leadResult.data) return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
    const isAdmin = scope.session?.orgRole === "company_admin" || scope.mode === "legacy";
    const isOwner = Boolean(userId && leadResult.data.assigned_to_user_id === userId);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ ok: false, error: "Only the lead owner or admin can assign field work." }, { status: 403 });
    }

    const { data: assignee, error: memberError } = await db
      .from("organization_members")
      .select("user_id, work_role")
      .eq("organization_id", organizationId)
      .eq("user_id", input.assignedUserId)
      .maybeSingle();
    if (memberError || !assignee || !["field_staff", "hybrid"].includes(String(assignee.work_role))) {
      return NextResponse.json({ ok: false, error: "Choose a Field or Hybrid team member." }, { status: 400 });
    }

    await db.from("lead_work_assignments").update({ status: "cancelled" })
      .eq("lead_id", input.leadId).eq("assignment_type", input.assignmentType)
      .in("status", ["assigned", "accepted", "in_progress"]);
    const { data, error } = await db.from("lead_work_assignments").insert({
      organization_id: organizationId,
      lead_id: input.leadId,
      assigned_user_id: input.assignedUserId,
      assignment_type: input.assignmentType,
      priority: input.priority,
      due_at: input.dueAt ?? null,
      instructions: input.instructions?.trim() || null,
      assigned_by_user_id: userId,
    }).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    void appendActivityEvent({
      leadId: input.leadId,
      eventType: "visit_scheduled",
      meta: { field_assignment_id: data.id, assignment_type: input.assignmentType, assigned_user_id: input.assignedUserId, due_at: input.dueAt ?? null },
    });
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map((issue) => issue.message).join(", ") : error instanceof Error ? error.message : "Assignment failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await context(req);
    if ("denied" in ctx) return ctx.denied;
    const { scope, db, workRole } = ctx;
    const organizationId = scope.organizationId!;
    const userId = scope.session?.userId ?? null;
    const isAdmin = scope.session?.orgRole === "company_admin" || scope.mode === "legacy";
    const input = patchSchema.parse(await req.json());

    if (input.action === "survey") {
      const leadResult = await readLead(db, organizationId, input.leadId);
      if (leadResult.error || !leadResult.data) return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
      const isOwner = Boolean(userId && leadResult.data.assigned_to_user_id === userId);
      const canOperate = isAdmin || isOwner || workRole === "field_staff" || workRole === "hybrid";
      if (!canOperate) return NextResponse.json({ ok: false, error: "Survey access denied." }, { status: 403 });
      const { error } = await db.from("leads").update({ survey_status: input.surveyStatus, last_touched_at: new Date().toISOString() })
        .eq("id", input.leadId).eq("organization_id", organizationId);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      if (input.assignmentId) {
        const assignmentPatch: Record<string, unknown> = { field_notes: input.fieldNotes?.trim() || null };
        if (input.surveyStatus === "complete") {
          assignmentPatch.status = "completed";
          assignmentPatch.completed_at = new Date().toISOString();
        }
        await db.from("lead_work_assignments").update(assignmentPatch).eq("id", input.assignmentId).eq("organization_id", organizationId);
      }
      void appendActivityEvent({ leadId: input.leadId, eventType: "lead_edited", meta: { fields: ["survey_status"], field_update: true } });
      return NextResponse.json({ ok: true });
    }

    const { data: assignment, error: lookupError } = await db.from("lead_work_assignments").select("*")
      .eq("id", input.assignmentId).eq("organization_id", organizationId).maybeSingle();
    if (lookupError || !assignment) return NextResponse.json({ ok: false, error: "Assignment not found." }, { status: 404 });
    const leadResult = await readLead(db, organizationId, String(assignment.lead_id));
    const isOwner = Boolean(userId && leadResult.data?.assigned_to_user_id === userId);
    const isAssignee = Boolean(userId && assignment.assigned_user_id === userId);
    if (!isAdmin && !isOwner && !isAssignee) return NextResponse.json({ ok: false, error: "Assignment access denied." }, { status: 403 });
    if (!isAdmin && !isOwner && input.assignedUserId !== undefined) {
      return NextResponse.json({ ok: false, error: "Only the lead owner or admin can reassign field work." }, { status: 403 });
    }
    const update: Record<string, unknown> = {};
    if (input.status !== undefined) update.status = input.status;
    if (input.fieldNotes !== undefined) update.field_notes = input.fieldNotes?.trim() || null;
    if (input.dueAt !== undefined) update.due_at = input.dueAt;
    if (input.assignedUserId !== undefined) update.assigned_user_id = input.assignedUserId;
    if (input.status === "completed") update.completed_at = new Date().toISOString();
    if (input.status && input.status !== "completed") update.completed_at = null;
    const { data, error } = await db.from("lead_work_assignments").update(update).eq("id", input.assignmentId).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    void appendActivityEvent({
      leadId: String(assignment.lead_id),
      eventType: input.status === "completed" ? "visit_completed" : "lead_edited",
      meta: { field_assignment_id: input.assignmentId, field_status: input.status ?? assignment.status },
    });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map((issue) => issue.message).join(", ") : error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
