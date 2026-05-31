/**
 * GET   /api/projects/[id]/survey — Fetch survey or null if not yet filled
 * POST  /api/projects/[id]/survey — Create survey (one per project)
 * PATCH /api/projects/[id]/survey — Update survey in-place
 *
 * One-to-one: UNIQUE constraint on project_id prevents duplicates.
 * On create/update: logs a survey_submitted activity event.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { getProjectSurvey, resolveDefaultOrgId } from "@/lib/project-store";
import { logSurveySubmitted } from "@/lib/project-activity-logger";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

// ---------------------------------------------------------------------------
// Shared Zod schema for survey fields
// ---------------------------------------------------------------------------

const surveyBodySchema = z.object({
  surveyed_by_id: z.string().uuid().optional().nullable(),
  survey_date: z.string().date().optional().nullable(),
  // Site
  site_address: z.string().max(500).optional().nullable(),
  gps_lat: z.number().min(-90).max(90).optional().nullable(),
  gps_lng: z.number().min(-180).max(180).optional().nullable(),
  roof_type: z
    .enum(["rcc", "tin", "metal", "asbestos", "terrace", "ground", "other"])
    .optional()
    .nullable(),
  roof_area_sqft: z.number().nonnegative().optional().nullable(),
  shadow_free_sqft: z.number().nonnegative().optional().nullable(),
  roof_height_ft: z.number().nonnegative().optional().nullable(),
  roof_condition: z
    .enum(["good", "minor_repair", "major_repair", "not_suitable"])
    .optional()
    .nullable(),
  roof_orientation: z
    .enum(["south", "east_west", "flat", "north", "other"])
    .optional()
    .nullable(),
  // Electrical
  consumer_number: z.string().max(100).optional().nullable(),
  sanction_load_kw: z.number().nonnegative().optional().nullable(),
  connected_load_kw: z.number().nonnegative().optional().nullable(),
  meter_type: z
    .enum(["single_phase", "three_phase", "ltct", "htct", "other"])
    .optional()
    .nullable(),
  transformer_distance_m: z.number().nonnegative().optional().nullable(),
  meter_location: z.string().max(200).optional().nullable(),
  db_location: z.string().max(200).optional().nullable(),
  existing_earthing: z.boolean().optional(),
  // Solar
  available_area_sqft: z.number().nonnegative().optional().nullable(),
  proposed_capacity_kw: z.number().nonnegative().optional().nullable(),
  shadow_analysis_note: z.string().max(1000).optional().nullable(),
  annual_irradiation: z.number().nonnegative().optional().nullable(),
  // Special
  has_dg: z.boolean().optional(),
  dg_kva: z.number().nonnegative().optional().nullable(),
  battery_required: z.boolean().optional(),
  battery_capacity_kwh: z.number().nonnegative().optional().nullable(),
  existing_inverter: z.boolean().optional(),
  existing_inverter_kw: z.number().nonnegative().optional().nullable(),
  project_category: z
    .enum(["residential", "commercial", "industrial", "agricultural", "institutional", "other"])
    .optional(),
  structure_floor: z.number().int().optional().nullable(),
  special_notes: z.string().max(2000).optional().nullable(),
  // Logging context
  created_by_id: z.string().uuid().optional().nullable(),
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const data = await getProjectSurvey(id);
    return NextResponse.json(
      { ok: true, data: data ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "get_survey_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const body = await req.json();
    const parsed = surveyBodySchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const orgId = parsed.surveyed_by_id ? null : await resolveDefaultOrgId();

    // Resolve org from project if needed
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const { data: proj } = await client
        .from("projects")
        .select("organization_id")
        .eq("id", id)
        .maybeSingle();
      resolvedOrgId = (proj as { organization_id: string | null } | null)?.organization_id ?? null;
    }

    if (!resolvedOrgId) {
      resolvedOrgId = await resolveDefaultOrgId();
    }

    if (!resolvedOrgId) {
      return NextResponse.json({ ok: false, error: "org_required" }, { status: 400 });
    }

    const { created_by_id, ...surveyFields } = parsed;

    const insertPayload = {
      ...surveyFields,
      organization_id: resolvedOrgId,
      project_id: id,
    };

    const { data, error } = await client
      .from("project_site_surveys")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "survey_already_exists_use_patch" },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    await logSurveySubmitted({
      organizationId: resolvedOrgId,
      projectId: id,
      surveyDate: parsed.survey_date ?? null,
      createdById: created_by_id ?? null,
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
          : "create_survey_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update in-place
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const body = await req.json();
    const parsed = surveyBodySchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const { created_by_id, ...surveyFields } = parsed;

    const updatePayload: Record<string, unknown> = {
      ...surveyFields,
      updated_at: new Date().toISOString(),
    };
    // Remove undefined keys
    for (const key of Object.keys(updatePayload)) {
      if (updatePayload[key] === undefined) delete updatePayload[key];
    }

    const { data, error } = await client
      .from("project_site_surveys")
      .update(updatePayload)
      .eq("project_id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "survey_not_found_use_post" },
        { status: 404 }
      );
    }

    const orgId = (data as { organization_id: string }).organization_id;
    if (orgId) {
      await logSurveySubmitted({
        organizationId: orgId,
        projectId: id,
        surveyDate: parsed.survey_date ?? null,
        createdById: created_by_id ?? null,
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
          : "update_survey_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
