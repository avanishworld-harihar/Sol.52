/**
 * Residential requirement config — parse, defaults, layout flags.
 */

import type { ProposalBlockId } from "@/lib/proposal-block-registry";
import {
  defaultResidentialConfig,
  residentialProposalConfigSchema,
  type ResidentialProposalConfig,
  type ResidentialWireBrand,
} from "@/lib/residential-requirements-schema";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import { mergeInstallerBrandCatalog } from "@/lib/residential-brand-catalog-storage";
import { mergeTrackCompareIntoConfig } from "@/lib/residential-track-compare";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";

export { residentialProposalConfigSchema, defaultResidentialConfig };
export type { ResidentialProposalConfig };

/** Ensures wireBrandOptions (max 2) and legacy wireBrand stay aligned. */
export function normalizeResidentialConfig(config: ResidentialProposalConfig): ResidentialProposalConfig {
  let next = ensureBrandCatalog(mergeTrackCompareIntoConfig(config));
  const pricing = next.pricing;
  if (!pricing) return next;
  const fromList = pricing.wireBrandOptions?.filter(Boolean).slice(0, 2) ?? [];
  const wireBrandOptions: ResidentialWireBrand[] =
    fromList.length > 0 ? [...fromList] : pricing.wireBrand ? [pricing.wireBrand] : ["polycab"];
  return {
    ...next,
    pricing: {
      ...pricing,
      wireBrandOptions,
      wireBrand: wireBrandOptions[0] ?? "polycab",
    },
  };
}

export function parseResidentialConfig(raw: unknown): ResidentialProposalConfig | null {
  const parsed = residentialProposalConfigSchema.safeParse(raw);
  return parsed.success ? normalizeResidentialConfig(parsed.data) : null;
}

/** New-proposal builder default — merges installer smart-catalog prices from local storage. */
export function defaultResidentialConfigForBuilder(
  plantKw = 5,
  inputMode?: "bill" | "requirement"
): ResidentialProposalConfig {
  let base = defaultResidentialConfig(plantKw);
  if (inputMode) base = { ...base, inputMode };
  base = { ...base, pricingSource: base.pricingSource ?? "rate_card" };
  if (base.pricingSource !== "customer_override") {
    base = mergeInstallerBrandCatalog(base);
  }
  return normalizeResidentialConfig(base);
}

/** Apply central rate card unless this proposal uses customer-only overrides. */
export function applyResidentialPricingSource(
  config: ResidentialProposalConfig
): ResidentialProposalConfig {
  if (config.pricingSource === "customer_override") {
    return normalizeResidentialConfig(ensureBrandCatalog(config));
  }
  return normalizeResidentialConfig(mergeInstallerBrandCatalog(config));
}

/** Toggle proposal blocks from residential requirement flags (EMI, subsidy, requirement path). */
export function applyResidentialFlagsToLayout(
  layout: ProposalTemplateV1,
  config: ResidentialProposalConfig
): ProposalTemplateV1 {
  const fin = config.financing;
  const sub = config.subsidy;

  const flags: Partial<Record<ProposalBlockId, boolean>> = {
    system_requirements: config.inputMode === "requirement",
    commercial_financing_card: fin?.enabled === true,
    payment_terms: fin?.enabled !== false,
    financial_summary: sub?.preference !== "none",
    brand_comparison_card: false,
    dcr_comparison_card: config.trackCompare?.enabled === true,
    capacity_scenarios_card: false,
    executive_summary: false,
    payback_analysis: false,
  };

  const updated = layout.blocks.map((b) =>
    flags[b.id] !== undefined ? { ...b, enabled: flags[b.id]! } : b
  );
  const present = new Set(updated.map((b) => b.id));
  for (const id of Object.keys(flags) as ProposalBlockId[]) {
    if (flags[id] !== undefined && !present.has(id)) {
      updated.push({ id, enabled: flags[id]! });
    }
  }
  return { ...layout, blocks: updated };
}
