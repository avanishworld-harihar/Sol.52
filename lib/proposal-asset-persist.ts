/**
 * Phase 3 — persist frozen PPTX export when a pricing snapshot is created.
 */

import type { DocumentCategoryDb } from "@/lib/document-category-registry";
import { isDocumentsHubProposalPersistEnabled } from "@/lib/documents-hub-proposal-config";
import {
  buildProposalAssetStoragePath,
  PPTX_MIME,
  safeProposalFileName,
  uploadProposalAssetFile,
} from "@/lib/proposal-asset-upload";
import {
  getProposalAssetBySnapshotId,
  insertProposalAsset,
} from "@/lib/proposal-asset-store";
import { buildPremiumProposalPptBuffer } from "@/lib/proposal-ppt";
import { getProposalById } from "@/lib/proposals-store";
import type { PricingSnapshotRow, SnapshotTrigger } from "@/lib/proposal-snapshot-store";
import { resolveDefaultOrgId } from "@/lib/project-store";
import { randomUUID } from "crypto";

function categoryForSnapshot(trigger: SnapshotTrigger): DocumentCategoryDb | null {
  if (trigger === "sent") return "proposal_pdf";
  if (trigger === "revised") return "proposal_revision";
  return null;
}

/**
 * Fire-and-forget from createPricingSnapshot — never throws to caller.
 */
export async function persistProposalAssetForSnapshot(
  snapshot: PricingSnapshotRow
): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  try {
    if (!isDocumentsHubProposalPersistEnabled()) {
      return { ok: true, skipped: "flag_off" };
    }

    const category = categoryForSnapshot(snapshot.triggered_by);
    if (!category) {
      return { ok: true, skipped: `trigger_${snapshot.triggered_by}` };
    }

    const existing = await getProposalAssetBySnapshotId(snapshot.id);
    if (existing) return { ok: true, skipped: "already_exists" };

    const proposal = await getProposalById(snapshot.proposal_id);
    if (!proposal) return { ok: false, error: "proposal_not_found" };

    const customerId = proposal.lead_id?.trim() || null;
    if (!customerId) {
      console.warn(
        "[proposal-asset-persist] skip: proposal has no lead_id",
        snapshot.proposal_id
      );
      return { ok: true, skipped: "no_lead_id" };
    }

    const orgId = await resolveDefaultOrgId();
    if (!orgId) return { ok: false, error: "org_unresolved" };

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const publicWebUrl =
      origin && proposal.share_token
        ? `${origin}/proposal/${proposal.share_token}`
        : proposal.ppt_input?.webProposalUrl;

    const buffer = await buildPremiumProposalPptBuffer({
      ...proposal.ppt_input,
      webProposalUrl: proposal.ppt_input?.webProposalUrl || publicWebUrl,
    });

    const assetId = randomUUID();
    const storagePath = buildProposalAssetStoragePath({
      organizationId: orgId,
      customerId,
      proposalId: snapshot.proposal_id,
      assetId,
    });
    const filename = safeProposalFileName(proposal.customer_name, snapshot.version);

    const uploaded = await uploadProposalAssetFile({
      storagePath,
      fileBuffer: Buffer.from(buffer),
    });
    if (!uploaded.ok) {
      console.warn("[proposal-asset-persist] upload:", uploaded.error);
      return { ok: false, error: uploaded.error };
    }

    const row = await insertProposalAsset({
      organizationId: orgId,
      customerId,
      proposalId: snapshot.proposal_id,
      pricingSnapshotId: snapshot.id,
      category,
      revisionNumber: snapshot.version,
      storagePath,
      filename,
      mimeType: PPTX_MIME,
      sizeBytes: buffer.byteLength,
      triggeredBy: snapshot.triggered_by,
    });

    if (!row) return { ok: false, error: "insert_failed" };
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[proposal-asset-persist]", msg);
    return { ok: false, error: msg };
  }
}
