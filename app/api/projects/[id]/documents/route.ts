/**
 * GET  /api/projects/[id]/documents — List project documents (optional filters)
 * POST /api/projects/[id]/documents — Upload file (multipart/form-data)
 */
import { NextRequest, NextResponse } from "next/server";
import { logDocumentUploaded } from "@/lib/project-activity-logger";
import { uploadProjectDocumentFile } from "@/lib/project-document-upload";
import {
  getProjectOrgContext,
  insertProjectDocument,
  listProjectDocuments,
  getProjectDocumentSummary,
} from "@/lib/project-document-store";
import { writeProjectDocumentUpload } from "@/lib/document-write-router";
import {
  isProjectDocumentCategory,
  PROJECT_DOCUMENT_CATEGORY_LABELS,
  type ProjectDocumentCategory,
} from "@/lib/project-document-types";
import {
  assertProjectDocumentPermission,
  parseInstallerPermissionRole,
} from "@/lib/project-permissions";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId } = await ctx.params;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const ctxProject = await getProjectOrgContext(projectId);
    if (!ctxProject.ok) {
      return NextResponse.json({ ok: false, error: ctxProject.error }, { status: 404 });
    }

    const actorRole = parseInstallerPermissionRole(
      req.nextUrl.searchParams.get("actor_role")
    );
    const perm = assertProjectDocumentPermission("list", {
      actorRole,
      actorProfileId: req.nextUrl.searchParams.get("actor_profile_id"),
      project: ctxProject.project,
    });
    if (!perm.ok) {
      return NextResponse.json({ ok: false, error: perm.error }, { status: 403 });
    }

    if (req.nextUrl.searchParams.get("summary") === "1") {
      const summary = await getProjectDocumentSummary(projectId);
      return NextResponse.json(
        { ok: true, data: summary },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const categoryParam = req.nextUrl.searchParams.get("category");
    const category =
      categoryParam && isProjectDocumentCategory(categoryParam)
        ? (categoryParam as ProjectDocumentCategory)
        : null;
    const stage = req.nextUrl.searchParams.get("stage");

    const data = await listProjectDocuments(projectId, {
      category,
      stage: stage?.trim() || null,
      withUrls: true,
    });

    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "list_documents_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId } = await ctx.params;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const ctxProject = await getProjectOrgContext(projectId);
    if (!ctxProject.ok) {
      return NextResponse.json({ ok: false, error: ctxProject.error }, { status: 404 });
    }

    const orgId = ctxProject.project.organization_id!;
    const contentType = req.headers.get("content-type") ?? "";

    let docCategory: string;
    let notes: string | null = null;
    let uploadedById: string | null = null;
    let actorRole = parseInstallerPermissionRole(null);
    let actorProfileId: string | null = null;
    let linkedEntityType: string | null = null;
    let linkedEntityId: string | null = null;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      docCategory = String(form.get("doc_category") ?? "");
      notes = form.get("notes") ? String(form.get("notes")) : null;
      uploadedById = form.get("uploaded_by_id")
        ? String(form.get("uploaded_by_id"))
        : null;
      actorRole = parseInstallerPermissionRole(
        form.get("actor_role") ? String(form.get("actor_role")) : null
      );
      actorProfileId = form.get("actor_profile_id")
        ? String(form.get("actor_profile_id"))
        : null;
      linkedEntityType = form.get("linked_entity_type")
        ? String(form.get("linked_entity_type"))
        : null;
      linkedEntityId = form.get("linked_entity_id")
        ? String(form.get("linked_entity_id"))
        : null;
      const f = form.get("file");
      file = f instanceof File ? f : null;
    } else {
      return NextResponse.json(
        { ok: false, error: "multipart_required_for_upload" },
        { status: 400 }
      );
    }

    const perm = assertProjectDocumentPermission("upload", {
      actorRole,
      actorProfileId,
      project: ctxProject.project,
    });
    if (!perm.ok) {
      return NextResponse.json({ ok: false, error: perm.error }, { status: 403 });
    }

    if (!isProjectDocumentCategory(docCategory)) {
      return NextResponse.json({ ok: false, error: "invalid_doc_category" }, { status: 400 });
    }
    if (!file || file.size === 0) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const leadId =
      ctxProject.project.lead_id != null ? String(ctxProject.project.lead_id) : null;

    const written = await writeProjectDocumentUpload({
      organizationId: orgId,
      projectId,
      customerId: leadId,
      docCategory,
      stageAtUpload: ctxProject.project.current_stage,
      fileBuffer: buffer,
      mimeType,
      fileName: file.name || "upload",
      uploadedById,
      notes,
      linkedEntityType,
      linkedEntityId,
      legacyInsert: async (storagePath, documentId) => {
        const uploaded = await uploadProjectDocumentFile({
          storagePath,
          fileBuffer: buffer,
          mimeType,
        });
        if (!uploaded.ok) return null;
        const row = await insertProjectDocument({
          organizationId: orgId,
          projectId,
          docCategory,
          stageAtUpload: ctxProject.project.current_stage,
          storagePath,
          filename: file.name || "upload",
          mimeType,
          sizeBytes: file.size,
          uploadedById,
          notes,
          linkedEntityType,
          linkedEntityId,
        });
        return row as unknown as Record<string, unknown> | null;
      },
    });

    if (!written.ok) {
      return NextResponse.json({ ok: false, error: written.error }, { status: 400 });
    }

    const row = written.data;

    const label =
      PROJECT_DOCUMENT_CATEGORY_LABELS[docCategory as ProjectDocumentCategory] ?? docCategory;

    await logDocumentUploaded({
      organizationId: orgId,
      projectId,
      docCategory,
      docName: file.name || label,
      stage: ctxProject.project.current_stage,
      documentId: String(row.id),
      createdById: uploadedById,
    });

    const { getProjectDocumentById } = await import("@/lib/project-document-store");
    const withUrl = await getProjectDocumentById(projectId, String(row.id), true);

    return NextResponse.json(
      { ok: true, data: withUrl ?? row },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload_document_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
