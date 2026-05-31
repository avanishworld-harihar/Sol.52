/**
 * GET  /api/projects/[id]/comments — List comments (pinned first, then newest)
 * POST /api/projects/[id]/comments — Add a comment
 *
 * On POST: logs a comment_added activity event.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { listProjectComments } from "@/lib/project-store";
import { logCommentAdded } from "@/lib/project-activity-logger";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const postSchema = z.object({
  comment: z.string().min(1).max(5000),
  parent_comment_id: z.string().uuid().optional().nullable(),
  created_by_id: z.string().uuid().optional().nullable(),
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const data = await listProjectComments(id);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "get_comments_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST
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
      .from("project_comments")
      .insert({
        organization_id: orgId,
        project_id: id,
        comment: parsed.comment.trim(),
        parent_comment_id: parsed.parent_comment_id ?? null,
        is_pinned: false,
        created_by_id: parsed.created_by_id ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    await logCommentAdded({
      organizationId: orgId,
      projectId: id,
      createdById: parsed.created_by_id ?? null,
    });

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
          : "create_comment_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
