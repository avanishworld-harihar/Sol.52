/**
 * Document upload router — v2 asset tables only (customer_assets, project_assets, asset_links).
 * Legacy tables customer_files / project_documents are not read or written at runtime.
 */

import { uploadCustomerFile, type CustomerFileType } from "@/lib/customer-file-upload";
import {
  buildProjectDocumentStoragePath,
  uploadProjectDocumentFile,
} from "@/lib/project-document-upload";
import {
  customerFileTypeToAssetCategory,
  customerAssetToLegacyFileRow,
  insertCustomerAsset,
} from "@/lib/customer-asset-store";
import {
  insertProjectAsset,
  projectAssetToLegacyDocumentRow,
} from "@/lib/project-asset-store";
import { upsertAssetLink, linkCustomerAssetToActiveProjects } from "@/lib/asset-link-store";
import {
  isCustomerOwnedProjectDocCategory,
  projectDocCategoryToCustomerAssetCategory,
  projectDocCategoryToProjectAssetCategory,
} from "@/lib/document-category-registry";
import type { ProjectDocumentCategory } from "@/lib/project-document-types";
import { formatHubCategoryNotes } from "@/lib/documents-hub-ui-categories";
import { resolveDefaultOrgId } from "@/lib/project-store";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type CustomerUploadResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

export async function writeCustomerFileUpload(input: {
  leadId: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileType: CustomerFileType;
  fileName: string;
}): Promise<CustomerUploadResult> {
  const orgId = await resolveDefaultOrgId();
  if (!orgId) return { ok: false, error: "organization_not_configured" };

  const uploaded = await uploadCustomerFile(
    input.leadId,
    input.fileBuffer,
    input.mimeType,
    input.fileType,
    input.fileName
  );
  if (!uploaded.ok || !uploaded.path) {
    return { ok: false, error: uploaded.error ?? "upload_failed" };
  }

  const category = customerFileTypeToAssetCategory(input.fileType);
  const asset = await insertCustomerAsset({
    organizationId: orgId,
    customerId: input.leadId,
    category,
    storagePath: uploaded.path,
    publicUrl: uploaded.url ?? null,
    filename: input.fileName.slice(0, 255) || "upload",
    mimeType: input.mimeType,
    sizeBytes: input.fileBuffer.length,
  });

  if (!asset) return { ok: false, error: "customer_asset_insert_failed" };

  await linkCustomerAssetToActiveProjects({
    organizationId: orgId,
    customerId: input.leadId,
    assetId: asset.id,
    category,
  });

  return {
    ok: true,
    data: customerAssetToLegacyFileRow(asset, input.fileType),
  };
}

async function findFirstActiveProjectForCustomer(
  customerId: string,
  organizationId: string
): Promise<{ id: string; current_stage: string } | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client
    .from("projects")
    .select("id, current_stage")
    .eq("lead_id", customerId)
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return null;
  return { id: String(data.id), current_stage: String(data.current_stage ?? "survey") };
}

/**
 * Customer Documents Hub — upload by project doc_category (same registry as Project Hub).
 */
export async function writeCustomerHubCategoryUpload(input: {
  leadId: string;
  docCategory: ProjectDocumentCategory;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<CustomerUploadResult | ProjectUploadResult> {
  const orgId = await resolveDefaultOrgId();
  if (!orgId) return { ok: false, error: "organization_not_configured" };

  const project = await findFirstActiveProjectForCustomer(input.leadId, orgId);

  if (project) {
    return writeProjectDocumentUpload({
      organizationId: orgId,
      projectId: project.id,
      customerId: input.leadId,
      docCategory: input.docCategory,
      stageAtUpload: project.current_stage,
      fileBuffer: input.fileBuffer,
      mimeType: input.mimeType,
      fileName: input.fileName,
    });
  }

  if (isCustomerOwnedProjectDocCategory(input.docCategory)) {
    return writeCustomerOwnedHubCategoryUpload(input);
  }

  const fallback = await writeCustomerFileUpload({
    leadId: input.leadId,
    fileBuffer: input.fileBuffer,
    mimeType: input.mimeType,
    fileType: "document",
    fileName: input.fileName,
  });
  if (!fallback.ok) return fallback;

  const assetId = String(fallback.data.id ?? "");
  const client = db();
  if (client && assetId) {
    await client
      .from("customer_assets")
      .update({ notes: formatHubCategoryNotes(input.docCategory) })
      .eq("id", assetId);
  }
  return fallback;
}

async function writeCustomerOwnedHubCategoryUpload(input: {
  leadId: string;
  docCategory: ProjectDocumentCategory;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<CustomerUploadResult> {
  const cat = projectDocCategoryToCustomerAssetCategory(input.docCategory);
  if (!cat) return { ok: false, error: "invalid_customer_doc_category" };

  const fileType: CustomerFileType =
    cat === "bill" ? "bill" : cat === "survey_media" ? "document" : "site_image";

  const orgId = await resolveDefaultOrgId();
  if (!orgId) return { ok: false, error: "organization_not_configured" };

  const uploaded = await uploadCustomerFile(
    input.leadId,
    input.fileBuffer,
    input.mimeType,
    fileType,
    input.fileName
  );
  if (!uploaded.ok || !uploaded.path) {
    return { ok: false, error: uploaded.error ?? "upload_failed" };
  }

  const asset = await insertCustomerAsset({
    organizationId: orgId,
    customerId: input.leadId,
    category: cat,
    storagePath: uploaded.path,
    publicUrl: uploaded.url ?? null,
    filename: input.fileName.slice(0, 255) || "upload",
    mimeType: input.mimeType,
    sizeBytes: input.fileBuffer.length,
  });
  if (!asset) return { ok: false, error: "customer_asset_insert_failed" };

  await linkCustomerAssetToActiveProjects({
    organizationId: orgId,
    customerId: input.leadId,
    assetId: asset.id,
    category: cat,
  });

  return {
    ok: true,
    data: customerAssetToLegacyFileRow(asset, fileType),
  };
}

export type ProjectUploadResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

export async function writeProjectDocumentUpload(input: {
  organizationId: string;
  projectId: string;
  customerId: string | null;
  docCategory: ProjectDocumentCategory;
  stageAtUpload: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  uploadedById?: string | null;
  notes?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}): Promise<ProjectUploadResult> {
  const customerId = input.customerId?.trim();
  if (!customerId) {
    return { ok: false, error: "project_missing_lead_id" };
  }

  if (isCustomerOwnedProjectDocCategory(input.docCategory)) {
    const cat = projectDocCategoryToCustomerAssetCategory(input.docCategory);
    if (!cat) return { ok: false, error: "invalid_customer_doc_category" };

    const uploaded = await uploadCustomerFile(
      customerId,
      input.fileBuffer,
      input.mimeType,
      cat === "bill" ? "bill" : "site_image",
      input.fileName
    );
    if (!uploaded.ok || !uploaded.path) {
      return { ok: false, error: uploaded.error ?? "upload_failed" };
    }

    const asset = await insertCustomerAsset({
      organizationId: input.organizationId,
      customerId,
      category: cat,
      storagePath: uploaded.path,
      publicUrl: uploaded.url ?? null,
      filename: input.fileName || "upload",
      mimeType: input.mimeType,
      sizeBytes: input.fileBuffer.length,
      uploadedById: input.uploadedById ?? null,
      notes: input.notes,
    });
    if (!asset) return { ok: false, error: "customer_asset_insert_failed" };

    await upsertAssetLink({
      organizationId: input.organizationId,
      assetId: asset.id,
      customerId,
      projectId: input.projectId,
      linkRole: cat,
    });

    return {
      ok: true,
      data: {
        id: asset.id,
        organization_id: input.organizationId,
        project_id: input.projectId,
        doc_category: input.docCategory,
        stage_at_upload: input.stageAtUpload,
        storage_path: asset.storage_path,
        filename: asset.filename,
        mime_type: asset.mime_type,
        size_bytes: asset.size_bytes,
        uploaded_by_id: asset.uploaded_by_id,
        notes: asset.notes,
        linked_entity_type: input.linkedEntityType,
        linked_entity_id: input.linkedEntityId,
        archived_at: null,
        created_at: asset.created_at,
        _source: "customer_assets",
      },
    };
  }

  const projCat = projectDocCategoryToProjectAssetCategory(input.docCategory);
  if (!projCat) return { ok: false, error: "invalid_project_doc_category" };

  const documentId = crypto.randomUUID();
  const storagePath = buildProjectDocumentStoragePath({
    organizationId: input.organizationId,
    projectId: input.projectId,
    documentId,
    mimeType: input.mimeType,
    fileName: input.fileName,
  });

  const uploaded = await uploadProjectDocumentFile({
    storagePath,
    fileBuffer: input.fileBuffer,
    mimeType: input.mimeType,
  });
  if (!uploaded.ok) return { ok: false, error: uploaded.error ?? "upload_failed" };

  const asset = await insertProjectAsset({
    organizationId: input.organizationId,
    customerId,
    projectId: input.projectId,
    category: projCat,
    storagePath,
    filename: input.fileName || "upload",
    mimeType: input.mimeType,
    sizeBytes: input.fileBuffer.length,
    uploadedById: input.uploadedById,
    notes: input.notes,
  });
  if (!asset) return { ok: false, error: "project_asset_insert_failed" };

  return {
    ok: true,
    data: projectAssetToLegacyDocumentRow(asset, input.stageAtUpload),
  };
}

/** GET /files — customer_assets shaped like legacy customer_files for CRM compat. */
export async function listCustomerFilesForApi(leadId: string): Promise<Record<string, unknown>[]> {
  const orgId = await resolveDefaultOrgId();
  const { listCustomerAssets } = await import("@/lib/customer-asset-store");
  const assets = await listCustomerAssets(leadId, orgId);
  const assetRows = assets.map((a) =>
    customerAssetToLegacyFileRow(
      a,
      a.category === "bill" ? "bill" : a.category === "survey_media" ? "document" : "site_image"
    )
  );

  return assetRows.sort(
    (a, b) =>
      new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime()
  );
}
