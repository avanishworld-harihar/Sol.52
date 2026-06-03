/**
 * Phase 2 — asset_links (customer asset ↔ project, metadata only).
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import {
  AUTO_LINK_CUSTOMER_CATEGORIES,
  type DocumentCategoryDb,
} from "@/lib/document-category-registry";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type AssetLinkRow = {
  id: string;
  organization_id: string;
  asset_id: string;
  customer_id: string;
  project_id: string;
  link_role: string;
  pinned: boolean;
  created_at: string;
};

export async function upsertAssetLink(input: {
  organizationId: string;
  assetId: string;
  customerId: string;
  projectId: string;
  linkRole: string;
  pinned?: boolean;
}): Promise<AssetLinkRow | null> {
  const client = db();
  if (!client) return null;

  const { data: existing } = await client
    .from("asset_links")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("link_role", input.linkRole)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await client
      .from("asset_links")
      .update({
        asset_id: input.assetId,
        customer_id: input.customerId,
        pinned: input.pinned ?? false,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return null;
    return data as AssetLinkRow;
  }

  const { data, error } = await client
    .from("asset_links")
    .insert({
      organization_id: input.organizationId,
      asset_id: input.assetId,
      customer_id: input.customerId,
      project_id: input.projectId,
      link_role: input.linkRole,
      pinned: input.pinned ?? false,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") return null;
    console.warn("[asset-link-store] upsert:", error.message);
    return null;
  }
  return data as AssetLinkRow;
}

/**
 * On project create: link latest customer_assets per category (no blob copy).
 */
export async function linkCustomerAssetsOnProjectCreate(input: {
  organizationId: string;
  customerId: string;
  projectId: string;
}): Promise<{ linked: number; roles: string[] }> {
  const client = db();
  if (!client || !input.customerId?.trim()) {
    return { linked: 0, roles: [] };
  }

  const roles: string[] = [];
  let linked = 0;

  for (const category of AUTO_LINK_CUSTOMER_CATEGORIES) {
    const { data: assets, error } = await client
      .from("customer_assets")
      .select("id")
      .eq("customer_id", input.customerId)
      .eq("organization_id", input.organizationId)
      .eq("category", category)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !assets?.length) continue;

    const assetId = String(assets[0]!.id);
    const link = await upsertAssetLink({
      organizationId: input.organizationId,
      assetId,
      customerId: input.customerId,
      projectId: input.projectId,
      linkRole: category,
    });
    if (link) {
      linked += 1;
      roles.push(category);
    }
  }

  return { linked, roles };
}

export async function listLinkedCustomerAssetsForProject(
  projectId: string
): Promise<
  {
    link: AssetLinkRow;
    asset: {
      id: string;
      category: string;
      storage_bucket: string;
      storage_path: string;
      filename: string;
      mime_type: string;
      size_bytes: number;
      uploaded_by_id: string | null;
      notes: string | null;
      created_at: string;
    };
  }[]
> {
  const client = db();
  if (!client) return [];

  const { data: links, error } = await client
    .from("asset_links")
    .select("*")
    .eq("project_id", projectId);

  if (error || !links?.length) return [];

  const assetIds = links.map((l) => String(l.asset_id));
  const { data: assets } = await client
    .from("customer_assets")
    .select("id, category, storage_bucket, storage_path, filename, mime_type, size_bytes, uploaded_by_id, notes, created_at, archived_at")
    .in("id", assetIds)
    .is("archived_at", null);

  const assetMap = new Map((assets ?? []).map((a) => [String(a.id), a]));

  const out: {
    link: AssetLinkRow;
    asset: {
      id: string;
      category: string;
      storage_bucket: string;
      storage_path: string;
      filename: string;
      mime_type: string;
      size_bytes: number;
      uploaded_by_id: string | null;
      notes: string | null;
      created_at: string;
    };
  }[] = [];

  for (const link of links as AssetLinkRow[]) {
    const asset = assetMap.get(String(link.asset_id));
    if (!asset) continue;
    out.push({
      link,
      asset: asset as {
        id: string;
        category: string;
        storage_bucket: string;
        storage_path: string;
        filename: string;
        mime_type: string;
        size_bytes: number;
        uploaded_by_id: string | null;
        notes: string | null;
        created_at: string;
      },
    });
  }
  return out;
}
