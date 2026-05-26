import {
  applyCommercialFlagsToLayout,
  type CommercialProposalConfig,
} from "@/lib/commercial-proposal-config";
import { applyCommercialPanelTrackPolicy } from "@/lib/commercial-panel-track-policy";
import { saveInstallerResidentialCatalog } from "@/lib/installer-rate-card-client";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import { syncResidentialSolarToLineItems } from "@/lib/residential-solar-engine";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export type SaveCommercialRequirementInput = {
  proposalId: string;
  pricingConfig: ResidentialProposalConfig;
  commercialConfig: CommercialProposalConfig;
  proposalLayout?: ProposalTemplateV1 | null;
  lineItems?: PricingLineItem[];
};

export type SaveCommercialRequirementResult = {
  ok: boolean;
  error?: string;
  proposalLayout?: ProposalTemplateV1;
  commercialConfig?: CommercialProposalConfig;
};

/** Merge rate-card / brand toggles from pricing into commercial deck flags. */
export function mergeCommercialConfigWithPricing(
  commercial: CommercialProposalConfig,
  pricing: ResidentialProposalConfig
): CommercialProposalConfig {
  return {
    ...commercial,
    dcrComparison: {
      ...commercial.dcrComparison,
      enabled: pricing.trackCompare?.enabled === true,
      brandId: pricing.trackCompare?.compareBrandId ?? commercial.dcrComparison?.brandId,
      watt: pricing.solar.watt ?? commercial.dcrComparison?.watt,
    },
    brandComparison: {
      ...commercial.brandComparison,
      enabled: pricing.brandCompare?.enabled !== false,
      brandIdA: pricing.brandCompare?.brandIdA ?? commercial.brandComparison?.brandIdA,
      brandIdB: pricing.brandCompare?.brandIdB ?? commercial.brandComparison?.brandIdB,
    },
  };
}

/**
 * Persists commercial pricing (residentialConfig shape) + commercialConfig + optional BOM lines.
 */
export async function saveCommercialRequirement(
  input: SaveCommercialRequirementInput
): Promise<SaveCommercialRequirementResult> {
  const { proposalId, commercialConfig, proposalLayout, lineItems } = input;
  const pricing = applyCommercialPanelTrackPolicy(
    ensureBrandCatalog(input.pricingConfig),
    input.pricingConfig.connectionType
  );
  const mergedCommercial = mergeCommercialConfigWithPricing(commercialConfig, pricing);
  const layout = applyCommercialFlagsToLayout(
    proposalLayout ?? { version: 1, blocks: [] },
    mergedCommercial
  );

  if (pricing.brandCatalog) {
    void saveInstallerResidentialCatalog(pricing.brandCatalog);
  }

  if (lineItems?.length) {
    const syncedLines = syncResidentialSolarToLineItems(pricing.solar, lineItems);
    const prRes = await fetch(`/api/proposals/${proposalId}/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        line_items: syncedLines,
        system_kw: pricing.solar.plantCapacityKw,
      }),
    });
    const prJson = (await prRes.json()) as { ok?: boolean; error?: string };
    if (!prRes.ok || !prJson.ok) {
      return { ok: false, error: prJson.error ?? "pricing_save_failed" };
    }
  }

  const cfgRes = await fetch(`/api/proposals/${proposalId}/commercial-config`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commercialConfig: mergedCommercial,
      residentialConfig: { ...pricing, inputMode: pricing.inputMode ?? "bill", pricingSource: pricing.pricingSource ?? "rate_card" },
      proposalLayout: layout,
    }),
  });
  const cfgJson = (await cfgRes.json()) as {
    ok?: boolean;
    error?: string;
    proposalLayout?: ProposalTemplateV1;
    commercialConfig?: CommercialProposalConfig;
  };
  if (!cfgRes.ok || !cfgJson.ok) {
    return { ok: false, error: cfgJson.error ?? "config_save_failed" };
  }

  return {
    ok: true,
    proposalLayout: cfgJson.proposalLayout ?? layout,
    commercialConfig: cfgJson.commercialConfig ?? mergedCommercial,
  };
}
