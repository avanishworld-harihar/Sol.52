import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type { ProjectSiteLayout } from "@/lib/site-layout";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const { data, error } = await client
      .from("project_site_layouts")
      .select("*")
      .eq("project_id", id)
      .order("version_number", { ascending: false });

    if (error) {
      const message = /project_site_layouts|schema cache|does not exist/i.test(error.message)
        ? "Run migration 068_design_studio_phase1_site_layouts.sql in Supabase."
        : error.message;
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, data: (data ?? []) as ProjectSiteLayout[] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "site_layout_versions_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
