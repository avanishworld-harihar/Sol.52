/**
 * PATCH /api/projects/[id]/comments/[commentId] — Toggle is_pinned on a comment.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string; commentId: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const patchSchema = z.object({
  is_pinned: z.boolean(),
});

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id, commentId } = await ctx.params;
    if (!id || !commentId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = patchSchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const { data, error } = await client
      .from("project_comments")
      .update({
        is_pinned: parsed.is_pinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("project_id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "comment_not_found" }, { status: 404 });
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
          : "patch_comment_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
