import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertProjectDesignStudioAccess } from "@/lib/billing/design-studio-entitlements";
import { isBillingEntitlementError } from "@/lib/billing/errors";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import {
  savePanelLayoutSchema,
  type ProjectPanelLayout,
} from "@/lib/panel-layout";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function migrationMissing(message: string): boolean {
  return /project_panel_layouts|save_project_panel_layout|schema cache|does not exist/i.test(
    message
  );
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const client = db();
    if (!client) {
      return NextResponse.json(
        { ok: false, error: "db_unavailable" },
        { status: 503 }
      );
    }

    const { data, error } = await client
      .from("project_panel_layouts")
      .select("*")
      .eq("project_id", id)
      .eq("is_current", true)
      .maybeSingle();

    if (error) {
      const message = migrationMissing(error.message)
        ? "Run migration 070_design_studio_panel_layouts.sql in Supabase."
        : error.message;
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, data: (data as ProjectPanelLayout | null) ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "panel_layout_get_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    await assertProjectDesignStudioAccess(id);
    const parsed = savePanelLayoutSchema.parse(await req.json());
    const client = db();
    if (!client) {
      return NextResponse.json(
        { ok: false, error: "db_unavailable" },
        { status: 503 }
      );
    }

    const { data, error } = await client.rpc("save_project_panel_layout", {
      p_project_id: id,
      p_site_layout_id: parsed.site_layout_id,
      p_design_id: parsed.design_id ?? null,
      p_panel_spec: parsed.panel_spec,
      p_orientation: parsed.orientation,
      p_tilt_deg: parsed.tilt_deg,
      p_mounting_type: parsed.mounting_type,
      p_setback_ft: parsed.setback_ft,
      p_walkway_ft: parsed.walkway_ft,
      p_panel_gap_mm: parsed.panel_gap_mm,
      p_panels_geojson: parsed.panels_geojson,
      p_panel_count: parsed.panel_count,
      p_dc_capacity_kw: parsed.dc_capacity_kw,
      p_remaining_area_sqft: parsed.remaining_area_sqft,
      p_coverage_pct: parsed.coverage_pct,
      p_created_by_id: parsed.created_by_id ?? null,
    });

    if (error) {
      const message = migrationMissing(error.message)
        ? "Run migration 070_design_studio_panel_layouts.sql in Supabase."
        : error.message;
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, data: data as ProjectPanelLayout },
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
        ? error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", ")
        : error instanceof Error
          ? error.message
          : "panel_layout_save_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
