/**
 * GET  /api/projects/[id]/designs — All design versions, newest first
 * POST /api/projects/[id]/designs — Create new version
 *
 * Versioning rules:
 *   - Each new version is a new row (previous rows never modified/deleted)
 *   - On insert: UPDATE previous is_current = false, then INSERT new with is_current = true
 *   - The partial unique index `project_designs_one_current_per_project_idx` enforces
 *     at-most-one current version at DB level — guards against race conditions
 *   - version_number is auto-incremented (max existing + 1)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { listProjectDesigns, getNextDesignVersion } from "@/lib/project-store";
import { logDesignCreated } from "@/lib/project-activity-logger";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const designBodySchema = z.object({
  version_label: z.string().max(120).optional().nullable(),
  revision_notes: z.string().max(1000).optional().nullable(),
  system_kw: z.number().nonnegative().optional().nullable(),
  panel_count: z.number().int().positive().optional().nullable(),
  panel_watt: z.number().int().positive().optional().nullable(),
  panel_model: z.string().max(200).optional().nullable(),
  inverter_kw: z.number().nonnegative().optional().nullable(),
  inverter_model: z.string().max(200).optional().nullable(),
  structure_type: z
    .enum(["elevated", "flush", "ground_mount", "other"])
    .optional()
    .nullable(),
  string_count: z.number().int().positive().optional().nullable(),
  modules_per_string: z.number().int().positive().optional().nullable(),
  annual_yield_kwh: z.number().nonnegative().optional().nullable(),
  performance_ratio: z.number().min(0).max(1).optional().nullable(),
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

    const data = await listProjectDesigns(id);
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "get_designs_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create new version
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const body = await req.json();
    const parsed = designBodySchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    // Resolve org from project
    const { data: proj, error: projErr } = await client
      .from("projects")
      .select("organization_id")
      .eq("id", id)
      .maybeSingle();

    if (projErr || !proj) {
      return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
    }

    const orgId = (proj as { organization_id: string | null }).organization_id;
    if (!orgId) {
      return NextResponse.json({ ok: false, error: "project_has_no_organization" }, { status: 400 });
    }

    const nextVersion = await getNextDesignVersion(id);
    const isRevision = nextVersion > 1;

    // Step 1: Mark all previous versions as not current
    const { error: updateErr } = await client
      .from("project_designs")
      .update({ is_current: false })
      .eq("project_id", id)
      .eq("is_current", true);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 400 });
    }

    // Step 2: Insert new version as current
    const { created_by_id, ...designFields } = parsed;

    const insertPayload: Record<string, unknown> = {
      ...designFields,
      organization_id: orgId,
      project_id: id,
      version_number: nextVersion,
      version_label:
        designFields.version_label?.trim() ||
        `V${nextVersion}${isRevision ? " – Revision" : " – Initial"}`,
      is_current: true,
      created_by_id: created_by_id ?? null,
    };

    // Remove undefined keys
    for (const key of Object.keys(insertPayload)) {
      if (insertPayload[key] === undefined) delete insertPayload[key];
    }

    const { data, error } = await client
      .from("project_designs")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const newDesign = data as { id: string; version_number: number; version_label: string | null };

    await logDesignCreated({
      organizationId: orgId,
      projectId: id,
      designId: newDesign.id,
      versionNumber: newDesign.version_number,
      versionLabel: newDesign.version_label,
      isRevision,
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
          : "create_design_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
