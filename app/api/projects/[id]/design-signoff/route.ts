import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { logProjectActivity } from "@/lib/project-activity-logger";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

/**
 * POST /api/projects/[id]/design-signoff
 * Lightweight customer design sign-off: complete matching CRM task + stamp project.
 * Not a legal e-sign flow.
 */
export async function POST(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId } = await ctx.params;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }
    const client = db();
    if (!client) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }

    const signedAt = new Date().toISOString();

    const { data: tasks } = await client
      .from("project_tasks")
      .select("id, title, status, organization_id")
      .eq("project_id", projectId)
      .ilike("title", "%design sign-off%")
      .limit(5);

    let completedTaskId: string | null = null;
    for (const task of tasks ?? []) {
      const row = task as {
        id: string;
        status: string;
        organization_id?: string | null;
      };
      if (row.status === "done") {
        completedTaskId = row.id;
        continue;
      }
      const { error } = await client
        .from("project_tasks")
        .update({ status: "done", completed_at: signedAt })
        .eq("id", row.id);
      if (!error) {
        completedTaskId = row.id;
        if (row.organization_id) {
          try {
            await logProjectActivity({
              organizationId: row.organization_id,
              projectId,
              eventType: "task_completed",
              eventTitle: "Customer design sign-off",
              eventDescription: "Design signed off from Project Hub",
              createdById: null,
              metadata: { task_id: row.id, reason: "design_signoff" },
            });
          } catch {
            /* best-effort */
          }
        }
      }
    }

    /** Stamp on current project_designs row when present. */
    try {
      await client
        .from("project_designs")
        .update({
          revision_notes: `Customer design sign-off ${signedAt.slice(0, 10)}`,
        })
        .eq("project_id", projectId)
        .eq("is_current", true);
    } catch {
      /* column / table optional */
    }

    return NextResponse.json({
      ok: true,
      data: {
        signedAt,
        completedTaskId,
        message: completedTaskId
          ? "Design signed off — task marked done."
          : "Design signed off (no matching task found — stamp recorded).",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "signoff_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
