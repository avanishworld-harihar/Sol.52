/**
 * Phase 2 — customer_assets writes (server-only).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type { DocumentCategoryDb } from "@/lib/document-category-registry";
import { legacyCustomerFileTypeToCategory } from "@/lib/document-category-registry";
import type { CustomerFileType } from "@/lib/customer-file-upload";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type CustomerAssetRow = {
  id: string;
  organization_id: string;
  customer_id: string;
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

export function customerFileTypeToAssetCategory(fileType: CustomerFileType): DocumentCategoryDb {
  return legacyCustomerFileTypeToCategory(fileType);
}

export async function insertCustomerAsset(input: {
  organizationId: string;
  customerId: string;
  category: DocumentCategoryDb;
  storageBucket?: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById?: string | null;
  notes?: string | null;
  publicUrl?: string | null;
}): Promise<CustomerAssetRow | null> {
  const client = db();
  if (!client) return null;

  const bucket = input.storageBucket ?? "customer-files";
  let storagePath = input.storagePath;
  if (input.publicUrl?.startsWith("http") && !storagePath) {
    storagePath = input.publicUrl;
  }

  const { data, error } = await client
    .from("customer_assets")
    .insert({
      organization_id: input.organizationId,
      customer_id: input.customerId,
      category: input.category,
      storage_bucket: bucket,
      storage_path: storagePath,
      filename: input.filename.slice(0, 255),
      mime_type: input.mimeType || "application/octet-stream",
      size_bytes: Math.max(0, input.sizeBytes),
      uploaded_by_id: input.uploadedById ?? null,
      notes: input.notes?.trim() || null,
      source_channel: "crm_ui",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      console.warn("[customer-asset-store] customer_assets table missing");
      return null;
    }
    console.warn("[customer-asset-store] insert:", error.message);
    return null;
  }
  return data as CustomerAssetRow;
}

export async function listCustomerAssets(
  customerId: string,
  orgId?: string | null
): Promise<CustomerAssetRow[]> {
  const client = db();
  if (!client) return [];

  let query = client
    .from("customer_assets")
    .select("*")
    .eq("customer_id", customerId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (orgId) query = query.eq("organization_id", orgId);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01") return [];
    return [];
  }
  return (data ?? []) as CustomerAssetRow[];
}

export async function archiveCustomerAsset(assetId: string): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { error } = await client
    .from("customer_assets")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", assetId)
    .is("archived_at", null);
  return !error;
}

/** Map asset row → legacy customer_files shape for GET /files compat */
export function customerAssetToLegacyFileRow(
  asset: CustomerAssetRow,
  fileType: CustomerFileType = "document"
): Record<string, unknown> {
  const url =
    asset.storage_path.startsWith("http")
      ? asset.storage_path
      : null;
  return {
    id: asset.id,
    lead_id: asset.customer_id,
    file_name: asset.filename,
    file_url: url ?? asset.storage_path,
    file_type: fileType,
    file_size_kb: Math.round(asset.size_bytes / 1024) || 1,
    mime_type: asset.mime_type,
    created_at: asset.created_at,
    _source: "customer_assets",
  };
}
