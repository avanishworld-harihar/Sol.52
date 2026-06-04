/**
 * Phase 3 — proposal_assets writes (server-only).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type { DocumentCategoryDb } from "@/lib/document-category-registry";
import type { SnapshotTrigger } from "@/lib/proposal-snapshot-store";
import { PROPOSAL_ASSETS_BUCKET } from "@/lib/proposal-asset-upload";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type ProposalAssetRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  proposal_id: string;
  pricing_snapshot_id: string | null;
  category: string;
  revision_number: number;
  storage_bucket: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  triggered_by: string;
  archived_at: string | null;
  created_at: string;
};

export async function getProposalAssetBySnapshotId(
  snapshotId: string
): Promise<ProposalAssetRow | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("proposal_assets")
    .select("*")
    .eq("pricing_snapshot_id", snapshotId)
    .is("archived_at", null)
    .maybeSingle();
  if (error) {
    if (error.code === "42P01") return null;
    return null;
  }
  return data ? (data as ProposalAssetRow) : null;
}

export async function insertProposalAsset(input: {
  organizationId: string;
  customerId: string;
  proposalId: string;
  pricingSnapshotId: string;
  category: DocumentCategoryDb;
  revisionNumber: number;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  triggeredBy: SnapshotTrigger;
}): Promise<ProposalAssetRow | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("proposal_assets")
    .insert({
      organization_id: input.organizationId,
      customer_id: input.customerId,
      proposal_id: input.proposalId,
      pricing_snapshot_id: input.pricingSnapshotId,
      category: input.category,
      revision_number: input.revisionNumber,
      storage_bucket: PROPOSAL_ASSETS_BUCKET,
      storage_path: input.storagePath,
      filename: input.filename.slice(0, 255),
      mime_type: input.mimeType,
      size_bytes: Math.max(0, input.sizeBytes),
      triggered_by: input.triggeredBy,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      console.warn("[proposal-asset-store] proposal_assets table missing");
      return null;
    }
    if (error.code === "23505") {
      return getProposalAssetBySnapshotId(input.pricingSnapshotId);
    }
    console.warn("[proposal-asset-store] insert:", error.message);
    return null;
  }
  return data as ProposalAssetRow;
}

export async function listProposalAssetsByCustomer(
  customerId: string,
  orgId: string | null
): Promise<ProposalAssetRow[]> {
  const client = db();
  if (!client) return [];
  let query = client
    .from("proposal_assets")
    .select("*")
    .eq("customer_id", customerId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (orgId) query = query.eq("organization_id", orgId);
  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01") return [];
    console.warn("[proposal-asset-store] list:", error.message);
    return [];
  }
  return (data ?? []) as ProposalAssetRow[];
}

export async function getProposalAssetById(assetId: string): Promise<ProposalAssetRow | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("proposal_assets")
    .select("*")
    .eq("id", assetId)
    .is("archived_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProposalAssetRow;
}

export async function archiveProposalAsset(assetId: string): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { error } = await client
    .from("proposal_assets")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", assetId)
    .is("archived_at", null);
  return !error;
}
