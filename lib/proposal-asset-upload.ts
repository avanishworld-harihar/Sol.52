/**
 * Phase 3 — proposal-assets bucket upload and signed URLs.
 */

import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const PROPOSAL_ASSETS_BUCKET = "proposal-assets";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** 50 MB — PPTX decks can be large */
export const PROPOSAL_ASSET_MAX_BYTES = 50 * 1024 * 1024;

export function buildProposalAssetStoragePath(opts: {
  organizationId: string;
  customerId: string;
  proposalId: string;
  assetId: string;
}): string {
  return `${opts.organizationId}/${opts.customerId}/${opts.proposalId}/${opts.assetId}.pptx`;
}

export function safeProposalFileName(customerName: string, version: number): string {
  const cleaned = customerName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim();
  const base = cleaned.length > 0 ? cleaned : "customer";
  return `${base}-proposal-v${version}.pptx`;
}

async function ensureProposalAssetsBucket() {
  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "SUPABASE_SERVICE_ROLE_KEY missing." };

  const { data: bucket } = await admin.storage.getBucket(PROPOSAL_ASSETS_BUCKET);
  if (bucket) return { ok: true as const, admin };

  const { error: createErr } = await admin.storage.createBucket(PROPOSAL_ASSETS_BUCKET, {
    public: false,
    fileSizeLimit: PROPOSAL_ASSET_MAX_BYTES,
    allowedMimeTypes: [PPTX_MIME],
  });
  if (createErr && !createErr.message.toLowerCase().includes("already")) {
    return { ok: false as const, error: createErr.message };
  }
  return { ok: true as const, admin };
}

export async function uploadProposalAssetFile(opts: {
  storagePath: string;
  fileBuffer: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (opts.fileBuffer.length > PROPOSAL_ASSET_MAX_BYTES) {
    return {
      ok: false,
      error: `File too large. Max size is ${Math.round(PROPOSAL_ASSET_MAX_BYTES / 1024 / 1024)}MB.`,
    };
  }

  const setup = await ensureProposalAssetsBucket();
  if (!setup.ok) return { ok: false, error: setup.error };
  const admin = setup.admin;

  const { error: uploadErr } = await admin.storage
    .from(PROPOSAL_ASSETS_BUCKET)
    .upload(opts.storagePath, opts.fileBuffer, {
      upsert: false,
      contentType: PPTX_MIME,
      cacheControl: "3600",
    });
  if (uploadErr) return { ok: false, error: uploadErr.message };
  return { ok: true };
}

export async function createProposalAssetSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing." };

  const { data, error } = await admin.storage
    .from(PROPOSAL_ASSETS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "signed_url_failed" };
  }
  return { ok: true, url: data.signedUrl };
}

export { PPTX_MIME };
