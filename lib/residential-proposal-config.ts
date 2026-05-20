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
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";

export { residentialProposalConfigSchema, defaultResidentialConfig };
export type { ResidentialProposalConfig };

/** Ensures wireBrandOptions (max 2) and legacy wireBrand stay aligned. */
export function normalizeResidentialConfig(config: ResidentialProposalConfig): ResidentialProposalConfig {
  const pricing = config.pricing;
  if (!pricing) return config;
  const fromList = pricing.wireBrandOptions?.filter(Boolean).slice(0, 2) ?? [];
  const wireBrandOptions: ResidentialWireBrand[] =
    fromList.length > 0 ? [...fromList] : pricing.wireBrand ? [pricing.wireBrand] : ["polycab"];
  return {
    ...config,
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
    dcr_comparison_card: false,
    capacity_scenarios_card: false,
    executive_summary: false,
    payback_analysis: false,
  };

  return {
    ...layout,
    blocks: layout.blocks.map((b) =>
      flags[b.id] !== undefined ? { ...b, enabled: flags[b.id]! } : b
    ),
  };
}
