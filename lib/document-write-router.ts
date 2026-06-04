/**
 * Phase 2 — upload write router (legacy vs v2 asset tables).
 */

import { uploadCustomerFile, type CustomerFileType } from "@/lib/customer-file-upload";
import {
  buildProjectDocumentStoragePath,
  uploadProjectDocumentFile,
} from "@/lib/project-document-upload";
import { isDocumentsHubLegacyReadEnabled } from "@/lib/documents-hub-read-config";
import { isDocumentsHubV2WriteEnabled } from "@/lib/documents-hub-write-config";
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
import { resolveDefaultOrgId } from "@/lib/project-store";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type { CustomerHubUploadCategory } from "@/lib/documents-hub-ui-categories";
import {
  customerHubCategoryToProjectDocCategory,
  formatHubCategoryNotes,
} from "@/lib/documents-hub-ui-categories";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type CustomerUploadResult =
  | { ok: true; v2: false; data: Record<string, unknown> }
  | { ok: true; v2: true; data: Record<string, unknown> }
  | { ok: false; error: string };

export async function writeCustomerFileUpload(input: {
  leadId: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileType: CustomerFileType;
  fileName: string;
  legacyInsert: () => Promise<Record<string, unknown> | null>;
}): Promise<CustomerUploadResult> {
  if (!isDocumentsHubV2WriteEnabled()) {
    const row = await input.legacyInsert();
    if (!row) return { ok: false, error: "insert_failed" };
    return { ok: true, v2: false, data: row };
  }

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
    v2: true,
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
 * Customer Documents Hub — category-tab upload (no popup).
 * Customer-owned categories → customer_assets; KYC → project_assets when a project exists.
 */
export async function writeCustomerHubCategoryUpload(input: {
  leadId: string;
  hubCategory: CustomerHubUploadCategory;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  legacyInsert: (fileType: CustomerFileType) => Promise<Record<string, unknown> | null>;
}): Promise<CustomerUploadResult | ProjectUploadResult> {
  const orgId = await resolveDefaultOrgId();
  if (!orgId) return { ok: false, error: "organization_not_configured" };

  if (input.hubCategory === "electricity_bill") {
    return writeCustomerFileUpload({
      leadId: input.leadId,
      fileBuffer: input.fileBuffer,
      mimeType: input.mimeType,
      fileType: "bill",
      fileName: input.fileName,
      legacyInsert: () => input.legacyInsert("bill"),
    });
  }

  if (input.hubCategory === "site_photo") {
    return writeCustomerFileUpload({
      leadId: input.leadId,
      fileBuffer: input.fileBuffer,
      mimeType: input.mimeType,
      fileType: "site_image",
      fileName: input.fileName,
      legacyInsert: () => input.legacyInsert("site_image"),
    });
  }

  if (input.hubCategory === "other") {
    return writeCustomerFileUpload({
      leadId: input.leadId,
      fileBuffer: input.fileBuffer,
      mimeType: input.mimeType,
      fileType: "document",
      fileName: input.fileName,
      legacyInsert: () => input.legacyInsert("document"),
    });
  }

  const docCategory = customerHubCategoryToProjectDocCategory(input.hubCategory);
  if (!docCategory) return { ok: false, error: "invalid_hub_category" };

  const project = await findFirstActiveProjectForCustomer(input.leadId, orgId);
  if (!project) {
    if (
      input.hubCategory === "aadhaar" ||
      input.hubCategory === "pan" ||
      input.hubCategory === "agreement" ||
      input.hubCategory === "advance_receipt"
    ) {
      const uploaded = await writeCustomerFileUpload({
        leadId: input.leadId,
        fileBuffer: input.fileBuffer,
        mimeType: input.mimeType,
        fileType: "document",
        fileName: input.fileName,
        legacyInsert: () => input.legacyInsert("document"),
      });
      if (!uploaded.ok) return uploaded;
      if (uploaded.v2 && isDocumentsHubV2WriteEnabled()) {
        const assetId = String(uploaded.data.id ?? "");
        const client = db();
        if (client && assetId) {
          await client
            .from("customer_assets")
            .update({ notes: formatHubCategoryNotes(input.hubCategory) })
            .eq("id", assetId);
        }
      }
      return uploaded;
    }
    return { ok: false, error: "no_active_project_for_kyc_upload" };
  }

  return writeProjectDocumentUpload({
    organizationId: orgId,
    projectId: project.id,
    customerId: input.leadId,
    docCategory,
    stageAtUpload: project.current_stage,
    fileBuffer: input.fileBuffer,
    mimeType: input.mimeType,
    fileName: input.fileName,
    legacyInsert: async (storagePath, documentId) => {
      const uploaded = await uploadProjectDocumentFile({
        storagePath,
        fileBuffer: input.fileBuffer,
        mimeType: input.mimeType,
      });
      if (!uploaded.ok) return null;
      const client = db();
      if (!client) return null;
      const { data, error } = await client
        .from("project_documents")
        .insert({
          organization_id: orgId,
          project_id: project.id,
          doc_category: docCategory,
          stage_at_upload: project.current_stage,
          storage_path: storagePath,
          filename: input.fileName || "upload",
          mime_type: input.mimeType,
          size_bytes: input.fileBuffer.length,
        })
        .select("*")
        .single();
      if (error) return null;
      return data as Record<string, unknown>;
    },
  });
}

export type ProjectUploadResult =
  | { ok: true; v2: false; data: Record<string, unknown> }
  | { ok: true; v2: true; data: Record<string, unknown> }
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
  legacyInsert: (storagePath: string, documentId: string) => Promise<Record<string, unknown> | null>;
}): Promise<ProjectUploadResult> {
  const documentId = crypto.randomUUID();
  const storagePath = buildProjectDocumentStoragePath({
    organizationId: input.organizationId,
    projectId: input.projectId,
    documentId,
    mimeType: input.mimeType,
    fileName: input.fileName,
  });

  if (!isDocumentsHubV2WriteEnabled()) {
    const uploaded = await uploadProjectDocumentFile({
      storagePath,
      fileBuffer: input.fileBuffer,
      mimeType: input.mimeType,
    });
    if (!uploaded.ok) return { ok: false, error: uploaded.error ?? "upload_failed" };

    const row = await input.legacyInsert(storagePath, documentId);
    if (!row) return { ok: false, error: "insert_failed" };
    return { ok: true, v2: false, data: row };
  }

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

    const legacyShape = {
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
    };
    return { ok: true, v2: true, data: legacyShape };
  }

  const projCat = projectDocCategoryToProjectAssetCategory(input.docCategory);
  if (!projCat) return { ok: false, error: "invalid_project_doc_category" };

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
    v2: true,
    data: projectAssetToLegacyDocumentRow(asset, input.stageAtUpload),
  };
}

/** GET /files — v2 customer_assets (legacy table merge only when legacy read ON). */
export async function listCustomerFilesForApi(leadId: string): Promise<Record<string, unknown>[]> {
  const client = db();
  if (!client) return [];

  const legacyRead = isDocumentsHubLegacyReadEnabled();
  const v2Write = isDocumentsHubV2WriteEnabled();

  let legacyRows: Record<string, unknown>[] = [];
  if (legacyRead) {
    const { data: legacy, error } = await client
      .from("customer_files")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(100);
    legacyRows = error?.code === "42P01" ? [] : ((legacy ?? []) as Record<string, unknown>[]);
  }

  if (!v2Write) {
    return legacyRows;
  }

  const orgId = await resolveDefaultOrgId();
  const { listCustomerAssets } = await import("@/lib/customer-asset-store");
  const assets = await listCustomerAssets(leadId, orgId);
  const legacyIds = new Set(legacyRows.map((r) => String(r.id)));
  const assetRows = assets
    .filter((a) => !legacyIds.has(a.id))
    .map((a) =>
      customerAssetToLegacyFileRow(
        a,
        a.category === "bill" ? "bill" : a.category === "survey_media" ? "document" : "site_image"
      )
    );

  return [...assetRows, ...legacyRows].sort(
    (a, b) =>
      new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime()
  );
}
