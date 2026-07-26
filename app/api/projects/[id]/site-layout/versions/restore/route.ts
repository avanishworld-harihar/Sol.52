import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type { ProjectSiteLayout } from "@/lib/site-layout";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const restoreSchema = z.object({
  layoutId: z.string().uuid(),
});

/**
 * POST /api/projects/[id]/site-layout/versions/restore
 * Make an older roof layout version current (no new row).
 */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId } = await ctx.params;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }
    const body = restoreSchema.parse(await req.json());
    const client = db();
    if (!client) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }

    const { data: target, error: findErr } = await client
      .from("project_site_layouts")
      .select("*")
      .eq("id", body.layoutId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ ok: false, error: findErr.message }, { status: 400 });
    }
    if (!target) {
      return NextResponse.json({ ok: false, error: "layout_not_found" }, { status: 404 });
    }

    await client
      .from("project_site_layouts")
      .update({ is_current: false })
      .eq("project_id", projectId)
      .eq("is_current", true);

    const { data: updated, error: updErr } = await client
      .from("project_site_layouts")
      .update({ is_current: true })
      .eq("id", body.layoutId)
      .select("*")
      .single();

    if (updErr || !updated) {
      return NextResponse.json(
        { ok: false, error: updErr?.message || "restore_failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: updated as ProjectSiteLayout,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "restore_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
