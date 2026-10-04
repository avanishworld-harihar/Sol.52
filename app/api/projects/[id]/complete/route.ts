import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { getProjectDetail } from "@/lib/project-store";
import { logProjectActivity } from "@/lib/project-activity-logger";
import { denyIfCrossOrg, denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { fetchProjectOrgId } from "@/lib/auth/resource-org";

export const dynamic = "force-dynamic";
type RouteCtx = { params: Promise<{ id: string }> };

const schema = z.object({
  completion_date: z.string().date(),
  note: z.string().max(500).optional().nullable(),
  created_by_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const scope = await resolveOrgScope(req);
    const denied = denyIfStrictUnauthenticated(scope);
    if (denied) return denied;
    const { id } = await ctx.params;
    const deniedOrg = denyIfCrossOrg(await fetchProjectOrgId(id), scope);
    if (deniedOrg) return deniedOrg;

    const parsed = schema.parse(await req.json());
    const client = createSupabaseAdmin() ?? supabase;
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    const current = await getProjectDetail(id);
    if (!current) return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });

    const [{ count: pendingTasks }, { data: taskRows }] = await Promise.all([
      client.from("project_tasks").select("id", { count: "exact", head: true }).eq("project_id", id).neq("status", "done"),
      client.from("project_tasks").select("id, title, is_blocking, status").eq("project_id", id).eq("is_blocking", true).neq("status", "done").limit(20),
    ]);

    const pendingAmount = current.pending_inr ?? 0;
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
        current_stage: "completed",
        stage_status: "done",
        status: "done",
        install_progress: 100,
        actual_completion: parsed.completion_date,
        dashboard_visible: true,
        record_type: "operational",
        next_action: pendingAmount > 0 ? "Collect outstanding payment" : "Project completed",
        updated_at: now,
      };
    let data: Record<string, unknown> | null = null;
    let error: { message: string } | null = null;
    for (let guard = 0; guard < 3; guard++) {
      const result = await client.from("projects").update(update).eq("id", id).select("*").single();
      data = result.data as Record<string, unknown> | null;
      error = result.error;
      if (!error) break;
      const missing = /Could not find the '([^']+)' column/i.exec(error.message)?.[1];
      if (!missing || !(missing in update)) break;
      delete update[missing];
    }
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    if (current.lead_id) {
      await client.from("leads").update({ status: "won" }).eq("id", current.lead_id);
    }
    if (current.organization_id) {
      await logProjectActivity({
        organizationId: current.organization_id,
        projectId: id,
        eventType: "project_completed",
        eventTitle: "Project marked complete",
        eventDescription: parsed.note?.trim() || null,
        metadata: {
          completion_date: parsed.completion_date,
          pending_tasks: pendingTasks ?? 0,
          blocking_tasks: taskRows?.map((task) => task.title) ?? [],
          pending_amount_inr: pendingAmount,
        },
        createdById: parsed.created_by_id ?? null,
      });
    }

    return NextResponse.json({
      ok: true,
      data,
      warnings: {
        pending_tasks: pendingTasks ?? 0,
        blocking_tasks: taskRows?.length ?? 0,
        pending_amount_inr: pendingAmount,
      },
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")
      : error instanceof Error ? error.message : "complete_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
