/**
 * Requirement-based residential solar configuration (ppt_input.residentialConfig).
 * Simpler than commercial twin-track BOM — homeowner-friendly fields.
 */

import { z } from "zod";
import { PANEL_CATALOG } from "@/lib/commercial-panel-catalog";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import { defaultResidentialTrackCompare } from "@/lib/residential-track-compare";

export const residentialRoofTypeSchema = z.enum(["flat", "slope", "mixed", "unknown"]);
export const residentialBudgetRangeSchema = z.enum(["economy", "balanced", "premium"]);
export const residentialSubsidyPreferenceSchema = z.enum(["maximize", "standard", "none"]);
export const residentialPanelTrackSchema = z.enum(["dcr", "non_dcr"]);

export const residentialSolarSchema = z.object({
  plantCapacityKw: z.number().min(0.5).max(50),
  panelTrack: residentialPanelTrackSchema.default("dcr"),
  brand: z.string().max(80),
  brandId: z.string().max(40).optional(),
  watt: z.number().min(100).max(900),
  technology: z.string().max(80).optional(),
  ratePerWpInr: z.number().min(0).max(500),
  /** When set, overrides auto module count from plant kW ÷ watt. */
  moduleCountOverride: z.number().min(0).max(500).optional(),
});

export const residentialFinancingSchema = z.object({
  enabled: z.boolean().default(true),
  interestRatePct: z.number().min(0).max(30).default(10.5),
  selectedTenureYears: z.number().int().min(1).max(20).default(5),
  tenuresYears: z.array(z.number().int().min(1).max(20)).max(6).optional(),
  downPaymentInr: z.number().min(0).optional(),
});

export const residentialBatterySchema = z.object({
  required: z.boolean().default(false),
  capacityKwh: z.number().min(0).max(100).optional(),
});

export const residentialSubsidySchema = z.object({
  preference: residentialSubsidyPreferenceSchema.default("maximize"),
  /** Installer override; when omitted, deck uses PM Surya Ghar estimate from system kW. */
  estimateInr: z.number().min(0).optional(),
});

export const residentialKwTierSchema = z.object({
  kw: z.number().min(1).max(100),
  priceInr: z.number().min(0),
});

export const residentialDiscountSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum(["percent", "fixed_inr"]).default("percent"),
  value: z.number().min(0).default(0),
});

export const residentialBrandOptionSchema = z.object({
  brand: z.string().min(1).max(80),
  brandId: z.string().max(40).optional(),
});

export const residentialWireBrandSchema = z.enum(["havells", "polycab"]);

/** One row: same kW compared across Non-DCR vs DCR gross system cost. */
export const residentialTrackCompareTierSchema = z.object({
  kw: z.number().min(1).max(100),
  nonDcrGrossInr: z.number().min(0),
  dcrGrossInr: z.number().min(0),
  /** When false, row stays in BOM workspace but is omitted from the web proposal table. */
  visible: z.boolean().default(true),
});

export const residentialBrandCatalogEntrySchema = z.object({
  brandId: z.string().max(40),
  brand: z.string().min(1).max(80),
  /** Legacy; pricing uses kW tier gross plant cost only. */
  dcrRatePerWpInr: z.number().min(0).max(500).optional(),
  kwTiers: z.array(residentialKwTierSchema).max(24).optional(),
});

export const residentialBrandCatalogSchema = z.object({
  activeBrandId: z.string().max(40).optional(),
  entries: z.array(residentialBrandCatalogEntrySchema).max(16).optional(),
});

export const residentialTrackCompareSchema = z.object({
  enabled: z.boolean().default(false),
  tiers: z.array(residentialTrackCompareTierSchema).max(32).optional(),
  showPolicyNote: z.boolean().default(true),
  /** Brand used for DCR vs Non-DCR rows (synced from smart catalog). */
  compareBrandId: z.string().max(40).optional(),
});

export const residentialPricingSchema = z.object({
  kwTiers: z.array(residentialKwTierSchema).max(24).optional(),
  panelTechnology: z.string().max(80).optional(),
  discount: residentialDiscountSchema.optional(),
  /** Legacy primary wire; kept in sync with first entry of wireBrandOptions. */
  wireBrand: residentialWireBrandSchema.optional(),
  /** Up to 2 DC/AC wire brands on proposal & BOM. */
  wireBrandOptions: z.array(residentialWireBrandSchema).max(2).optional(),
});

export const residentialProposalConfigSchema = z.object({
  solar: residentialSolarSchema,
  roofType: residentialRoofTypeSchema.default("unknown"),
  budgetRange: residentialBudgetRangeSchema.default("balanced"),
  battery: residentialBatterySchema.optional(),
  subsidy: residentialSubsidySchema.optional(),
  financing: residentialFinancingSchema.optional(),
  /** kW-wise system price, technology, wire brand, per-customer discount */
  pricing: residentialPricingSchema.optional(),
  /** Up to 3 panel brands shown on proposal (any one may be installed) */
  panelBrandOptions: z.array(residentialBrandOptionSchema).max(3).optional(),
  /** Up to 2 inverter brands */
  inverterBrandOptions: z.array(residentialBrandOptionSchema).max(2).optional(),
  /** Per-brand DCR rates + kW tier catalog (Non-DCR = 70% of DCR). */
  brandCatalog: residentialBrandCatalogSchema.optional(),
  /** Side-by-side Non-DCR vs DCR gross prices (shared kW rows) for web proposal */
  trackCompare: residentialTrackCompareSchema.optional(),
  notes: z.string().max(600).optional(),
  /** CRM / requirement customer connection — drives PM Surya Ghar eligibility. */
  connectionType: z.string().max(40).optional(),
  /** Builder path: bill upload vs requirement sizing */
  inputMode: z.enum(["bill", "requirement"]).optional(),
});

export type ResidentialSolar = z.infer<typeof residentialSolarSchema>;
export type ResidentialProposalConfig = z.infer<typeof residentialProposalConfigSchema>;
export type ResidentialPanelTrack = z.infer<typeof residentialPanelTrackSchema>;
export type ResidentialKwTier = z.infer<typeof residentialKwTierSchema>;
export type ResidentialDiscount = z.infer<typeof residentialDiscountSchema>;
export type ResidentialBrandOption = z.infer<typeof residentialBrandOptionSchema>;
export type ResidentialWireBrand = z.infer<typeof residentialWireBrandSchema>;
export type ResidentialTrackCompareTier = z.infer<typeof residentialTrackCompareTierSchema>;
export type ResidentialTrackCompare = z.infer<typeof residentialTrackCompareSchema>;
export type ResidentialBrandCatalogEntry = z.infer<typeof residentialBrandCatalogEntrySchema>;
export type ResidentialBrandCatalog = z.infer<typeof residentialBrandCatalogSchema>;

/** Default kW → gross price table for residential requirement proposals. */
export function defaultResidentialKwTiers(): ResidentialKwTier[] {
  const kws = [3, 5, 6, 7, 8, 9, 10];
  return kws.map((kw) => ({ kw, priceInr: computeGrossSystemCostInr(kw) }));
}

function defaultRate(brandId: string, watt: number, track: "DCR" | "NON_DCR"): number {
  const hit = PANEL_CATALOG.find(
    (e) => e.brandId === brandId && e.watt === watt && e.panelType === track
  );
  if (hit) return hit.ratePerWpInr;
  return track === "DCR" ? 42 : 38;
}

export function defaultResidentialConfig(plantKw = 5): ResidentialProposalConfig {
  const kw = Math.max(1, Math.min(50, plantKw));
  const primary = { brandId: "adani", brand: "Adani Solar" };
  return {
    inputMode: "requirement",
    solar: {
      plantCapacityKw: kw,
      panelTrack: "dcr",
      brand: primary.brand,
      brandId: primary.brandId,
      watt: 550,
      technology: "Mono PERC",
      ratePerWpInr: defaultRate("adani", 550, "DCR"),
    },
    roofType: "flat",
    budgetRange: "balanced",
    battery: { required: false },
    subsidy: { preference: "maximize" },
    financing: {
      enabled: true,
      interestRatePct: 10.5,
      selectedTenureYears: 5,
      tenuresYears: [3, 5, 7, 10],
    },
    pricing: {
      kwTiers: defaultResidentialKwTiers(),
      panelTechnology: "Mono PERC",
      wireBrand: "polycab",
      wireBrandOptions: ["polycab", "havells"],
      discount: { enabled: false, type: "percent", value: 0 },
    },
    panelBrandOptions: [
      primary,
      { brandId: "waaree", brand: "Waaree" },
      { brandId: "vikram", brand: "Vikram Solar" },
    ],
    inverterBrandOptions: [
      { brand: "Growatt" },
      { brand: "Deye" },
    ],
    trackCompare: {
      ...defaultResidentialTrackCompare(false),
      compareBrandId: primary.brandId,
    },
  };
}

export const RESIDENTIAL_BRAND_PRESETS = [
  { brandId: "adani", brand: "Adani Solar", watt: 550 },
  { brandId: "waaree", brand: "Waaree", watt: 540 },
  { brandId: "gautam", brand: "Gautam Solar", watt: 550 },
  { brandId: "vikram", brand: "Vikram Solar", watt: 560 },
  { brandId: "longi", brand: "LONGi", watt: 575 },
] as const;

export const RESIDENTIAL_INVERTER_PRESETS = [
  "Growatt",
  "Deye",
  "Solis",
  "Fronius",
  "GoodWe",
  "Havells",
] as const;

export const RESIDENTIAL_WATT_PRESETS = [540, 550, 575, 625] as const;

export const RESIDENTIAL_WIRE_PRESETS = ["polycab", "havells"] as const;
