/**
 * Sol.52 — Phase 3A-5.1 Project Documents store (SERVER-ONLY).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import {
  createProjectDocumentSignedUrl,
} from "@/lib/project-document-upload";
import type { ProjectDocumentCategory } from "@/lib/project-document-types";
import type { ProjectRow } from "@/lib/project-store";
import { isDocumentsHubV2WriteEnabled } from "@/lib/documents-hub-write-config";
import {
  listProjectAssets,
  getProjectAssetById,
  archiveProjectAsset,
  projectAssetToLegacyDocumentRow,
} from "@/lib/project-asset-store";
import { listLinkedCustomerAssetsForProject } from "@/lib/asset-link-store";
import { archiveCustomerAsset } from "@/lib/customer-asset-store";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export interface ProjectDocumentRow {
  id: string;
  organization_id: string;
  project_id: string;
  doc_category: string;
  stage_at_upload: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_id: string | null;
  notes: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  archived_at: string | null;
  created_at: string;
}

export type ProjectDocumentWithUrl = ProjectDocumentRow & {
  download_url: string | null;
};

export type ProjectDocumentSummary = {
  total: number;
  by_category: Record<string, number>;
};

export async function getProjectOrgContext(
  projectId: string
): Promise<
  | {
      ok: true;
      project: Pick<
        ProjectRow,
        | "id"
        | "organization_id"
        | "current_stage"
        | "assigned_manager_id"
        | "assigned_tech_id"
        | "lead_id"
      >;
    }
  | { ok: false; error: string }
> {
  const client = db();
  if (!client) return { ok: false, error: "db_unavailable" };

  const { data, error } = await client
    .from("projects")
    .select(
      "id, organization_id, current_stage, assigned_manager_id, assigned_tech_id, lead_id"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "project_not_found" };
  const orgId = (data as { organization_id: string | null }).organization_id;
  if (!orgId) return { ok: false, error: "project_not_found_or_no_org" };

  return {
    ok: true,
    project: data as Pick<
      ProjectRow,
      | "id"
      | "organization_id"
      | "current_stage"
      | "assigned_manager_id"
      | "assigned_tech_id"
      | "lead_id"
    >,
  };
}

async function attachSignedUrls(
  rows: ProjectDocumentRow[]
): Promise<ProjectDocumentWithUrl[]> {
  const out: ProjectDocumentWithUrl[] = [];
  for (const row of rows) {
    if (row.archived_at) {
      out.push({ ...row, download_url: null });
      continue;
    }
    const signed = await createProjectDocumentSignedUrl(row.storage_path);
    out.push({
      ...row,
      download_url: signed.ok ? signed.url : null,
    });
  }
  return out;
}

export async function listProjectDocuments(
  projectId: string,
  opts?: {
    category?: ProjectDocumentCategory | null;
    stage?: string | null;
    includeArchived?: boolean;
    withUrls?: boolean;
  }
): Promise<ProjectDocumentRow[] | ProjectDocumentWithUrl[]> {
  const client = db();
  if (!client) return [];

  let query = client
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (!opts?.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (opts?.category) {
    query = query.eq("doc_category", opts.category);
  }
  if (opts?.stage) {
    query = query.eq("stage_at_upload", opts.stage);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    if (!isDocumentsHubV2WriteEnabled()) return [];
  }
  const legacyRows = (error || !Array.isArray(data) ? [] : data) as ProjectDocumentRow[];

  if (!isDocumentsHubV2WriteEnabled()) {
    if (opts?.withUrls) return attachSignedUrls(legacyRows);
    return legacyRows;
  }

  const v2Rows: ProjectDocumentRow[] = [];
  const legacyIds = new Set(legacyRows.map((r) => r.id));

  const assets = await listProjectAssets(projectId, {
    category: opts?.category ?? null,
  });
  for (const a of assets) {
    if (legacyIds.has(a.id)) continue;
    v2Rows.push(projectAssetToLegacyDocumentRow(a) as unknown as ProjectDocumentRow);
  }

  const linked = await listLinkedCustomerAssetsForProject(projectId);
  for (const { link, asset } of linked) {
    if (legacyIds.has(asset.id)) continue;
    if (opts?.category && asset.category !== opts.category) continue;
    v2Rows.push({
      id: asset.id,
      organization_id: link.organization_id,
      project_id: projectId,
      doc_category: asset.category,
      stage_at_upload: "survey",
      storage_path: asset.storage_path,
      filename: asset.filename,
      mime_type: asset.mime_type,
      size_bytes: asset.size_bytes,
      uploaded_by_id: asset.uploaded_by_id,
      notes: asset.notes,
      linked_entity_type: "asset_link",
      linked_entity_id: link.id,
      archived_at: null,
      created_at: asset.created_at,
    });
  }

  const merged = [...v2Rows, ...legacyRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (opts?.withUrls) {
    return attachSignedUrls(merged);
  }
  return merged;
}

export async function getProjectDocumentSummary(
  projectId: string
): Promise<ProjectDocumentSummary> {
  const client = db();
  if (!client) return { total: 0, by_category: {} };

  const { data, error } = await client
    .from("project_documents")
    .select("doc_category")
    .eq("project_id", projectId)
    .is("archived_at", null);

  if (error || !Array.isArray(data)) return { total: 0, by_category: {} };

  const by_category: Record<string, number> = {};
  for (const row of data as { doc_category: string }[]) {
    const cat = row.doc_category || "other";
    by_category[cat] = (by_category[cat] ?? 0) + 1;
  }
  return { total: data.length, by_category };
}

export async function getProjectDocumentById(
  projectId: string,
  documentId: string,
  withUrl = true
): Promise<ProjectDocumentWithUrl | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", documentId)
    .maybeSingle();

  if (!error && data) {
    const row = data as ProjectDocumentRow;
    if (!withUrl || row.archived_at) {
      return { ...row, download_url: null };
    }
    const signed = await createProjectDocumentSignedUrl(row.storage_path);
    return { ...row, download_url: signed.ok ? signed.url : null };
  }

  if (isDocumentsHubV2WriteEnabled()) {
    const asset = await getProjectAssetById(projectId, documentId);
    if (asset) {
      const row = projectAssetToLegacyDocumentRow(asset) as unknown as ProjectDocumentRow;
      if (!withUrl) return { ...row, download_url: null };
      const signed = await createProjectDocumentSignedUrl(row.storage_path);
      return { ...row, download_url: signed.ok ? signed.url : null };
    }
    const linked = await listLinkedCustomerAssetsForProject(projectId);
    const hit = linked.find((x) => x.asset.id === documentId);
    if (hit) {
      const row: ProjectDocumentRow = {
        id: hit.asset.id,
        organization_id: hit.link.organization_id,
        project_id: projectId,
        doc_category: hit.asset.category,
        stage_at_upload: "survey",
        storage_path: hit.asset.storage_path,
        filename: hit.asset.filename,
        mime_type: hit.asset.mime_type,
        size_bytes: hit.asset.size_bytes,
        uploaded_by_id: hit.asset.uploaded_by_id,
        notes: hit.asset.notes,
        linked_entity_type: "asset_link",
        linked_entity_id: hit.link.id,
        archived_at: null,
        created_at: hit.asset.created_at,
      };
      if (!withUrl) return { ...row, download_url: null };
      const admin = db();
      let url: string | null = null;
      if (admin && hit.asset.storage_path && !hit.asset.storage_path.startsWith("http")) {
        const bucket = hit.asset.storage_bucket || "customer-files";
        const { data: signed } = await admin.storage
          .from(bucket)
          .createSignedUrl(hit.asset.storage_path, 3600);
        url = signed?.signedUrl ?? null;
      }
      return { ...row, download_url: url };
    }
  }

  return null;
}

export async function insertProjectDocument(input: {
  organizationId: string;
  projectId: string;
  docCategory: ProjectDocumentCategory;
  stageAtUpload: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById?: string | null;
  notes?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}): Promise<ProjectDocumentRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_documents")
    .insert({
      organization_id: input.organizationId,
      project_id: input.projectId,
      doc_category: input.docCategory,
      stage_at_upload: input.stageAtUpload,
      storage_path: input.storagePath,
      filename: input.filename,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      uploaded_by_id: input.uploadedById ?? null,
      notes: input.notes?.trim() || null,
      linked_entity_type: input.linkedEntityType ?? null,
      linked_entity_id: input.linkedEntityId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return data as ProjectDocumentRow;
}

export async function updateProjectDocumentMeta(
  projectId: string,
  documentId: string,
  patch: {
    doc_category?: ProjectDocumentCategory;
    notes?: string | null;
  }
): Promise<ProjectDocumentRow | null> {
  const client = db();
  if (!client) return null;

  const payload: Record<string, unknown> = {};
  if (patch.doc_category) payload.doc_category = patch.doc_category;
  if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null;

  const { data, error } = await client
    .from("project_documents")
    .update(payload)
    .eq("project_id", projectId)
    .eq("id", documentId)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();

  if (!error && data) return data as ProjectDocumentRow;

  if (isDocumentsHubV2WriteEnabled()) {
    const asset = await getProjectAssetById(projectId, documentId);
    if (asset) {
      return projectAssetToLegacyDocumentRow(asset) as unknown as ProjectDocumentRow;
    }
  }

  return null;
}

export async function archiveProjectDocument(
  projectId: string,
  documentId: string
): Promise<ProjectDocumentRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_documents")
    .update({ archived_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("id", documentId)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();

  if (!error && data) return data as ProjectDocumentRow;

  if (isDocumentsHubV2WriteEnabled()) {
    const asset = await getProjectAssetById(projectId, documentId);
    if (asset) {
      const ok = await archiveProjectAsset(documentId);
      if (!ok) return null;
      return { ...asset, archived_at: new Date().toISOString() } as unknown as ProjectDocumentRow;
    }
    const linked = await listLinkedCustomerAssetsForProject(projectId);
    const hit = linked.find((x) => x.asset.id === documentId);
    if (hit) {
      const ok = await archiveCustomerAsset(documentId);
      if (!ok) return null;
      return {
        id: hit.asset.id,
        organization_id: hit.link.organization_id,
        project_id: projectId,
        doc_category: hit.asset.category,
        stage_at_upload: "survey",
        storage_path: hit.asset.storage_path,
        filename: hit.asset.filename,
        mime_type: hit.asset.mime_type,
        size_bytes: hit.asset.size_bytes,
        uploaded_by_id: hit.asset.uploaded_by_id,
        notes: hit.asset.notes,
        linked_entity_type: null,
        linked_entity_id: null,
        archived_at: new Date().toISOString(),
        created_at: hit.asset.created_at,
      };
    }
  }

  return null;
}
