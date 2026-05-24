/**
 * Residential requirement-based deck math & BOM (does not affect commercial).
 */

import {
  buildBom,
  pickBrandSet,
  type BomFreeAmcYears,
  type DeckBomItem,
} from "@/lib/proposal-deck-helpers";
import {
  getActiveCatalogEntry,
  lookupKwGrossForTrack,
} from "@/lib/residential-brand-catalog";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import { computePmSuryaGharSubsidy } from "@/lib/proposal-deck-helpers";
import { quoteResidentialSolar } from "@/lib/residential-solar-engine";
import type {
  ResidentialBrandOption,
  ResidentialDiscount,
  ResidentialKwTier,
  ResidentialProposalConfig,
  ResidentialWireBrand,
} from "@/lib/residential-requirements-schema";

/** 1 kW → 4 units/day → 120 units/month → 1,440 units/year (30-day months). */
export function residentialDailyGenerationUnits(systemKw: number): number {
  return Math.round(Math.max(0, systemKw) * 4);
}

export function residentialMonthlyGenerationUnits(systemKw: number): number {
  return residentialDailyGenerationUnits(systemKw) * 30;
}

export function residentialAnnualGenerationUnits(systemKw: number): number {
  return residentialMonthlyGenerationUnits(systemKw) * 12;
}

export function lookupResidentialKwPriceInr(
  tiers: ResidentialKwTier[] | undefined,
  plantKw: number
): number | null {
  if (!tiers?.length) return null;
  const sorted = [...tiers].sort((a, b) => a.kw - b.kw);
  const exact = sorted.find((t) => t.kw === plantKw);
  if (exact && exact.priceInr > 0) return exact.priceInr;
  let best: ResidentialKwTier | null = null;
  for (const t of sorted) {
    if (t.kw <= plantKw && t.priceInr > 0) best = t;
  }
  return best?.priceInr ?? sorted.find((t) => t.priceInr > 0)?.priceInr ?? null;
}

export function applyResidentialDiscountInr(
  grossInr: number,
  discount: ResidentialDiscount | undefined
): number {
  if (!discount?.enabled || discount.value <= 0) return 0;
  if (discount.type === "fixed_inr") return Math.min(grossInr, Math.round(discount.value));
  return Math.round((grossInr * Math.min(100, discount.value)) / 100);
}

export function residentialGrossCostInr(config: ResidentialProposalConfig): number {
  const kw = config.solar.plantCapacityKw;
  const track = config.solar.panelTrack ?? "dcr";
  const catalogEntry = getActiveCatalogEntry(config);
  const fromCatalog = lookupKwGrossForTrack(
    catalogEntry,
    kw,
    track,
    config.pricing?.kwTiers
  );
  if (fromCatalog != null && fromCatalog > 0) return fromCatalog;
  const fromTierDcr = lookupResidentialKwPriceInr(config.pricing?.kwTiers, kw);
  const fromTierNon = lookupResidentialKwPriceInr(
    config.pricing?.kwTiers?.map((t) => ({ ...t, priceInr: t.nonDcrPriceInr ?? 0 })),
    kw
  );
  if (track === "non_dcr" && fromTierNon != null && fromTierNon > 0) return fromTierNon;
  if (fromTierDcr != null && fromTierDcr > 0) return fromTierDcr;
  const q = quoteResidentialSolar(config.solar);
  if (q.hardwareInr > 0) return q.hardwareInr;
  return computeGrossSystemCostInr(kw);
}

export function residentialNetCostInr(
  config: ResidentialProposalConfig,
  options?: { connectionType?: string | null; subsidyEligible?: boolean }
): number {
  return residentialCostBreakdown(config, options).netInr;
}

export type ResidentialCostBreakdown = {
  grossInr: number;
  discountInr: number;
  afterDiscountInr: number;
  subsidyInr: number;
  netInr: number;
  activeTierKw: number;
};

/** Gross → discount → post-discount → subsidy → net (web proposal + builder). */
export function residentialCostBreakdown(
  config: ResidentialProposalConfig,
  options?: { connectionType?: string | null; subsidyEligible?: boolean }
): ResidentialCostBreakdown {
  const grossInr = residentialGrossCostInr(config);
  const discountInr = applyResidentialDiscountInr(grossInr, config.pricing?.discount);
  const afterDiscountInr = Math.max(0, grossInr - discountInr);
  const eligible =
    options?.subsidyEligible ??
    isPmSuryaGharSubsidyEligible(options?.connectionType ?? config.connectionType);
  const subsidyInr = eligible
    ? config.subsidy?.estimateInr ?? computePmSuryaGharSubsidy(config.solar.plantCapacityKw)
    : 0;
  const netInr = Math.max(0, afterDiscountInr - subsidyInr);
  return {
    grossInr,
    discountInr,
    afterDiscountInr,
    subsidyInr,
    netInr,
    activeTierKw: config.solar.plantCapacityKw,
  };
}

export function wireBrandDisplayName(wire: ResidentialWireBrand): string {
  return wire === "havells" ? "Havells" : "Polycab";
}

export function resolveWireBrandOptions(
  pricing: ResidentialProposalConfig["pricing"]
): ResidentialWireBrand[] {
  const fromList = pricing?.wireBrandOptions?.filter(Boolean).slice(0, 2) ?? [];
  if (fromList.length > 0) return fromList;
  if (pricing?.wireBrand) return [pricing.wireBrand];
  return ["polycab"];
}

export function wireBrandsLabel(
  pricing: ResidentialProposalConfig["pricing"],
  fallback = "Polycab"
): string {
  const names = resolveWireBrandOptions(pricing).map(wireBrandDisplayName);
  if (names.length === 0) return fallback;
  if (names.length === 1) return names[0]!;
  return `${names[0]} / ${names[1]}`;
}

export function panelBrandsLabel(opts: ResidentialBrandOption[] | undefined, fallback: string): string {
  const names = (opts ?? []).map((o) => o.brand.trim()).filter(Boolean);
  if (names.length === 0) return fallback;
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

export function inverterBrandsLabel(opts: ResidentialBrandOption[] | undefined, fallback: string): string {
  const names = (opts ?? []).map((o) => o.brand.trim()).filter(Boolean);
  if (names.length === 0) return fallback;
  return names.join(" / ");
}

export function buildResidentialBomFromConfig(
  config: ResidentialProposalConfig,
  amcYears: BomFreeAmcYears = 1
): DeckBomItem[] {
  const q = quoteResidentialSolar(config.solar);
  const kw = config.solar.plantCapacityKw;
  const tech =
    config.pricing?.panelTechnology?.trim() ||
    config.solar.technology?.trim() ||
    "Mono PERC / TOPCon";
  const defaultBrands = pickBrandSet({ systemKw: kw });
  const panelBrand = panelBrandsLabel(config.panelBrandOptions, config.solar.brand || defaultBrands.panel);
  const inverterBrand = inverterBrandsLabel(
    config.inverterBrandOptions,
    defaultBrands.inverter
  );
  const wire = wireBrandsLabel(config.pricing);

  const base = buildBom({
    systemKw: kw,
    preferredPanelBrand: defaultBrands.panel,
    includedFreeAmcYears: amcYears,
  });

  return base.map((row) => {
    if (row.slot === 1) {
      return {
        ...row,
        spec: `${q.moduleCount} × ${config.solar.watt} Wp ${tech} (BIS, MNRE)`,
        brand: panelBrand,
      };
    }
    if (row.slot === 2) {
      return {
        ...row,
        spec: `${kw} kW On-Grid String Inverter (MPPT, IP65)`,
        brand: inverterBrand,
      };
    }
    if (row.slot === 4) {
      return {
        ...row,
        spec: "TUV-approved 4 mm² DC + 4 mm² AC, fire-resistant",
        brand: `${wire} (DC/AC cabling)`,
      };
    }
    return row;
  });
}

export function isResidentialRequirementInput(
  input: { residentialConfig?: ResidentialProposalConfig | null; dataSource?: string | null }
): boolean {
  return (
    input.residentialConfig?.inputMode === "requirement" || input.dataSource === "requirement"
  );
}
