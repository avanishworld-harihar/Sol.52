/**
 * GET    /api/projects/[id]/documents/[docId] — Metadata + signed download URL
 * PATCH  /api/projects/[id]/documents/[docId] — Update category / notes
 * DELETE /api/projects/[id]/documents/[docId] — Soft-archive + remove storage object
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { removeProjectDocumentFile } from "@/lib/project-document-upload";
import {
  archiveProjectDocument,
  getProjectDocumentById,
  getProjectOrgContext,
  updateProjectDocumentMeta,
} from "@/lib/project-document-store";
import { isProjectDocumentCategory, type ProjectDocumentCategory } from "@/lib/project-document-types";
import {
  assertProjectDocumentPermission,
  parseInstallerPermissionRole,
} from "@/lib/project-permissions";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string; docId: string }> };

function permissionQuery(req: NextRequest) {
  return {
    actorRole: parseInstallerPermissionRole(req.nextUrl.searchParams.get("actor_role")),
    actorProfileId: req.nextUrl.searchParams.get("actor_profile_id"),
  };
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId, docId } = await ctx.params;
    if (!projectId || !docId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const ctxProject = await getProjectOrgContext(projectId);
    if (!ctxProject.ok) {
      return NextResponse.json({ ok: false, error: ctxProject.error }, { status: 404 });
    }

    const { actorRole, actorProfileId } = permissionQuery(req);
    const perm = assertProjectDocumentPermission("download", {
      actorRole,
      actorProfileId,
      project: ctxProject.project,
    });
    if (!perm.ok) {
      return NextResponse.json({ ok: false, error: perm.error }, { status: 403 });
    }

    const data = await getProjectDocumentById(projectId, docId, true);
    if (!data) {
      return NextResponse.json({ ok: false, error: "document_not_found" }, { status: 404 });
    }

    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "get_document_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

const patchSchema = z.object({
  doc_category: z.string().optional(),
  notes: z.string().max(2000).optional().nullable(),
  actor_role: z.enum(["owner", "admin", "manager", "technician"]).optional().nullable(),
  actor_profile_id: z.string().uuid().optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId, docId } = await ctx.params;
    if (!projectId || !docId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const ctxProject = await getProjectOrgContext(projectId);
    if (!ctxProject.ok) {
      return NextResponse.json({ ok: false, error: ctxProject.error }, { status: 404 });
    }

    const body = await req.json();
    const parsed = patchSchema.parse(body);

    const perm = assertProjectDocumentPermission("update_meta", {
      actorRole: parseInstallerPermissionRole(parsed.actor_role),
      actorProfileId: parsed.actor_profile_id ?? null,
      project: ctxProject.project,
    });
    if (!perm.ok) {
      return NextResponse.json({ ok: false, error: perm.error }, { status: 403 });
    }

    let docCategory: ProjectDocumentCategory | undefined;
    if (parsed.doc_category) {
      if (!isProjectDocumentCategory(parsed.doc_category)) {
        return NextResponse.json({ ok: false, error: "invalid_doc_category" }, { status: 400 });
      }
      docCategory = parsed.doc_category;
    }

    const data = await updateProjectDocumentMeta(projectId, docId, {
      doc_category: docCategory,
      notes: parsed.notes,
    });
    if (!data) {
      return NextResponse.json({ ok: false, error: "document_not_found" }, { status: 404 });
    }

    const withUrl = await getProjectDocumentById(projectId, docId, true);
    return NextResponse.json(
      { ok: true, data: withUrl ?? data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : e instanceof Error
          ? e.message
          : "patch_document_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId, docId } = await ctx.params;
    if (!projectId || !docId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const ctxProject = await getProjectOrgContext(projectId);
    if (!ctxProject.ok) {
      return NextResponse.json({ ok: false, error: ctxProject.error }, { status: 404 });
    }

    const { actorRole, actorProfileId } = permissionQuery(req);
    const perm = assertProjectDocumentPermission("delete", {
      actorRole,
      actorProfileId,
      project: ctxProject.project,
    });
    if (!perm.ok) {
      return NextResponse.json({ ok: false, error: perm.error }, { status: 403 });
    }

    const existing = await getProjectDocumentById(projectId, docId, false);
    if (!existing || existing.archived_at) {
      return NextResponse.json({ ok: false, error: "document_not_found" }, { status: 404 });
    }

    const archived = await archiveProjectDocument(projectId, docId);
    if (!archived) {
      return NextResponse.json({ ok: false, error: "archive_failed" }, { status: 500 });
    }

    await removeProjectDocumentFile(existing.storage_path).catch(() => undefined);

    return NextResponse.json(
      { ok: true, data: archived },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "delete_document_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
