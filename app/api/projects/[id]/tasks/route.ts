/**
 * GET  /api/projects/[id]/tasks        — List tasks (optionally filtered by stage)
 * POST /api/projects/[id]/tasks        — Create a custom task
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { listProjectTasks } from "@/lib/project-store";
import { isProjectStageId } from "@/lib/project-stages";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const VALID_STAGES = [
  "survey", "design", "approval", "installation",
  "net_metering", "completed", "general",
] as const;

const postSchema = z.object({
  stage: z.enum(VALID_STAGES),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional().nullable(),
  is_blocking: z.boolean().optional().default(false),
  assigned_to_id: z.string().uuid().optional().nullable(),
  due_date: z.string().date().optional().nullable(),
  sort_order: z.number().int().optional().default(0),
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const stageParam = req.nextUrl.searchParams.get("stage");
    const stage =
      stageParam && (isProjectStageId(stageParam) || stageParam === "general")
        ? stageParam
        : null;

    const data = await listProjectTasks(id, stage);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "get_tasks_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create custom task
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const body = await req.json();
    const parsed = postSchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    // Resolve org from project
    const { data: proj } = await client
      .from("projects")
      .select("organization_id")
      .eq("id", id)
      .maybeSingle();

    const orgId = (proj as { organization_id: string | null } | null)?.organization_id;
    if (!orgId) {
      return NextResponse.json({ ok: false, error: "project_not_found_or_no_org" }, { status: 404 });
    }

    const { data, error } = await client
      .from("project_tasks")
      .insert({
        organization_id: orgId,
        project_id: id,
        stage: parsed.stage,
        title: parsed.title.trim(),
        description: parsed.description ?? null,
        is_blocking: parsed.is_blocking,
        status: "pending",
        assigned_to_id: parsed.assigned_to_id ?? null,
        due_date: parsed.due_date ?? null,
        sort_order: parsed.sort_order,
        is_template: false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, data },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : e instanceof Error
          ? e.message
          : "create_task_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
