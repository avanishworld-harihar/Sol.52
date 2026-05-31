/**
 * POST /api/projects/[id]/advance-stage
 *
 * Advances the project to the next stage in the 6-stage sequence.
 * On success:
 *   1. Updates projects.current_stage and resets stage_status = 'in_progress'
 *   2. Seeds advisory task checklist for the new stage
 *   3. Logs a stage_changed activity event
 *   4. Returns the updated project row
 *
 * Returns 400 if project is already at 'completed' (no further advance).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { getProjectDetail } from "@/lib/project-store";
import { logStageChanged } from "@/lib/project-activity-logger";
import { getNextStage, isProjectStageId } from "@/lib/project-stages";
import { getTaskTemplatesForStage } from "@/lib/project-task-templates";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const postSchema = z.object({
  created_by_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    // Fetch current project
    const current = await getProjectDetail(id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
    }

    const currentStage = current.current_stage;
    if (!isProjectStageId(currentStage)) {
      return NextResponse.json(
        { ok: false, error: `invalid_current_stage: ${currentStage}` },
        { status: 400 }
      );
    }

    const nextStage = getNextStage(currentStage);
    if (!nextStage) {
      return NextResponse.json(
        { ok: false, error: "project_already_completed" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      current_stage: nextStage,
      stage_status: "in_progress",
      updated_at: now,
    };

    // Auto-stamp actual_completion when completing
    if (nextStage === "completed" && !current.actual_completion) {
      updatePayload.actual_completion = now.split("T")[0];
    }

    const { data, error } = await client
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    }

    const orgId = current.organization_id;

    if (orgId) {
      // Seed tasks for the new stage
      const templates = getTaskTemplatesForStage(nextStage);
      if (templates.length > 0) {
        const taskRows = templates.map((t) => ({
          organization_id: orgId,
          project_id: id,
          stage: nextStage,
          title: t.title,
          description: t.description,
          is_blocking: t.is_blocking,
          sort_order: t.sort_order,
          status: "pending",
          is_template: true,
        }));
        // Non-fatal: ignore seed errors (may already exist from previous advance)
        await client.from("project_tasks").insert(taskRows).select("id");
      }

      // Log the stage change
      await logStageChanged({
        organizationId: orgId,
        projectId: id,
        fromStage: currentStage,
        toStage: nextStage,
        fromStatus: current.stage_status,
        createdById: parsed.created_by_id ?? null,
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
          : "advance_stage_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
