/**
 * Phase 2 — project_assets writes (server-only).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type { DocumentCategoryDb } from "@/lib/document-category-registry";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type ProjectAssetRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  project_id: string;
  category: string;
  storage_bucket: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_id: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
};

export async function insertProjectAsset(input: {
  organizationId: string;
  customerId: string;
  projectId: string;
  category: DocumentCategoryDb;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById?: string | null;
  notes?: string | null;
}): Promise<ProjectAssetRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("project_assets")
    .insert({
      organization_id: input.organizationId,
      customer_id: input.customerId,
      project_id: input.projectId,
      category: input.category,
      storage_bucket: "project-files",
      storage_path: input.storagePath,
      filename: input.filename.slice(0, 255),
      mime_type: input.mimeType || "application/octet-stream",
      size_bytes: Math.max(0, input.sizeBytes),
      uploaded_by_id: input.uploadedById ?? null,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      console.warn("[project-asset-store] project_assets table missing");
      return null;
    }
    console.warn("[project-asset-store] insert:", error.message);
    return null;
  }
  return data as ProjectAssetRow;
}

export async function listProjectAssets(
  projectId: string,
  opts?: { category?: string | null }
): Promise<ProjectAssetRow[]> {
  const client = db();
  if (!client) return [];

  let query = client
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (opts?.category) query = query.eq("category", opts.category);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01") return [];
    return [];
  }
  return (data ?? []) as ProjectAssetRow[];
}

export async function getProjectAssetById(
  projectId: string,
  assetId: string
): Promise<ProjectAssetRow | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", assetId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectAssetRow;
}

export async function archiveProjectAsset(assetId: string): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { error } = await client
    .from("project_assets")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", assetId)
    .is("archived_at", null);
  return !error;
}

/** Present v2 row as legacy ProjectDocumentRow for API compat */
export function projectAssetToLegacyDocumentRow(
  asset: ProjectAssetRow,
  stageAtUpload = "survey"
): Record<string, unknown> {
  return {
    id: asset.id,
    organization_id: asset.organization_id,
    project_id: asset.project_id,
    doc_category: asset.category,
    stage_at_upload: stageAtUpload,
    storage_path: asset.storage_path,
    filename: asset.filename,
    mime_type: asset.mime_type,
    size_bytes: asset.size_bytes,
    uploaded_by_id: asset.uploaded_by_id,
    notes: asset.notes,
    linked_entity_type: null,
    linked_entity_id: null,
    archived_at: asset.archived_at,
    created_at: asset.created_at,
    _source: "project_assets",
  };
}
