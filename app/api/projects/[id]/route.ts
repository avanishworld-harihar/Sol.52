/**
 * GET  /api/projects/[id]  — Full project detail with joins + computed health
 * PATCH /api/projects/[id] — Update project fields (Phase 3 + legacy)
 *
 * Backward compat: existing /api/pipeline/[id] PATCH continues to work unchanged.
 * This route is the Phase 3 primary project API.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { getProjectDetail } from "@/lib/project-store";
import { logProjectActivity } from "@/lib/project-activity-logger";
import { isProjectStageId, isProjectStageStatus, isNmSubstatus } from "@/lib/project-stages";
import { denyIfCrossOrg, denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { fetchProjectOrgId } from "@/lib/auth/resource-org";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const scope = await resolveOrgScope(req);
    const deniedAuth = denyIfStrictUnauthenticated(scope);
    if (deniedAuth) return deniedAuth;

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const projectOrg = await fetchProjectOrgId(id);
    const deniedOrg = denyIfCrossOrg(projectOrg, scope);
    if (deniedOrg) return deniedOrg;

    const data = await getProjectDetail(id);
    if (!data) {
      return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
    }
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "get_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH
// ---------------------------------------------------------------------------

const patchSchema = z
  .object({
    // Phase 3 stage fields
    stage_status: z.enum(["not_started", "in_progress", "blocked", "done"]).optional(),
    nm_substatus: z
      .enum([
        "not_started",
        "application_filed",
        "documents_submitted",
        "inspection_pending",
        "meter_installed",
        "export_enabled",
      ])
      .optional(),
    project_code: z.string().max(40).optional().nullable(),
    start_date: z.string().date().optional().nullable(),
    target_completion: z.string().date().optional().nullable(),
    actual_completion: z.string().date().optional().nullable(),
    assigned_manager_id: z.string().uuid().optional().nullable(),
    assigned_tech_id: z.string().uuid().optional().nullable(),
    site_address: z.string().max(500).optional().nullable(),
    site_lat: z.number().min(-90).max(90).optional().nullable(),
    site_lng: z.number().min(-180).max(180).optional().nullable(),
    roof_type: z
      .enum(["rcc", "tin", "metal", "asbestos", "terrace", "ground", "other"])
      .optional()
      .nullable(),
    system_type: z.enum(["on_grid", "off_grid", "hybrid"]).optional().nullable(),
    panel_brand: z.string().max(100).optional().nullable(),
    inverter_brand: z.string().max(100).optional().nullable(),
    panel_count: z.number().int().positive().optional().nullable(),
    structure_type: z
      .enum(["elevated", "flush", "ground_mount", "other"])
      .optional()
      .nullable(),
    contract_amount_inr: z.number().nonnegative().optional().nullable(),
    amount_received_inr: z.number().nonnegative().optional(),
    discom_application_no: z.string().max(100).optional().nullable(),
    nm_application_date: z.string().date().optional().nullable(),
    meter_serial_no: z.string().max(100).optional().nullable(),
    nm_activation_date: z.string().date().optional().nullable(),
    has_subsidy: z.boolean().optional(),
    // Legacy fields (backward compat with pipeline)
    official_name: z.string().max(300).optional().nullable(),
    capacity_kw: z.string().max(80).optional().nullable(),
    detail: z.string().max(500).optional().nullable(),
    next_action: z.string().max(200).optional().nullable(),
    install_progress: z.number().int().min(0).max(100).optional(),
    dashboard_visible: z.boolean().optional(),
    archived_at: z
      .union([z.string().datetime().nullable(), z.literal(true)])
      .optional(),
    // Activity logging context
    created_by_id: z.string().uuid().optional().nullable(),
  })
  .refine((v) => {
    const skipKeys = new Set(["created_by_id"]);
    return Object.entries(v).some(([k, val]) => !skipKeys.has(k) && val !== undefined);
  }, { message: "No fields to update" });

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const scope = await resolveOrgScope(req);
    const deniedAuth = denyIfStrictUnauthenticated(scope);
    if (deniedAuth) return deniedAuth;

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

    const projectOrg = await fetchProjectOrgId(id);
    const deniedOrg = denyIfCrossOrg(projectOrg, scope);
    if (deniedOrg) return deniedOrg;

    const body = await req.json();
    const parsed = patchSchema.parse(body);

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    // Fetch current project for logging context
    const current = await getProjectDetail(id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // Build update object — only include defined fields
    const fieldMap: Record<string, unknown> = { ...parsed };
    delete fieldMap.created_by_id;

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        if (key === "archived_at" && value === true) {
          update.archived_at = new Date().toISOString();
        } else {
          update[key] = value;
        }
      }
    }

    const { data, error } = await client
      .from("projects")
      .update(update)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
    }

    const orgId = current.organization_id;

    // Log nm_substatus change
    if (
      parsed.nm_substatus &&
      orgId &&
      parsed.nm_substatus !== current.nm_substatus &&
      isNmSubstatus(parsed.nm_substatus)
    ) {
      await logProjectActivity({
        organizationId: orgId,
        projectId: id,
        eventType: "nm_substatus_changed",
        eventTitle: `Net metering: ${parsed.nm_substatus.replace(/_/g, " ")}`,
        metadata: {
          from_substatus: current.nm_substatus,
          to_substatus: parsed.nm_substatus,
        },
        createdById: parsed.created_by_id ?? null,
      });
    }

    // Log archive event
    if (update.archived_at && orgId) {
      await logProjectActivity({
        organizationId: orgId,
        projectId: id,
        eventType: "project_archived",
        eventTitle: "Project archived",
        createdById: parsed.created_by_id ?? null,
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
          : "patch_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

// Suppress unused import warning — kept for isProjectStageId / isProjectStageStatus usage
void isProjectStageId;
void isProjectStageStatus;
