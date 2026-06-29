import type { ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";
import { residentialCostBreakdown } from "@/lib/residential-deck-helpers";
import {
  defaultResidentialConfig,
  normalizeResidentialConfig,
} from "@/lib/residential-proposal-config";
import { mergeInstallerBrandCatalogWith } from "@/lib/residential-brand-catalog-storage";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { moduleCountForResidential, quoteResidentialSolar } from "@/lib/residential-solar-engine";

/** Shown on dashboard / proposals hub quick launcher. */
export const FEATURED_REQUIREMENT_KW = [3, 5, 7, 8, 10] as const;

/** Full tier list aligned with defaultResidentialKwTiers(). */
export const EXTENDED_REQUIREMENT_KW = [3, 5, 6, 7, 8, 9, 10] as const;

export type RequirementKw = (typeof EXTENDED_REQUIREMENT_KW)[number];

export type QuickRequirementPreview = {
  kw: number;
  netInr: number;
  subsidyInr: number;
  plantInr: number;
  phaseSurchargeInr: number;
  panelBrand: string;
  moduleWatt: number;
  moduleCount: number;
};

export function isFeaturedRequirementKw(kw: number): kw is RequirementKw {
  return (FEATURED_REQUIREMENT_KW as readonly number[]).includes(kw);
}

/** Requirement-mode config for a plant size — uses installer rate card when provided. */
export function buildResidentialConfigForQuickQuote(
  plantKw: number,
  catalog?: ResidentialBrandCatalog | null
): ResidentialProposalConfig {
  const kw = Math.max(0.5, Math.min(10000, Number(plantKw) || 5));
  let base = defaultResidentialConfig(kw);
  base = {
    ...base,
    inputMode: "requirement",
    pricingSource: "rate_card",
  };
  return normalizeResidentialConfig(mergeInstallerBrandCatalogWith(base, catalog));
}

export function previewQuickRequirementQuote(
  plantKw: number,
  catalog?: ResidentialBrandCatalog | null
): QuickRequirementPreview {
  const config = buildResidentialConfigForQuickQuote(plantKw, catalog);
  const breakdown = residentialCostBreakdown(config);
  const q = quoteResidentialSolar(config.solar);
  return {
    kw: config.solar.plantCapacityKw,
    netInr: breakdown.netInr,
    subsidyInr: breakdown.subsidyInr,
    plantInr: breakdown.grossInr,
    phaseSurchargeInr: breakdown.phaseSurchargeInr,
    panelBrand: config.solar.brand,
    moduleWatt: config.solar.watt,
    moduleCount: moduleCountForResidential(config.solar),
  };
}

export function formatQuickQuoteInr(value: number): string {
  const n = Math.round(Math.max(0, value));
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
