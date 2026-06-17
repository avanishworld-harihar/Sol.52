/**
 * Residential requirement-based deck math & BOM (does not affect commercial).
 */

import { resolvePhaseSurchargeInr } from "@/lib/connection-phase-pricing";
import {
  buildBom,
  pickBrandSet,
  computePmSuryaGharSubsidy,
  type BomFreeAmcYears,
  type DeckBomItem,
} from "@/lib/proposal-deck-helpers";
import { resolvePlantPriceFromConfigOrFallback } from "@/lib/plant-pricing-resolver";
import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import { quoteResidentialSolar } from "@/lib/residential-solar-engine";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
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
  if (config.brandCatalog?.entries?.length) {
    return resolvePlantPriceFromConfigOrFallback(config);
  }
  const kw = config.solar.plantCapacityKw;
  const track = config.solar.panelTrack ?? "dcr";
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
  phaseSurchargeInr: number;
  subtotalBeforeDiscountInr: number;
  discountInr: number;
  afterDiscountInr: number;
  subsidyInr: number;
  netInr: number;
  activeTierKw: number;
};

/** Plant price + phase surcharge → discount → subsidy → net (web proposal + builder). */
export function residentialCostBreakdown(
  config: ResidentialProposalConfig,
  options?: { connectionType?: string | null; subsidyEligible?: boolean }
): ResidentialCostBreakdown {
  const grossInr = residentialGrossCostInr(config);
  const phaseSurchargeInr = resolvePhaseSurchargeInr(config.pricing);
  const subtotalBeforeDiscountInr = grossInr + phaseSurchargeInr;
  const discountInr = applyResidentialDiscountInr(subtotalBeforeDiscountInr, config.pricing?.discount);
  const afterDiscountInr = Math.max(0, subtotalBeforeDiscountInr - discountInr);
  const dcrEligible = (config.solar.panelTrack ?? "dcr") === "dcr";
  const eligible =
    dcrEligible &&
    (options?.subsidyEligible ??
      isPmSuryaGharSubsidyEligible(options?.connectionType ?? config.connectionType));
  const subsidyInr = eligible
    ? config.subsidy?.estimateInr ?? computePmSuryaGharSubsidy(config.solar.plantCapacityKw)
    : 0;
  const netInr = Math.max(0, afterDiscountInr - subsidyInr);
  return {
    grossInr,
    phaseSurchargeInr,
    subtotalBeforeDiscountInr,
    discountInr,
    afterDiscountInr,
    subsidyInr,
    netInr,
    activeTierKw: config.solar.plantCapacityKw,
  };
}

export function wireBrandDisplayName(wire: ResidentialWireBrand): string {
  const w = wire.trim();
  if (!w) return "Polycab";
  if (w.toLowerCase() === "havells") return "Havells";
  if (w.toLowerCase() === "polycab") return "Polycab";
  return w;
}

export function resolveWireBrandOptions(
  pricing: ResidentialProposalConfig["pricing"]
): ResidentialWireBrand[] {
  const fromList = pricing?.wireBrandOptions?.filter(Boolean).slice(0, 32) ?? [];
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
  return names.join(" / ");
}

export function panelBrandsLabel(opts: ResidentialBrandOption[] | undefined, fallback: string): string {
  const names = (opts ?? []).map((o) => o.brand.trim()).filter(Boolean);
  if (names.length === 0) return fallback;
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/** Primary panel brand for proposal/BOM — quoted solar selection wins over catalog active brand. */
export function resolveProposalPanelBrand(
  config: ResidentialProposalConfig,
  fallback: string
): string {
  const solar = config.solar;
  if (solar?.brandId) {
    const byId = config.brandCatalog?.entries?.find((e) => e.brandId === solar.brandId);
    if (byId?.brand?.trim()) return byId.brand.trim();
  }
  if (solar?.brand?.trim()) return solar.brand.trim();
  const fromOptions = panelBrandsLabel(config.panelBrandOptions, "");
  if (fromOptions.trim()) return fromOptions;
  const activeId = config.brandCatalog?.activeBrandId;
  const activeEntry = config.brandCatalog?.entries?.find((e) => e.brandId === activeId);
  if (activeEntry?.brand?.trim()) return activeEntry.brand.trim();
  return fallback;
}

export function inverterBrandsLabel(opts: ResidentialBrandOption[] | undefined, fallback: string): string {
  const names = (opts ?? []).map((o) => o.brand.trim()).filter(Boolean);
  if (names.length === 0) return fallback;
  return names.join(" / ");
}

export function buildResidentialBomFromConfig(
  config: ResidentialProposalConfig,
  amcYears: BomFreeAmcYears = 1,
  opts?: { installerName?: string; lineItems?: PricingLineItem[] }
): DeckBomItem[] {
  const q = quoteResidentialSolar(config.solar);
  const kw = config.solar.plantCapacityKw;
  const tech =
    config.pricing?.panelTechnology?.trim() ||
    config.solar.technology?.trim() ||
    "Mono PERC / TOPCon";
  const defaultBrands = pickBrandSet({ systemKw: kw });
  const panelBrand = resolveProposalPanelBrand(config, config.solar.brand || defaultBrands.panel);
  const lineBrand = (kind: PricingLineItem["kind"]) =>
    opts?.lineItems?.find((l) => l.kind === kind && l.brand?.trim())?.brand.trim();
  const inverterBrand =
    lineBrand("inverter") ||
    inverterBrandsLabel(config.inverterBrandOptions, defaultBrands.inverter);
  const structureBrand = lineBrand("structure") || defaultBrands.mounting;
  const safetyBrand = lineBrand("acdb_dcdb") || "Havells / Phoenix";
  const wire = wireBrandsLabel(config.pricing);
  const installerDesk = opts?.installerName?.trim()
    ? `${opts.installerName.trim()} Service Desk`
    : "Harihar Solar Service Desk";

  const base = buildBom({
    systemKw: kw,
    preferredPanelBrand: defaultBrands.panel,
    includedFreeAmcYears: amcYears,
    installerName: opts?.installerName,
  });

  return base.map((row) => {
    if (row.slot === 1) {
      const trackLabel =
        config.solar.panelTrack === "non_dcr"
          ? "Non-DCR "
          : config.solar.panelTrack === "dcr"
            ? "DCR "
            : "";
      return {
        ...row,
        spec: `${q.moduleCount} × ${config.solar.watt} Wp ${trackLabel}${tech} (BIS, MNRE)`,
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
    if (row.slot === 3) {
      return { ...row, brand: structureBrand };
    }
    if (row.slot === 4) {
      const cableBrand = lineBrand("cabling");
      return {
        ...row,
        spec: "TUV-approved 4 mm² DC + 4 mm² AC, fire-resistant",
        brand: cableBrand ? `${cableBrand} (DC/AC cabling)` : `${wire} (DC/AC cabling)`,
      };
    }
    if (row.slot === 5) {
      return { ...row, brand: safetyBrand };
    }
    if (row.slot === 6) {
      return { ...row, brand: installerDesk };
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
