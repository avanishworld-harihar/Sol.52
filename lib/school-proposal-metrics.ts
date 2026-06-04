import type { ProposalDeckSummary } from "@/lib/proposal-ppt";

export type SchoolImpactMetrics = {
  annualCo2Kg: number;
  lifetimeCo2Tons: number;
  treeEquivalent: number;
  annualGenKwh: number;
  lifetimeGenMwh: number;
  impactScore: number;
  sustainabilityBadge: "Gold" | "Silver" | "Bronze";
};

/** Derive school sustainability KPIs from existing deck environmental + generation data. */
export function buildSchoolImpactMetrics(summary: ProposalDeckSummary): SchoolImpactMetrics {
  const env = summary.environmental;
  const annualGenKwh = summary.annualGen > 0 ? summary.annualGen : env.annualGenUnits;
  const annualCo2Kg =
    env.annualCo2KgSaved > 0
      ? env.annualCo2KgSaved
      : Math.round(annualGenKwh * 0.82);
  const lifetimeCo2Tons =
    env.lifetimeCo2TonsSaved > 0
      ? env.lifetimeCo2TonsSaved
      : Math.round((annualCo2Kg * 25) / 1000);
  const treeEquivalent =
    env.treeEquivalent > 0
      ? env.treeEquivalent
      : Math.round((annualCo2Kg * 25) / 22);
  const lifetimeGenMwh = Math.round((annualGenKwh * 25) / 100) / 10;

  const impactScore = Math.min(
    100,
    Math.round(
      (annualGenKwh / Math.max(summary.systemKw * 1500, 1)) * 35 +
        (lifetimeCo2Tons / Math.max(summary.systemKw * 0.4, 1)) * 35 +
        (summary.coverage / 100) * 30
    )
  );

  const sustainabilityBadge: SchoolImpactMetrics["sustainabilityBadge"] =
    impactScore >= 75 ? "Gold" : impactScore >= 55 ? "Silver" : "Bronze";

  return {
    annualCo2Kg,
    lifetimeCo2Tons,
    treeEquivalent,
    annualGenKwh,
    lifetimeGenMwh,
    impactScore,
    sustainabilityBadge,
  };
}

/** Normalised hourly profile (0–1) for school load vs solar production. */
export const SCHOOL_LOAD_HOUR_PROFILE = [
  0, 0, 0, 0, 0, 0, 0.05, 0.35, 0.85, 0.95, 0.9, 0.88, 0.75, 0.8, 0.85, 0.7, 0.25, 0.05, 0, 0, 0, 0, 0, 0,
] as const;

export const SOLAR_PRODUCTION_HOUR_PROFILE = [
  0, 0, 0, 0, 0, 0.05, 0.15, 0.35, 0.55, 0.75, 0.9, 1, 0.95, 0.85, 0.65, 0.4, 0.15, 0.05, 0, 0, 0, 0, 0, 0,
] as const;
