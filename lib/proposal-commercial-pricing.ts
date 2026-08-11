/**
 * Single source of truth for gross / subsidy / discount / net on residential proposals.
 * All render surfaces must use `ProposalDeckSummary` fields produced here via summarizeProposalDeck.
 */

import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import { computePmSuryaGharSubsidy } from "@/lib/proposal-deck-helpers";
import {
  residentialCostBreakdown,
} from "@/lib/residential-deck-helpers";
import { parseResidentialConfig, type ResidentialProposalConfig } from "@/lib/residential-proposal-config";

export type ProposalCommercialPricing = {
  grossSystemCost: number;
  phaseSurchargeInr: number;
  pmSubsidy: number;
  discountInr: number;
  netCost: number;
};

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? Math.round(x) : 0;
}

function readNetOverride(input: PremiumProposalPptInput): number | null {
  if (input.commercialNetPayableInr != null && Number.isFinite(input.commercialNetPayableInr)) {
    return Math.max(0, n(input.commercialNetPayableInr));
  }
  if (input.netCostInr != null && Number.isFinite(input.netCostInr)) {
    return Math.max(0, n(input.netCostInr));
  }
  return null;
}

function fromTriple(
  gross: number,
  pmSubsidy: number,
  netCost: number,
  phaseSurchargeInr = 0
): ProposalCommercialPricing {
  const g = Math.max(0, n(gross));
  const phase = Math.max(0, n(phaseSurchargeInr));
  const s = Math.max(0, n(pmSubsidy));
  const net = Math.max(0, n(netCost));
  return {
    grossSystemCost: g,
    phaseSurchargeInr: phase,
    pmSubsidy: s,
    discountInr: Math.max(0, g + phase - s - net),
    netCost: net,
  };
}

/**
 * Resolves commercial pricing atomically so gross, subsidy, and net never diverge across pages.
 */
export function resolveProposalCommercialPricing(
  input: PremiumProposalPptInput,
  ctx: {
    systemKw: number;
    resCfg?: ResidentialProposalConfig | null;
    isCommercialDeck: boolean;
  }
): ProposalCommercialPricing {
  const netOverride = readNetOverride(input);
  const hasExplicitGross =
    input.grossSystemCostInr != null && Number.isFinite(input.grossSystemCostInr);
  const hasExplicitSubsidy =
    input.pmSuryaGharSubsidyInr != null && Number.isFinite(input.pmSuryaGharSubsidyInr);

  const resCfg = ctx.resCfg ?? parseResidentialConfig(input.residentialConfig);
  /** Rate-card / requirement config beats stale `proposal_pricing` scalars merged into ppt_input. */
  if (resCfg?.solar) {
    const breakdown = residentialCostBreakdown(resCfg, {
      connectionType: input.connectionType ?? resCfg.connectionType,
      subsidyEligible: ctx.isCommercialDeck ? false : undefined,
    });
    if (netOverride != null && !hasExplicitGross && !hasExplicitSubsidy) {
      return fromTriple(
        breakdown.grossInr,
        breakdown.subsidyInr,
        netOverride,
        breakdown.phaseSurchargeInr
      );
    }
    return {
      grossSystemCost: breakdown.grossInr,
      phaseSurchargeInr: breakdown.phaseSurchargeInr,
      pmSubsidy: breakdown.subsidyInr,
      discountInr: breakdown.discountInr,
      netCost: breakdown.netInr,
    };
  }

  /** Pricing-row merge — gross, subsidy, and net were written together (no residentialConfig). */
  if (hasExplicitGross && hasExplicitSubsidy && netOverride != null) {
    return fromTriple(input.grossSystemCostInr!, input.pmSuryaGharSubsidyInr!, netOverride);
  }

  const gross = hasExplicitGross
    ? n(input.grossSystemCostInr)
    : n(computeGrossSystemCostInr(ctx.systemKw));
  const pmSubsidy = hasExplicitSubsidy
    ? n(input.pmSuryaGharSubsidyInr)
    : n(computePmSuryaGharSubsidy(ctx.systemKw));
  const netCost = netOverride ?? Math.max(0, gross - pmSubsidy);
  return fromTriple(gross, pmSubsidy, netCost);
}
