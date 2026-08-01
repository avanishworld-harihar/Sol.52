/**
 * Monthly generation forecast — same seasonal model as Canvas,
 * kept local so Atelier stays independent of the Canvas CSS module.
 */

/** Central India seasonal share of annual generation (sums ≈ 1). */
const MP_GEN_SHARE = [
  0.072, 0.078, 0.092, 0.098, 0.105, 0.095, 0.068, 0.065, 0.082, 0.095, 0.088,
  0.062,
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type AtelierForecastMonth = {
  label: string;
  units: number;
  savingsInr: number;
  barPct: number;
  isPeak?: boolean;
};

export function buildAtelierForecastMonths(
  annualUnits: number,
  annualSavingsInr: number
): AtelierForecastMonth[] {
  const shareSum = MP_GEN_SHARE.reduce((s, v) => s + v, 0);
  const maxShare = Math.max(...MP_GEN_SHARE);
  const effectiveSavingPerUnit =
    annualUnits > 0 && annualSavingsInr > 0
      ? annualSavingsInr / annualUnits
      : 0;

  return MONTH_SHORT.map((label, i) => {
    const share = MP_GEN_SHARE[i]! / shareSum;
    const units = annualUnits > 0 ? Math.round(annualUnits * share) : 0;
    const savingsInr =
      effectiveSavingPerUnit > 0
        ? Math.round(units * effectiveSavingPerUnit)
        : 0;
    return {
      label,
      units,
      savingsInr,
      barPct: Math.max(12, Math.round((MP_GEN_SHARE[i]! / maxShare) * 100)),
      isPeak: i >= 3 && i <= 5,
    };
  });
}
