/**
 * Residential smart brand catalog — DCR ₹/Wp + kW tier prices per brand.
 * Non-DCR = 70% of DCR (30% lower) for rates and kW gross prices.
 */

import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import {
  defaultResidentialKwTiers,
  type ResidentialKwTier,
  type ResidentialProposalConfig,
  type ResidentialSolar,
  type ResidentialTrackCompareTier,
} from "@/lib/residential-requirements-schema";

/** Non-DCR is 30% below DCR (70% of DCR value). */
export const RESIDENTIAL_NON_DCR_FACTOR = 0.7;

export type ResidentialBrandCatalogEntry = {
  brandId: string;
  brand: string;
  /** Required — DCR ₹ per Wp for this brand. */
  dcrRatePerWpInr: number;
  /** Per-kW gross system price (DCR track). Non-DCR derived on read. */
  kwTiers?: ResidentialKwTier[];
};

export function normalizeCatalogEntry(
  entry: ResidentialBrandCatalogEntry
): ResidentialBrandCatalogEntry & { kwTiers: ResidentialKwTier[] } {
  return { ...entry, kwTiers: entry.kwTiers ?? [] };
}

export type ResidentialBrandCatalog = NonNullable<ResidentialProposalConfig["brandCatalog"]>;

export const DEFAULT_RESIDENTIAL_CATALOG_BRANDS: Omit<
  ResidentialBrandCatalogEntry,
  "kwTiers"
>[] = [
  { brandId: "adani", brand: "Adani Solar", dcrRatePerWpInr: 42 },
  { brandId: "waaree", brand: "Waaree", dcrRatePerWpInr: 40 },
  { brandId: "gautam", brand: "Gautam Solar", dcrRatePerWpInr: 41 },
];

export function nonDcrRateFromDcr(dcrRatePerWp: number): number {
  const r = Math.max(0, dcrRatePerWp) * RESIDENTIAL_NON_DCR_FACTOR;
  return Math.round(r * 100) / 100;
}

export function nonDcrGrossFromDcrGross(dcrGrossInr: number): number {
  return Math.round(Math.max(0, dcrGrossInr) * RESIDENTIAL_NON_DCR_FACTOR);
}

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

export function lookupDcrKwGrossInr(
  entry: ResidentialBrandCatalogEntry | null,
  kw: number,
  fallbackTiers?: ResidentialKwTier[]
): number | null {
  const tiers = entry?.kwTiers?.length ? entry.kwTiers : fallbackTiers;
  if (!tiers?.length) return null;
  const sorted = [...tiers].sort((a, b) => a.kw - b.kw);
  const exact = sorted.find((t) => t.kw === kw);
  if (exact && exact.priceInr > 0) return exact.priceInr;
  let best: ResidentialKwTier | null = null;
  for (const t of sorted) {
    if (t.kw <= kw && t.priceInr > 0) best = t;
  }
  return best?.priceInr ?? sorted.find((t) => t.priceInr > 0)?.priceInr ?? null;
}

export function lookupKwGrossForTrack(
  entry: ResidentialBrandCatalogEntry | null,
  kw: number,
  track: ResidentialSolar["panelTrack"],
  fallbackTiers?: ResidentialKwTier[]
): number | null {
  const dcr = lookupDcrKwGrossInr(entry, kw, fallbackTiers);
  if (dcr == null) return null;
  return track === "non_dcr" ? nonDcrGrossFromDcrGross(dcr) : dcr;
}

export function trackCompareTiersFromCatalogEntry(
  entry: ResidentialBrandCatalogEntry | null,
  existing?: ResidentialTrackCompareTier[]
): ResidentialTrackCompareTier[] {
  if (!entry?.kwTiers?.length) {
    return existing?.length
      ? existing.map((t) => ({
          ...t,
          nonDcrGrossInr: nonDcrGrossFromDcrGross(t.dcrGrossInr),
        }))
      : [];
  }
  const visibleByKw = new Map(
    (existing ?? []).map((t) => [t.kw, t.visible !== false] as const)
  );
  return [...entry.kwTiers]
    .sort((a, b) => a.kw - b.kw)
    .map((tier) => {
      const dcrGrossInr = Math.max(0, Math.round(tier.priceInr));
      return {
        kw: tier.kw,
        dcrGrossInr,
        nonDcrGrossInr: nonDcrGrossFromDcrGross(dcrGrossInr),
        visible: visibleByKw.get(tier.kw) ?? true,
      };
    });
}

export function rateForSolarTrack(
  entry: ResidentialBrandCatalogEntry,
  track: ResidentialSolar["panelTrack"]
): number {
  const dcr = Math.max(0, entry.dcrRatePerWpInr);
  return track === "non_dcr" ? nonDcrRateFromDcr(dcr) : dcr;
}

function catalogEntries(catalog: ResidentialBrandCatalog | undefined): ResidentialBrandCatalogEntry[] {
  return catalog?.entries ?? [];
}

/** Apply active catalog brand → solar + pricing.kwTiers (keeps other fields). */
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
  const ratePerWpInr = rateForSolarTrack(e, track);
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
    pricing: {
      ...config.pricing,
      kwTiers: e.kwTiers.map((t) => ({ ...t })),
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
          kwTiers: patch.kwTiers ?? e.kwTiers ?? [],
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
  const seedTiers = (active?.kwTiers ?? []).map((t) => ({ ...t }));
  const tiers = seedTiers.length > 0 ? seedTiers : defaultResidentialKwTiers();
  const entry: ResidentialBrandCatalogEntry = {
    brandId,
    brand,
    dcrRatePerWpInr: 40,
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
    const list = catalogEntries(catalog);
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
  const dcrRate =
    config.solar.panelTrack === "non_dcr"
      ? nonDcrRateFromDcr(config.solar.ratePerWpInr) > 0
        ? config.solar.ratePerWpInr / RESIDENTIAL_NON_DCR_FACTOR
        : 42
      : config.solar.ratePerWpInr || 42;
  const tiers = config.pricing?.kwTiers?.length
    ? config.pricing.kwTiers.map((t) => ({ ...t }))
    : defaultResidentialKwTiers();

  const migrated: ResidentialBrandCatalogEntry = {
    brandId,
    brand: config.solar.brand || "Adani Solar",
    dcrRatePerWpInr: Math.round(dcrRate * 100) / 100,
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
