/**
 * Requirement-based residential solar configuration (ppt_input.residentialConfig).
 * Simpler than commercial twin-track BOM — homeowner-friendly fields.
 */

import { z } from "zod";
import { PANEL_CATALOG, DEFAULT_PANEL_TECHNOLOGY } from "@/lib/commercial-panel-catalog";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import { defaultResidentialTrackCompare } from "@/lib/residential-track-compare";

export const residentialRoofTypeSchema = z.enum(["flat", "slope", "mixed", "unknown"]);
export const residentialBudgetRangeSchema = z.enum(["economy", "balanced", "premium"]);
export const residentialSubsidyPreferenceSchema = z.enum(["maximize", "standard", "none"]);
export const residentialPanelTrackSchema = z.enum(["dcr", "non_dcr"]);

export const residentialSolarSchema = z.object({
  plantCapacityKw: z.number().min(0.5).max(10000),
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
  kw: z.number().min(0.5).max(10000),
  /** DCR complete plant gross (₹) — primary field. */
  priceInr: z.number().min(0),
  /** Non-DCR complete plant gross (₹) — enter manually per kW row. */
  nonDcrPriceInr: z.number().min(0).default(0),
  /** Canonical ₹/Wp (DCR) — derived by pricing engine; used for quotes & snapshots. */
  ratePerWpInr: z.number().min(0).max(500).optional(),
  /** Canonical ₹/Wp (Non-DCR) — derived from nonDcrPriceInr when set. */
  nonDcrRatePerWpInr: z.number().min(0).max(500).optional(),
});

export const residentialDiscountSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum(["percent", "fixed_inr"]).default("percent"),
  value: z.number().min(0).default(0),
});

export const residentialConnectionPhaseSchema = z.enum(["single_phase", "three_phase"]);

export const residentialPhaseSurchargeSchema = z.object({
  enabled: z.boolean().default(false),
  amountInr: z.number().min(0).default(0),
});

export const residentialBrandOptionSchema = z.object({
  brand: z.string().min(1).max(80),
  brandId: z.string().max(40).optional(),
});

/** Legacy ids `polycab` / `havells` or custom installer-added names. */
export const residentialWireBrandSchema = z.string().min(1).max(80);

/** One row: same kW compared across Non-DCR vs DCR gross system cost. */
export const residentialTrackCompareTierSchema = z.object({
  kw: z.number().min(0.5).max(100),
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
  kwTiers: z.array(residentialKwTierSchema).max(128).optional(),
});

export const residentialBrandCatalogSchema = z.object({
  activeBrandId: z.string().max(40).optional(),
  entries: z.array(residentialBrandCatalogEntrySchema).max(16).optional(),
  /** Installer-added inverter names — shown on next proposal. */
  inverterPresets: z.array(z.string().min(1).max(80)).max(32).optional(),
  /** Installer-added DC/AC wire brands — shown on next proposal. */
  wirePresets: z.array(z.string().min(1).max(80)).max(32).optional(),
  /** Installer-edited module Wp chips — shown on next proposal. */
  moduleWattPresets: z.array(z.number().int().min(100).max(900)).max(16).optional(),
  /** Last-used equipment picks — pre-selected on the next proposal (residential + commercial). */
  equipmentDefaults: z
    .object({
      panelBrandOptions: z.array(residentialBrandOptionSchema).max(32).optional(),
      inverterBrandOptions: z.array(residentialBrandOptionSchema).max(32).optional(),
      wireBrandOptions: z.array(residentialWireBrandSchema).max(32).optional(),
      moduleWatt: z.number().int().min(100).max(900).optional(),
      panelTechnology: z.string().max(80).optional(),
      panelTrack: residentialPanelTrackSchema.optional(),
      primaryBrandId: z.string().max(40).optional(),
      primaryBrand: z.string().max(80).optional(),
      connectionPhase: residentialConnectionPhaseSchema.optional(),
      threePhaseSurchargeInr: z.number().min(0).max(500_000).optional(),
    })
    .optional(),
});

export const residentialTrackCompareSchema = z.object({
  enabled: z.boolean().default(false),
  tiers: z.array(residentialTrackCompareTierSchema).max(32).optional(),
  showPolicyNote: z.boolean().default(true),
  /** Brand used for DCR vs Non-DCR rows (synced from smart catalog). */
  compareBrandId: z.string().max(40).optional(),
});

/** Side-by-side two panel brands — pricing from Smart catalog per brand. */
export const residentialBrandCompareSchema = z.object({
  enabled: z.boolean().default(false),
  brandIdA: z.string().max(40).optional(),
  brandIdB: z.string().max(40).optional(),
});

export const residentialPricingSchema = z.object({
  kwTiers: z.array(residentialKwTierSchema).max(128).optional(),
  panelTechnology: z.string().max(80).optional(),
  /** Editable Wp chips in proposal builder (residential + commercial). */
  moduleWattPresets: z.array(z.number().int().min(100).max(900)).max(16).optional(),
  discount: residentialDiscountSchema.optional(),
  /** Supply connection phase — drives three-phase surcharge reminder. */
  connectionPhase: residentialConnectionPhaseSchema.optional(),
  /** Manual three-phase extra charge (installer-entered ₹ only). */
  phaseSurcharge: residentialPhaseSurchargeSchema.optional(),
  /** Legacy primary wire; kept in sync with first entry of wireBrandOptions. */
  wireBrand: residentialWireBrandSchema.optional(),
  /** DC/AC wire brands on proposal — selected items appear on BOM & deck. */
  wireBrandOptions: z.array(residentialWireBrandSchema).max(32).optional(),
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
  /** Panel brands shown on proposal (any one may be installed). */
  panelBrandOptions: z.array(residentialBrandOptionSchema).max(32).optional(),
  /** Inverter brands on proposal — no fixed cap (installer presets + selections). */
  inverterBrandOptions: z.array(residentialBrandOptionSchema).max(32).optional(),
  /** Per-brand DCR + Non-DCR kW tier catalog (manual plant gross per row). */
  brandCatalog: residentialBrandCatalogSchema.optional(),
  /** Side-by-side Non-DCR vs DCR gross prices (shared kW rows) for web proposal */
  trackCompare: residentialTrackCompareSchema.optional(),
  /** Compare two panel brands at proposal kW (Smart catalog pricing). */
  brandCompare: residentialBrandCompareSchema.optional(),
  notes: z.string().max(600).optional(),
  /** CRM / requirement customer connection — drives PM Surya Ghar eligibility. */
  connectionType: z.string().max(40).optional(),
  /** Builder path: bill upload vs requirement sizing */
  inputMode: z.enum(["bill", "requirement"]).optional(),
  /** `rate_card` = central More → Rate card; `customer_override` = prices only on this proposal. */
  pricingSource: z.enum(["rate_card", "customer_override"]).optional(),
});

export type ResidentialSolar = z.infer<typeof residentialSolarSchema>;
export type ResidentialProposalConfig = z.infer<typeof residentialProposalConfigSchema>;
export type ResidentialPanelTrack = z.infer<typeof residentialPanelTrackSchema>;
export type ResidentialKwTier = z.infer<typeof residentialKwTierSchema>;
export type ResidentialDiscount = z.infer<typeof residentialDiscountSchema>;
export type ResidentialConnectionPhase = z.infer<typeof residentialConnectionPhaseSchema>;
export type ResidentialPhaseSurcharge = z.infer<typeof residentialPhaseSurchargeSchema>;
export type ResidentialBrandOption = z.infer<typeof residentialBrandOptionSchema>;
export type ResidentialWireBrand = z.infer<typeof residentialWireBrandSchema>;
export type ResidentialTrackCompareTier = z.infer<typeof residentialTrackCompareTierSchema>;
export type ResidentialTrackCompare = z.infer<typeof residentialTrackCompareSchema>;
export type ResidentialBrandCompare = z.infer<typeof residentialBrandCompareSchema>;
export type ResidentialBrandCatalogEntry = z.infer<typeof residentialBrandCatalogEntrySchema>;
export type ResidentialBrandCatalog = z.infer<typeof residentialBrandCatalogSchema>;
export type InstallerEquipmentDefaults = NonNullable<ResidentialBrandCatalog["equipmentDefaults"]>;

/** Default kW → gross price table for residential requirement proposals. */
export function defaultResidentialKwTiers(): ResidentialKwTier[] {
  const kws = [3, 5, 6, 7, 8, 9, 10];
  return kws.map((kw) => ({
    kw,
    priceInr: computeGrossSystemCostInr(kw),
    nonDcrPriceInr: 0,
  }));
}

function defaultRate(brandId: string, watt: number, track: "DCR" | "NON_DCR"): number {
  const hit = PANEL_CATALOG.find(
    (e) => e.brandId === brandId && e.watt === watt && e.panelType === track
  );
  if (hit) return hit.ratePerWpInr;
  return track === "DCR" ? 42 : 38;
}

export function defaultResidentialConfig(plantKw = 5): ResidentialProposalConfig {
  const kw = Math.max(1, Math.min(10000, plantKw));
  const primary = { brandId: "adani", brand: "Adani Solar" };
  return {
    inputMode: "requirement",
    solar: {
      plantCapacityKw: kw,
      panelTrack: "dcr",
      brand: primary.brand,
      brandId: primary.brandId,
      watt: 550,
      technology: DEFAULT_PANEL_TECHNOLOGY,
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
      panelTechnology: DEFAULT_PANEL_TECHNOLOGY,
      wireBrand: "polycab",
      wireBrandOptions: ["polycab", "havells"],
      discount: { enabled: false, type: "percent", value: 0 },
    },
    panelBrandOptions: [
      primary,
      { brandId: "waaree", brand: "Waaree" },
      { brandId: "gautam", brand: "Gautam Solar" },
    ],
    inverterBrandOptions: [
      { brand: "Growatt" },
      { brand: "Deye" },
    ],
    trackCompare: {
      ...defaultResidentialTrackCompare(false),
      compareBrandId: primary.brandId,
    },
    brandCompare: {
      enabled: false,
      brandIdA: primary.brandId,
      brandIdB: "waaree",
    },
  };
}

export const PANEL_PROPOSAL_BRAND_MAX = 32;
export const INVERTER_PROPOSAL_BRAND_MAX = 32;
export const WIRE_PROPOSAL_BRAND_MAX = 32;

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
