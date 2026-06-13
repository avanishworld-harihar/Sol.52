"use client";

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { ExecutivePremiumEditorialRenderer } from "@/components/proposals/executive-premium-editorial/executive-premium-editorial-renderer";

export type ExecutivePremiumNextgenRendererProps = {
  proposalId: string;
  generatedAt: string;
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
  siteImages?: string[];
};

/**
 * Executive Premium — routes to Editorial Split-Page renderer (6-page HNI document).
 * Keeps export name for existing proposal routes and builder preview wiring.
 */
export function ExecutivePremiumNextgenRenderer({
  pptInput,
  summary,
}: ExecutivePremiumNextgenRendererProps) {
  return <ExecutivePremiumEditorialRenderer pptInput={pptInput} summary={summary} />;
}
