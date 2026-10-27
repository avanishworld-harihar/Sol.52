import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deletePipelineProject, patchPipelineProject } from "@/lib/supabase";
import { authorizeProjectRequest, isOrganizationMemberUser, mayChooseAssignee } from "@/lib/auth/data-access";
import { resolveOrgScope } from "@/lib/auth/org-scope";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    dashboard_visible: z.boolean().optional(),
    /** Pass `null` to un-archive, an ISO string to archive (or `true` to stamp now). */
    archived_at: z
      .union([z.string().datetime().nullable(), z.literal(true)])
      .optional(),
    status: z.enum(["pending", "active", "done"]).optional(),
    next_action: z.string().max(160).nullable().optional(),
    install_progress: z.number().min(0).max(100).optional(),
    capacity_kw: z.string().max(40).optional(),
    official_name: z.string().max(160).optional(),
    detail: z.string().max(240).optional(),
    assigned_to_user_id: z.string().uuid().optional().nullable()
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" });

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    }
    const denied = await authorizeProjectRequest(req, id); if (denied) return denied;
    const body = await req.json();
    const parsed = patchSchema.parse(body);
    if (parsed.assigned_to_user_id !== undefined) {
      const scope = await resolveOrgScope(req);
      if (!mayChooseAssignee(scope)) {
        return NextResponse.json({ ok: false, error: "Only company admin can reassign projects." }, { status: 403 });
      }
      if (parsed.assigned_to_user_id && scope.organizationId && !(await isOrganizationMemberUser(scope.organizationId, parsed.assigned_to_user_id))) {
        return NextResponse.json({ ok: false, error: "Assignee is not a member of this organization." }, { status: 400 });
      }
    }

    /**
     * Convenience: clients can pass `archived_at: true` to mean "archive now".
     * The DB stores the ISO timestamp so future tooling can sort by archive
     * recency.
     */
    const archivedAt =
      parsed.archived_at === true
        ? new Date().toISOString()
        : parsed.archived_at;

    const row = await patchPipelineProject(id, {
      dashboard_visible: parsed.dashboard_visible,
      archived_at: archivedAt,
      status: parsed.status,
      next_action: parsed.next_action,
      install_progress: parsed.install_progress,
      capacity_kw: parsed.capacity_kw,
      official_name: parsed.official_name,
      detail: parsed.detail,
      assigned_to_user_id: parsed.assigned_to_user_id
    });
    if (!row) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      { ok: true, data: row },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "Patch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    }
    const denied = await authorizeProjectRequest(req, id); if (denied) return denied;
    const scope = await resolveOrgScope(req);
    if (scope.mode === "session" && scope.session?.orgRole !== "company_admin") {
      return NextResponse.json({ ok: false, error: "Only company admin can permanently delete a project." }, { status: 403 });
    }
    const result = await deletePipelineProject(id);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
      }
      if (result.reason === "db_unavailable") {
        return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
      }
      return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
