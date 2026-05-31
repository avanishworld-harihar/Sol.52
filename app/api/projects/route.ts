/**
 * POST /api/projects — Create a new Phase 3 project.
 *
 * Backward compat: existing projects are created via /api/pipeline (POST with lead_id).
 * This route handles direct project creation with Phase 3 fields, and auto-logs
 * a project_created activity event.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { resolveDefaultOrgId } from "@/lib/project-store";
import { logProjectCreated } from "@/lib/project-activity-logger";
import { getTaskTemplatesForStage } from "@/lib/project-task-templates";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  official_name: z.string().max(300).optional().nullable(),
  capacity_kw: z.string().max(80).optional().nullable(),
  detail: z.string().max(500).optional().nullable(),
  project_code: z.string().max(40).optional().nullable(),
  start_date: z.string().date().optional().nullable(),
  target_completion: z.string().date().optional().nullable(),
  assigned_manager_id: z.string().uuid().optional().nullable(),
  assigned_tech_id: z.string().uuid().optional().nullable(),
  contract_amount_inr: z.number().nonnegative().optional().nullable(),
  site_address: z.string().max(500).optional().nullable(),
});

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = postSchema.parse(body);

    const client = db();
    if (!client) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }

    const orgId = await resolveDefaultOrgId();

    const now = new Date().toISOString();
    const insertPayload: Record<string, unknown> = {
      lead_id: parsed.lead_id ?? null,
      official_name: parsed.official_name?.trim() ?? null,
      capacity_kw: parsed.capacity_kw?.trim() ?? null,
      detail: parsed.detail?.trim() ?? null,
      // Phase 3 defaults
      current_stage: "survey",
      stage_status: "in_progress",
      nm_substatus: "not_started",
      has_subsidy: false,
      amount_received_inr: 0,
      dashboard_visible: true,
      status: "pending",
      install_progress: 0,
      updated_at: now,
    };

    if (orgId) insertPayload.organization_id = orgId;
    if (parsed.project_code) insertPayload.project_code = parsed.project_code.trim();
    if (parsed.start_date) insertPayload.start_date = parsed.start_date;
    if (parsed.target_completion) insertPayload.target_completion = parsed.target_completion;
    if (parsed.assigned_manager_id) insertPayload.assigned_manager_id = parsed.assigned_manager_id;
    if (parsed.assigned_tech_id) insertPayload.assigned_tech_id = parsed.assigned_tech_id;
    if (parsed.contract_amount_inr != null) insertPayload.contract_amount_inr = parsed.contract_amount_inr;
    if (parsed.site_address) insertPayload.site_address = parsed.site_address.trim();

    const { data, error } = await client
      .from("projects")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const project = data as { id: string };

    // Seed survey stage tasks
    if (orgId) {
      const templates = getTaskTemplatesForStage("survey");
      if (templates.length > 0) {
        const taskRows = templates.map((t) => ({
          organization_id: orgId,
          project_id: project.id,
          stage: "survey",
          title: t.title,
          description: t.description,
          is_blocking: t.is_blocking,
          sort_order: t.sort_order,
          status: "pending",
          is_template: true,
        }));
        await client.from("project_tasks").insert(taskRows);
      }

      // Log project created event
      await logProjectCreated({
        organizationId: orgId,
        projectId: project.id,
        customerName: parsed.official_name ?? null,
      });
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
          : "create_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
