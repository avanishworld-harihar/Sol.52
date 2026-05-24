/**
 * Residential smart brand catalog — DCR + Non-DCR plant gross (₹) per kW tier, entered manually.
 */

import {
  plantGrossForTrackValues,
  plantGrossFromRatePerWp,
  ratePerWpFromPlantGross,
} from "@/lib/pricing-engine";
import { moduleCountForResidential } from "@/lib/residential-solar-engine";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import {
  defaultResidentialKwTiers,
  type ResidentialKwTier,
  type ResidentialProposalConfig,
  type ResidentialSolar,
  type ResidentialTrackCompareTier,
} from "@/lib/residential-requirements-schema";

export type ResidentialBrandCatalogEntry = {
  brandId: string;
  brand: string;
  /** Legacy field — catalog pricing is kW gross plant cost only. */
  dcrRatePerWpInr?: number;
  /** Per-kW complete plant gross — DCR and Non-DCR entered separately. */
  kwTiers?: ResidentialKwTier[];
};

export function normalizeCatalogEntry(
  entry: ResidentialBrandCatalogEntry
): ResidentialBrandCatalogEntry & { kwTiers: ResidentialKwTier[] } {
  return { ...entry, kwTiers: entry.kwTiers ?? [] };
}

export type ResidentialBrandCatalog = NonNullable<ResidentialProposalConfig["brandCatalog"]>;

export const DEFAULT_RESIDENTIAL_CATALOG_BRANDS: Omit<ResidentialBrandCatalogEntry, "kwTiers">[] = [
  { brandId: "adani", brand: "Adani Solar" },
  { brandId: "waaree", brand: "Waaree" },
  { brandId: "gautam", brand: "Gautam Solar" },
];

export function defaultCatalogEntries(): ResidentialBrandCatalogEntry[] {
  const tiers = defaultResidentialKwTiers();
  return DEFAULT_RESIDENTIAL_CATALOG_BRANDS.map((b) => ({
    ...b,
    kwTiers: tiers.map((t) => ({ ...t })),
  }));
}

export function defaultBrandCatalog(activeBrandId = "adani"): ResidentialBrandCatalog {
  const entries = defaultCatalogEntries();
  return {
    activeBrandId: entries.some((e) => e.brandId === activeBrandId) ? activeBrandId : "adani",
    entries,
  };
}

function slugBrandId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `brand-${Date.now()}`;
}

export function getCatalogEntry(
  catalog:
    | ResidentialBrandCatalog
    | ResidentialProposalConfig["brandCatalog"]
    | undefined,
  brandId: string | undefined
): ResidentialBrandCatalogEntry | null {
  const entries = catalog?.entries;
  if (!entries?.length || !brandId) return null;
  const hit = entries.find((e) => e.brandId === brandId);
  if (!hit) return null;
  return normalizeCatalogEntry(hit);
}

export function getActiveCatalogEntry(
  config: ResidentialProposalConfig
): ResidentialBrandCatalogEntry | null {
  const catalog = config.brandCatalog;
  if (!catalog?.entries?.length) return null;
  const id = catalog.activeBrandId || catalogEntries(catalog)[0]?.brandId;
  return getCatalogEntry(catalog, id);
}

export function getCompareCatalogEntry(config: ResidentialProposalConfig): ResidentialBrandCatalogEntry | null {
  const catalog = config.brandCatalog;
  const compareId =
    config.trackCompare?.compareBrandId?.trim() ||
    catalog?.activeBrandId ||
    catalog?.entries?.[0]?.brandId;
  return getCatalogEntry(catalog, compareId) ?? getActiveCatalogEntry(config);
}

/**
 * Normalize kW tier fields. Plant gross (₹) is canonical — never overwrite entered amounts
 * from derived ₹/Wp (round-trip would drift, e.g. 190000 → 189990 at 3 kW).
 */
export function syncKwTierCanonical(tier: ResidentialKwTier): ResidentialKwTier {
  const next = { ...tier, nonDcrPriceInr: tier.nonDcrPriceInr ?? 0 };
  if (next.priceInr > 0) {
    next.ratePerWpInr = ratePerWpFromPlantGross(next.priceInr, next.kw);
  } else if (next.ratePerWpInr != null && next.ratePerWpInr > 0) {
    next.priceInr = plantGrossFromRatePerWp(next.ratePerWpInr, next.kw);
  }
  if (next.nonDcrPriceInr > 0) {
    next.nonDcrRatePerWpInr = ratePerWpFromPlantGross(next.nonDcrPriceInr, next.kw);
  } else if (next.nonDcrRatePerWpInr != null && next.nonDcrRatePerWpInr > 0) {
    next.nonDcrPriceInr = plantGrossFromRatePerWp(next.nonDcrRatePerWpInr, next.kw);
  }
  return next;
}

function lookupTierGrossInr(
  tiers: ResidentialKwTier[] | undefined,
  kw: number,
  field: "priceInr" | "nonDcrPriceInr"
): number | null {
  if (!tiers?.length) return null;
  const sorted = [...tiers].map(syncKwTierCanonical).sort((a, b) => a.kw - b.kw);
  const exact = sorted.find((t) => t.kw === kw);
  if (exact && exact[field] > 0) return exact[field];
  let best: ResidentialKwTier | null = null;
  for (const t of sorted) {
    if (t.kw <= kw && t[field] > 0) best = t;
  }
  const hit = best ?? sorted.find((t) => t[field] > 0);
  return hit?.[field] ?? null;
}

export function lookupDcrKwGrossInr(
  entry: ResidentialBrandCatalogEntry | null,
  kw: number,
  fallbackTiers?: ResidentialKwTier[]
): number | null {
  const tiers = entry?.kwTiers?.length ? entry.kwTiers : fallbackTiers;
  return lookupTierGrossInr(tiers, kw, "priceInr");
}

export function lookupNonDcrKwGrossInr(
  entry: ResidentialBrandCatalogEntry | null,
  kw: number,
  fallbackTiers?: ResidentialKwTier[]
): number | null {
  const tiers = entry?.kwTiers?.length ? entry.kwTiers : fallbackTiers;
  return lookupTierGrossInr(tiers, kw, "nonDcrPriceInr");
}

export function lookupKwGrossForTrack(
  entry: ResidentialBrandCatalogEntry | null,
  kw: number,
  track: ResidentialSolar["panelTrack"],
  fallbackTiers?: ResidentialKwTier[]
): number | null {
  const dcr = lookupDcrKwGrossInr(entry, kw, fallbackTiers) ?? 0;
  const nonDcr = lookupNonDcrKwGrossInr(entry, kw, fallbackTiers) ?? 0;
  const gross = plantGrossForTrackValues(dcr, nonDcr, track);
  return gross > 0 ? gross : null;
}

export function resolveCompareTierFromCatalog(
  entry: ResidentialBrandCatalogEntry | null,
  kw: number,
  visible = true
): ResidentialTrackCompareTier {
  const dcrGrossInr = Math.max(0, Math.round(lookupDcrKwGrossInr(entry, kw) ?? 0));
  const nonDcrGrossInr = Math.max(0, Math.round(lookupNonDcrKwGrossInr(entry, kw) ?? 0));
  return {
    kw: Math.max(1, Math.min(10000, kw)),
    dcrGrossInr,
    nonDcrGrossInr,
    visible,
  };
}

export function trackCompareTiersFromCatalogEntry(
  entry: ResidentialBrandCatalogEntry | null,
  existing?: ResidentialTrackCompareTier[]
): ResidentialTrackCompareTier[] {
  if (existing?.length) {
    return existing.map((t) =>
      resolveCompareTierFromCatalog(entry, t.kw, t.visible !== false)
    );
  }
  if (!entry?.kwTiers?.length) return [];
  return [...entry.kwTiers]
    .sort((a, b) => a.kw - b.kw)
    .slice(0, 8)
    .map((tier) => resolveCompareTierFromCatalog(entry, tier.kw, true));
}

/** BOM line-item hint only — derived from active kW tier plant gross ÷ module Wp. */
export function impliedRatePerWpFromPlant(
  solar: ResidentialSolar,
  entry: ResidentialBrandCatalogEntry,
  track: ResidentialSolar["panelTrack"] = solar.panelTrack ?? "dcr"
): number {
  const e = normalizeCatalogEntry(entry);
  const gross = lookupKwGrossForTrack(e, solar.plantCapacityKw, track, e.kwTiers);
  if (gross != null && gross > 0) {
    const modules = moduleCountForResidential({ ...solar, panelTrack: track });
    const wp = modules * solar.watt;
    if (wp > 0) return Math.round((gross / wp) * 100) / 100;
  }
  const legacy = e.dcrRatePerWpInr ?? 0;
  if (legacy > 0) return legacy;
  return 40;
}

/** @deprecated Use impliedRatePerWpFromPlant — catalog has no separate ₹/Wp rate. */
export function rateForSolarTrack(
  entry: ResidentialBrandCatalogEntry,
  track: ResidentialSolar["panelTrack"],
  solar?: ResidentialSolar
): number {
  if (solar) return impliedRatePerWpFromPlant(solar, entry, track);
  return entry.dcrRatePerWpInr ?? 40;
}

function catalogEntries(catalog: ResidentialBrandCatalog | undefined): ResidentialBrandCatalogEntry[] {
  return catalog?.entries ?? [];
}

/** Apply active catalog brand → solar fields (pricing matrix lives in brandCatalog only). */
export function applyActiveBrandToConfig(
  config: ResidentialProposalConfig,
  brandId: string
): ResidentialProposalConfig {
  const catalog = ensureBrandCatalog(config).brandCatalog!;
  const entry = getCatalogEntry(catalog, brandId);
  if (!entry) return config;

  const track = config.solar.panelTrack ?? "dcr";
  const nextCatalog = {
    ...catalog,
    activeBrandId: brandId,
    entries: catalog.entries ?? [],
  };

  let next = syncSolarAndPricingFromEntry(
    { ...config, brandCatalog: nextCatalog },
    entry,
    track
  );

  const compareId = next.trackCompare?.compareBrandId ?? brandId;
  if (compareId === brandId || !next.trackCompare?.compareBrandId) {
    next = syncTrackCompareFromBrand(next, brandId);
  }
  return next;
}

export function syncSolarAndPricingFromEntry(
  config: ResidentialProposalConfig,
  entry: ResidentialBrandCatalogEntry,
  track: ResidentialSolar["panelTrack"] = config.solar.panelTrack ?? "dcr"
): ResidentialProposalConfig {
  const e = normalizeCatalogEntry(entry);
  const ratePerWpInr = impliedRatePerWpFromPlant(config.solar, e, track);
  return {
    ...config,
    solar: {
      ...config.solar,
      brand: e.brand,
      brandId: e.brandId,
      panelTrack: track,
      ratePerWpInr,
      moduleCountOverride: undefined,
    },
    panelBrandOptions: upsertPanelBrandOption(config.panelBrandOptions, e),
  };
}

function upsertPanelBrandOption(
  list: ResidentialProposalConfig["panelBrandOptions"],
  entry: ResidentialBrandCatalogEntry
) {
  const cur = list ?? [];
  const key = entry.brandId;
  if (cur.some((p) => (p.brandId ?? p.brand) === key)) return cur;
  return [{ brandId: entry.brandId, brand: entry.brand }, ...cur].slice(0, 3);
}

export function syncTrackCompareFromBrand(
  config: ResidentialProposalConfig,
  brandId: string
): ResidentialProposalConfig {
  const entry = getCatalogEntry(config.brandCatalog, brandId);
  const tiers = trackCompareTiersFromCatalogEntry(entry, config.trackCompare?.tiers);
  return {
    ...config,
    trackCompare: {
      enabled: config.trackCompare?.enabled ?? false,
      showPolicyNote: config.trackCompare?.showPolicyNote !== false,
      compareBrandId: brandId,
      tiers: tiers.length ? tiers : config.trackCompare?.tiers,
    },
  };
}

export function updateCatalogEntry(
  config: ResidentialProposalConfig,
  brandId: string,
  patch: Partial<ResidentialBrandCatalogEntry>
): ResidentialProposalConfig {
  const catalog = ensureBrandCatalog(config).brandCatalog!;
  const entries = catalogEntries(catalog).map((e) =>
    e.brandId === brandId
      ? {
          ...e,
          ...patch,
          brandId: e.brandId,
          kwTiers: (patch.kwTiers ?? e.kwTiers ?? []).map(syncKwTierCanonical),
        }
      : e
  );
  let next: ResidentialProposalConfig = {
    ...config,
    brandCatalog: { ...catalog, entries },
  };
  if (catalog.activeBrandId === brandId) {
    const entry = entries.find((e) => e.brandId === brandId)!;
    next = syncSolarAndPricingFromEntry(next, entry, next.solar.panelTrack ?? "dcr");
    if ((next.trackCompare?.compareBrandId ?? brandId) === brandId) {
      next = syncTrackCompareFromBrand(next, brandId);
    }
  } else if (next.trackCompare?.compareBrandId === brandId) {
    next = syncTrackCompareFromBrand(next, brandId);
  }
  return next;
}

export function addCatalogBrand(
  config: ResidentialProposalConfig,
  brandName: string
): ResidentialProposalConfig {
  const catalog = ensureBrandCatalog(config).brandCatalog!;
  const brand = brandName.trim() || "New brand";
  let brandId = slugBrandId(brand);
  const existing = catalogEntries(catalog);
  if (existing.some((e) => e.brandId === brandId)) {
    brandId = `${brandId}-${existing.length + 1}`;
  }
  const active = getActiveCatalogEntry(config);
  const seedTiers = (active?.kwTiers ?? []).map((t) => syncKwTierCanonical({ ...t }));
  const tiers = seedTiers.length > 0 ? seedTiers : defaultResidentialKwTiers();
  const entry: ResidentialBrandCatalogEntry = {
    brandId,
    brand,
    kwTiers: tiers,
  };
  return {
    ...config,
    brandCatalog: {
      ...catalog,
      entries: [...existing, entry],
    },
  };
}

export function removeCatalogBrand(
  config: ResidentialProposalConfig,
  brandId: string
): ResidentialProposalConfig {
  const catalog = ensureBrandCatalog(config).brandCatalog!;
  const list = catalogEntries(catalog);
  if (list.length <= 1) return config;
  const entries = list.filter((e) => e.brandId !== brandId);
  let activeBrandId = catalog.activeBrandId;
  if (activeBrandId === brandId) activeBrandId = entries[0]!.brandId;
  let next: ResidentialProposalConfig = {
    ...config,
    brandCatalog: { activeBrandId, entries },
  };
  return applyActiveBrandToConfig(next, activeBrandId || entries[0]!.brandId);
}

/** Build catalog from legacy solar + pricing when missing. */
export function ensureBrandCatalog(config: ResidentialProposalConfig): ResidentialProposalConfig {
  if (config.brandCatalog?.entries?.length) {
    const catalog = config.brandCatalog;
    const list = catalogEntries(catalog).map((e) => ({
      ...e,
      kwTiers: (e.kwTiers ?? []).map((t) =>
        syncKwTierCanonical({ ...t, nonDcrPriceInr: t.nonDcrPriceInr ?? 0 })
      ),
    }));
    const activeBrandId =
      catalog.activeBrandId && list.some((e) => e.brandId === catalog.activeBrandId)
        ? catalog.activeBrandId
        : list[0]!.brandId;
    return {
      ...config,
      brandCatalog: { ...catalog, activeBrandId, entries: list },
      trackCompare: {
        enabled: config.trackCompare?.enabled === true,
        showPolicyNote: config.trackCompare?.showPolicyNote !== false,
        tiers: config.trackCompare?.tiers,
        compareBrandId:
          config.trackCompare?.compareBrandId?.trim() || activeBrandId,
      },
    };
  }

  const brandId = config.solar.brandId ?? slugBrandId(config.solar.brand || "adani");
  const tiers = config.pricing?.kwTiers?.length
    ? config.pricing.kwTiers.map((t) => syncKwTierCanonical({ ...t, nonDcrPriceInr: t.nonDcrPriceInr ?? 0 }))
    : defaultResidentialKwTiers();

  const migrated: ResidentialBrandCatalogEntry = {
    brandId,
    brand: config.solar.brand || "Adani Solar",
    kwTiers: tiers,
  };

  const presets = defaultCatalogEntries().filter((e) => e.brandId !== brandId);
  const catalog: ResidentialBrandCatalog = {
    activeBrandId: brandId,
    entries: [migrated, ...presets],
  };

  return {
    ...config,
    brandCatalog: catalog,
    trackCompare: {
      enabled: config.trackCompare?.enabled === true,
      showPolicyNote: config.trackCompare?.showPolicyNote !== false,
      tiers: config.trackCompare?.tiers,
      compareBrandId: config.trackCompare?.compareBrandId ?? brandId,
    },
  };
}

export function seedTierPriceFromEngine(kw: number): number {
  return computeGrossSystemCostInr(kw);
}
