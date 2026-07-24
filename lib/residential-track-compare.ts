import {
  getCompareCatalogEntry,
  resolveCompareTierFromCatalog,
  trackCompareTiersFromCatalogEntry,
} from "@/lib/residential-brand-catalog";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import type {
  ResidentialProposalConfig,
  ResidentialTrackCompare,
  ResidentialTrackCompareTier,
} from "@/lib/residential-requirements-schema";

export function defaultResidentialTrackCompareTiers(
  sizes: number[] = [8, 10],
  config?: ResidentialProposalConfig
): ResidentialTrackCompareTier[] {
  const entry = config ? getCompareCatalogEntry(config) : null;
  if (entry?.kwTiers?.length) {
    const filtered = entry.kwTiers.filter((t) => sizes.includes(t.kw));
    const use =
      filtered.length > 0
        ? filtered
        : entry.kwTiers.slice(0, Math.max(sizes.length, 2));
    return trackCompareTiersFromCatalogEntry({ ...entry, kwTiers: use });
  }
  return sizes.map((kw) => {
    const dcrGrossInr = Math.round(computeGrossSystemCostInr(kw));
    return {
      kw,
      dcrGrossInr,
      nonDcrGrossInr: 0,
      visible: true,
    };
  });
}

export function defaultResidentialTrackCompare(
  enabled = false,
  config?: ResidentialProposalConfig
): ResidentialTrackCompare {
  return {
    enabled,
    tiers: defaultResidentialTrackCompareTiers([8, 10], config),
    showPolicyNote: true,
    compareBrandId: config?.brandCatalog?.activeBrandId,
  };
}

export type NormalizedResidentialTrackCompare = ResidentialTrackCompare & {
  tiers: ResidentialTrackCompareTier[];
};

export function normalizeResidentialTrackCompare(
  raw: ResidentialTrackCompare | undefined,
  config?: ResidentialProposalConfig
): NormalizedResidentialTrackCompare {
  const entry = config ? getCompareCatalogEntry(config) : null;
  const tiers =
    raw?.tiers?.length && raw.tiers.length > 0
      ? raw.tiers.map((t) => {
          const base = {
            kw: Math.round(Math.max(0.5, Math.min(10000, t.kw)) * 10) / 10,
            nonDcrGrossInr: Math.max(0, Math.round(t.nonDcrGrossInr)),
            dcrGrossInr: Math.max(0, Math.round(t.dcrGrossInr)),
            visible: t.visible !== false,
          };
          if (entry) {
            return resolveCompareTierFromCatalog(entry, base.kw, base.visible);
          }
          return base;
        })
      : defaultResidentialTrackCompareTiers([8, 10], config);

  return {
    enabled: raw?.enabled === true,
    tiers,
    showPolicyNote: raw?.showPolicyNote !== false,
    compareBrandId: raw?.compareBrandId,
  };
}

export function mergeTrackCompareIntoConfig(
  config: ResidentialProposalConfig
): ResidentialProposalConfig {
  return {
    ...config,
    trackCompare: normalizeResidentialTrackCompare(config.trackCompare),
  };
}

export function lookupTierForPlantKw(
  compare: ResidentialTrackCompare | undefined,
  plantKw: number
): ResidentialTrackCompareTier | null {
  const tiers = compare?.tiers ?? [];
  if (!tiers.length) return null;
  const exact = tiers.find((t) => t.kw === plantKw);
  if (exact) return exact;
  let best: ResidentialTrackCompareTier | null = null;
  for (const t of tiers) {
    if (t.kw <= plantKw) best = t;
  }
  return best ?? tiers[0] ?? null;
}
