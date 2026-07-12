/**
 * Central Smart Catalog pricing resolver.
 * Single source of truth: brandCatalog.entries[].kwTiers (DCR + Non-DCR columns).
 *
 * All proposal/BOM/compare paths must read via resolvePlantPrice().
 */

import { ratePerWpFromPlantGross } from "@/lib/pricing-engine";
import {
  getCatalogEntry,
  lookupDcrKwGrossInr,
  lookupNonDcrKwGrossInr,
  normalizeCatalogEntry,
  type ResidentialBrandCatalog,
  type ResidentialBrandCatalogEntry,
} from "@/lib/residential-brand-catalog";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export type PlantPricingMode = "dcr" | "non_dcr";

export type PlantPriceWarning =
  | "brand_not_found"
  | "kw_row_missing"
  | "dcr_price_missing"
  | "non_dcr_price_missing"
  | "mode_price_missing"
  | "using_tier_ladder";

export type ResolvePlantPriceInput = {
  catalog?: ResidentialBrandCatalog | null;
  brandId?: string | null;
  brand?: string | null;
  kw: number;
  mode: PlantPricingMode;
  moduleWatt?: number;
};

export type PlantPriceResult = {
  ok: boolean;
  brandId: string | null;
  brandLabel: string | null;
  kw: number;
  matchedTierKw: number | null;
  mode: PlantPricingMode;
  plantGrossInr: number;
  dcrGrossInr: number;
  nonDcrGrossInr: number;
  ratePerWpInr: number;
  warnings: PlantPriceWarning[];
  errors: string[];
};

function findBrandEntry(
  catalog: ResidentialBrandCatalog | null | undefined,
  brandId?: string | null,
  brand?: string | null
): ResidentialBrandCatalogEntry | null {
  if (!catalog?.entries?.length) return null;
  if (brandId) {
    const hit = getCatalogEntry(catalog, brandId);
    if (hit) return hit;
  }
  const label = brand?.trim().toLowerCase();
  if (label) {
    const byName = catalog.entries.find((e) => e.brand.trim().toLowerCase() === label);
    if (byName) return normalizeCatalogEntry(byName);
  }
  const activeId = catalog.activeBrandId ?? catalog.entries[0]?.brandId;
  return getCatalogEntry(catalog, activeId);
}

function tierLadderMatchedKw(entry: ResidentialBrandCatalogEntry | null, kw: number): number | null {
  if (!entry?.kwTiers?.length) return null;
  const sorted = [...entry.kwTiers].sort((a, b) => a.kw - b.kw);
  if (sorted.some((t) => t.kw === kw)) return kw;
  let best: number | null = null;
  for (const t of sorted) {
    if (t.kw <= kw) best = t.kw;
  }
  return best ?? sorted[0]?.kw ?? null;
}

/** Resolve plant gross (₹) from Smart Catalog matrix: brand × kW × mode. */
export function resolvePlantPrice(input: ResolvePlantPriceInput): PlantPriceResult {
  const kw = Math.max(0, input.kw);
  const mode = input.mode;
  const warnings: PlantPriceWarning[] = [];
  const errors: string[] = [];

  const entry = findBrandEntry(input.catalog, input.brandId, input.brand);
  if (!entry) {
    return {
      ok: false,
      brandId: input.brandId ?? null,
      brandLabel: input.brand ?? null,
      kw,
      matchedTierKw: null,
      mode,
      plantGrossInr: 0,
      dcrGrossInr: 0,
      nonDcrGrossInr: 0,
      ratePerWpInr: 0,
      warnings: ["brand_not_found"],
      errors: ["Brand not found in Smart Catalog."],
    };
  }

  const matchedTierKw = tierLadderMatchedKw(entry, kw);
  if (matchedTierKw !== kw) warnings.push("kw_row_missing");
  if (matchedTierKw != null && matchedTierKw !== kw) warnings.push("using_tier_ladder");

  const dcrGrossInr = Math.max(0, Math.round(lookupDcrKwGrossInr(entry, kw) ?? 0));
  const nonDcrGrossInr = Math.max(0, Math.round(lookupNonDcrKwGrossInr(entry, kw) ?? 0));

  if (dcrGrossInr <= 0) warnings.push("dcr_price_missing");
  if (nonDcrGrossInr <= 0) warnings.push("non_dcr_price_missing");

  const plantGrossInr = mode === "dcr" ? dcrGrossInr : nonDcrGrossInr;
  if (plantGrossInr <= 0) {
    warnings.push("mode_price_missing");
    // Retry with catalog active brand when the selected brand has no priced row for this kW.
    const activeId = input.catalog?.activeBrandId;
    if (activeId && activeId !== entry.brandId) {
      const fallback = resolvePlantPrice({
        ...input,
        brandId: activeId,
        brand: undefined,
      });
      if (fallback.ok && fallback.plantGrossInr > 0) {
        return {
          ...fallback,
          warnings: [...warnings, ...fallback.warnings, "using_tier_ladder"],
        };
      }
    }
    errors.push(
      mode === "dcr"
        ? `DCR price missing for ${entry.brand} at ${kw} kW — fill the pricing table in More → Rate card.`
        : `Non-DCR price missing for ${entry.brand} at ${kw} kW — fill the pricing table in More → Rate card.`
    );
  }

  const ratePerWpInr =
    plantGrossInr > 0 && kw > 0 ? ratePerWpFromPlantGross(plantGrossInr, kw) : 0;

  return {
    ok: errors.length === 0 && plantGrossInr > 0,
    brandId: entry.brandId,
    brandLabel: entry.brand,
    kw,
    matchedTierKw,
    mode,
    plantGrossInr,
    dcrGrossInr,
    nonDcrGrossInr,
    ratePerWpInr,
    warnings,
    errors,
  };
}

export function resolvePlantPriceFromConfig(
  config: ResidentialProposalConfig,
  overrides?: Partial<ResolvePlantPriceInput>
): PlantPriceResult {
  const catalog = config.brandCatalog;
  // Turnkey plant ₹ comes from the Smart catalog active brand (rate-card table),
  // not from the proposal's display panel brand (BOM "make" can list multiple brands).
  const pricingBrandId =
    overrides?.brandId ??
    catalog?.activeBrandId ??
    config.solar.brandId ??
    catalog?.entries?.[0]?.brandId;
  return resolvePlantPrice({
    catalog,
    brandId: pricingBrandId,
    brand: overrides?.brand ?? undefined,
    kw: overrides?.kw ?? config.solar.plantCapacityKw,
    mode: (overrides?.mode ?? config.solar.panelTrack ?? "dcr") as PlantPricingMode,
    moduleWatt: overrides?.moduleWatt ?? config.solar.watt,
  });
}

export type ProposalPricingValidation = {
  valid: boolean;
  errors: string[];
  warnings: PlantPriceWarning[];
  active: PlantPriceResult;
  dcr: PlantPriceResult;
  nonDcr: PlantPriceResult;
};

/** Validate active quote mode; optionally require both DCR and Non-DCR for compare cards. */
export function validateProposalPricing(
  config: ResidentialProposalConfig,
  opts?: { requireBothTracks?: boolean }
): ProposalPricingValidation {
  const mode = (config.solar.panelTrack ?? "dcr") as PlantPricingMode;
  const dcr = resolvePlantPriceFromConfig(config, { mode: "dcr" });
  const nonDcr = resolvePlantPriceFromConfig(config, { mode: "non_dcr" });
  const active = mode === "dcr" ? dcr : nonDcr;

  const errors = [...active.errors];
  if (opts?.requireBothTracks) {
    if (!dcr.ok) errors.push(...dcr.errors);
    if (!nonDcr.ok) errors.push(...nonDcr.errors);
  }

  const warnings = [...new Set<PlantPriceWarning>([...dcr.warnings, ...nonDcr.warnings, ...active.warnings])];

  return {
    valid: active.ok && errors.length === 0,
    errors: [...new Set(errors)],
    warnings,
    active,
    dcr,
    nonDcr,
  };
}

/** Blocks proposal generation when active mode price is missing from the catalog table. */
export function proposalPricingBlocksGeneration(config: ResidentialProposalConfig): string | null {
  const v = validateProposalPricing(config);
  return v.valid ? null : v.errors[0] ?? "Complete Smart Catalog pricing before generating.";
}

/** Blocks proposal generation when shared catalog price is missing for kW × mode. */
export function proposalPricingBlocksFromSharedCatalog(
  catalog: ResidentialBrandCatalog | null | undefined,
  kw: number,
  mode: PlantPricingMode,
  brandId?: string
): string | null {
  if (!catalog?.entries?.length) return null;
  const result = resolvePlantPrice({ catalog, brandId, kw, mode });
  return result.ok ? null : result.errors[0] ?? "Complete Smart Catalog pricing before generating.";
}

/** Optional engine fallback — only for legacy rows without brandCatalog. */
export function resolvePlantPriceFromConfigOrFallback(
  config: ResidentialProposalConfig
): number {
  const resolved = resolvePlantPriceFromConfig(config);
  if (resolved.ok) return resolved.plantGrossInr;
  return computeGrossSystemCostInr(config.solar.plantCapacityKw);
}
