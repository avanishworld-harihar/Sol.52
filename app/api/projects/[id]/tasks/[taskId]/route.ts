/**
 * PATCH /api/projects/[id]/tasks/[taskId] — Update task status, assignee, or due date.
 *
 * When status → 'done': stamps completed_at and logs a task_completed activity event.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { logTaskCompleted } from "@/lib/project-activity-logger";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string; taskId: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const patchSchema = z
  .object({
    status: z.enum(["pending", "in_progress", "done", "skipped", "na"]).optional(),
    assigned_to_id: z.string().uuid().optional().nullable(),
    due_date: z.string().date().optional().nullable(),
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(1000).optional().nullable(),
    is_blocking: z.boolean().optional(),
    sort_order: z.number().int().optional(),
    // Logging context
    completed_by_id: z.string().uuid().optional().nullable(),
  })
  .refine((v) => {
    const skipKeys = new Set(["completed_by_id"]);
    return Object.entries(v).some(([k, val]) => !skipKeys.has(k) && val !== undefined);
  }, { message: "No fields to update" });

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id, taskId } = await ctx.params;
    if (!id || !taskId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = patchSchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.status !== undefined) update.status = parsed.status;
    if (parsed.assigned_to_id !== undefined) update.assigned_to_id = parsed.assigned_to_id;
    if (parsed.due_date !== undefined) update.due_date = parsed.due_date;
    if (parsed.title !== undefined) update.title = parsed.title.trim();
    if (parsed.description !== undefined) update.description = parsed.description;
    if (parsed.is_blocking !== undefined) update.is_blocking = parsed.is_blocking;
    if (parsed.sort_order !== undefined) update.sort_order = parsed.sort_order;

    // Stamp completed_at when marking done; clear when reverting
    const newStatus = parsed.status;
    if (newStatus === "done") {
      update.completed_at = new Date().toISOString();
      if (parsed.completed_by_id) update.completed_by_id = parsed.completed_by_id;
    } else if (newStatus != null) {
      update.completed_at = null;
      update.completed_by_id = null;
    }

    const { data, error } = await client
      .from("project_tasks")
      .update(update)
      .eq("id", taskId)
      .eq("project_id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "task_not_found" }, { status: 404 });
    }

    const task = data as {
      id: string;
      title: string;
      stage: string;
      organization_id: string;
      project_id: string;
      status: string;
    };

    // Log task completion
    if (parsed.status === "done" && task.organization_id) {
      await logTaskCompleted({
        organizationId: task.organization_id,
        projectId: task.project_id,
        taskTitle: task.title,
        taskStage: task.stage,
        createdById: parsed.completed_by_id ?? null,
      });
    }

    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : e instanceof Error
          ? e.message
          : "patch_task_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
