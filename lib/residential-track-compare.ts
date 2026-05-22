import { computeGrossSystemCostInr } from "@/lib/solar-engine";
import type {
  ResidentialProposalConfig,
  ResidentialTrackCompare,
  ResidentialTrackCompareTier,
} from "@/lib/residential-requirements-schema";

export function defaultResidentialTrackCompareTiers(
  sizes: number[] = [8, 10]
): ResidentialTrackCompareTier[] {
  return sizes.map((kw) => {
    const base = computeGrossSystemCostInr(kw);
    return {
      kw,
      nonDcrGrossInr: Math.round(base * 0.94),
      dcrGrossInr: Math.round(base * 1.1),
      visible: true,
    };
  });
}

export function defaultResidentialTrackCompare(
  enabled = false
): ResidentialTrackCompare {
  return {
    enabled,
    tiers: defaultResidentialTrackCompareTiers([8, 10]),
    showPolicyNote: true,
  };
}

export type NormalizedResidentialTrackCompare = ResidentialTrackCompare & {
  tiers: ResidentialTrackCompareTier[];
};

export function normalizeResidentialTrackCompare(
  raw: ResidentialTrackCompare | undefined
): NormalizedResidentialTrackCompare {
  const tiers =
    raw?.tiers?.length && raw.tiers.length > 0
      ? raw.tiers.map((t) => ({
          kw: Math.max(1, Math.min(100, t.kw)),
          nonDcrGrossInr: Math.max(0, Math.round(t.nonDcrGrossInr)),
          dcrGrossInr: Math.max(0, Math.round(t.dcrGrossInr)),
          visible: t.visible !== false,
        }))
      : defaultResidentialTrackCompareTiers([8, 10]);

  return {
    enabled: raw?.enabled === true,
    tiers,
    showPolicyNote: raw?.showPolicyNote !== false,
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
