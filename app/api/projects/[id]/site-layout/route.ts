import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertProjectDesignStudioAccess } from "@/lib/billing/design-studio-entitlements";
import { isBillingEntitlementError } from "@/lib/billing/errors";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { saveSiteLayoutSchema, type ProjectSiteLayout } from "@/lib/site-layout";
import { resolveDesignStudioSnapshotUrl } from "@/lib/design-studio-snapshot-upload";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function tableMissing(message: string): boolean {
  return /project_site_layouts|save_project_site_layout|schema cache|does not exist/i.test(message);
}

async function withSnapshotUrl(
  row: ProjectSiteLayout | null
): Promise<ProjectSiteLayout | null> {
  if (!row) return null;
  const url = await resolveDesignStudioSnapshotUrl(row.map_snapshot_path);
  return { ...row, map_snapshot_url: url };
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
      .eq("is_current", true)
      .maybeSingle();

    if (error) {
      const message = tableMissing(error.message)
        ? "Run migration 068_design_studio_phase1_site_layouts.sql in Supabase."
        : error.message;
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    const enriched = await withSnapshotUrl((data as ProjectSiteLayout | null) ?? null);

    return NextResponse.json(
      { ok: true, data: enriched },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "site_layout_get_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    await assertProjectDesignStudioAccess(id);
    const parsed = saveSiteLayoutSchema.parse(await req.json());
    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const { data, error } = await client.rpc("save_project_site_layout", {
      p_project_id: id,
      p_design_id: parsed.design_id ?? null,
      p_center_lat: parsed.center_lat ?? null,
      p_center_lng: parsed.center_lng ?? null,
      p_roof_geojson: parsed.roof_geojson,
      p_roof_azimuth_deg: parsed.roof_azimuth_deg ?? null,
      p_obstructions_geojson: parsed.obstructions_geojson,
      p_roof_area_sqft: parsed.roof_area_sqft,
      p_map_snapshot_path: parsed.map_snapshot_path ?? null,
      p_created_by_id: parsed.created_by_id ?? null,
    });

    if (error) {
      const message = tableMissing(error.message)
        ? "Run migration 068_design_studio_phase1_site_layouts.sql in Supabase."
        : error.message;
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, data: await withSnapshotUrl(data as ProjectSiteLayout) },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (isBillingEntitlementError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code, details: error.details },
        { status: 402 }
      );
    }
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "site_layout_save_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
