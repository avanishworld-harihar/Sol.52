/**
 * Freeze customer quote on proposal generate / send (Phase 1).
 */

import { buildQuoteSnapshotFromProposal } from "@/lib/pricing-quote-snapshot";
import { getProposalPricingByProposalId } from "@/lib/proposal-pricing-store";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import { createPricingSnapshot, type SnapshotTrigger } from "@/lib/proposal-snapshot-store";
import { getProposalById } from "@/lib/proposals-store";

export async function freezeProposalQuote(
  proposalId: string,
  trigger: SnapshotTrigger = "manual"
): Promise<boolean> {
  const proposal = await getProposalById(proposalId);
  if (!proposal) return false;

  const pricing = await getProposalPricingByProposalId(proposalId);
  const ppt = mergeProposalPricingIntoPptInput(proposal.ppt_input, pricing);
  const presetId = proposal.preset_id ?? "residential_smart";

  const quote = buildQuoteSnapshotFromProposal(ppt, presetId, pricing);
  if (!pricing) return false;

  const snap = await createPricingSnapshot(proposalId, pricing, trigger, undefined, quote);
  return Boolean(snap);
}
