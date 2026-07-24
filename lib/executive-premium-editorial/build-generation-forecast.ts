/**
 * Monthly generation share for Golden forecast page (Central India irradiance).
 * Logic mirrors Canvas; kept local so Golden does not import Canvas UI.
 */

const MP_GEN_SHARE = [
  0.072, 0.078, 0.092, 0.098, 0.105, 0.095, 0.068, 0.065, 0.082, 0.095, 0.088, 0.062,
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

export type EditorialGenerationMonth = {
  label: string;
  units: number;
  savings_inr: number;
  bar_pct: number;
  is_peak: boolean;
};

export function buildEditorialGenerationMonths(
  annualUnits: number,
  annualSavingsInr: number
): EditorialGenerationMonth[] {
  const shareSum = MP_GEN_SHARE.reduce((s, v) => s + v, 0);
  const maxShare = Math.max(...MP_GEN_SHARE);
  const effectiveSavingPerUnit =
    annualUnits > 0 && annualSavingsInr > 0 ? annualSavingsInr / annualUnits : 0;

  return MONTH_SHORT.map((label, i) => {
    const share = MP_GEN_SHARE[i]! / shareSum;
    const units = annualUnits > 0 ? Math.round(annualUnits * share) : 0;
    const savings_inr =
      effectiveSavingPerUnit > 0 ? Math.round(units * effectiveSavingPerUnit) : 0;
    return {
      label,
      units,
      savings_inr,
      bar_pct: Math.max(12, Math.round((MP_GEN_SHARE[i]! / maxShare) * 100)),
      is_peak: i >= 3 && i <= 5,
    };
  });
}

/** ₹/unit used to derive monthly savings from units (for footnote). */
export function editorialEffectiveSavingPerUnit(
  annualUnits: number,
  annualSavingsInr: number
): number {
  if (annualUnits <= 0 || annualSavingsInr <= 0) return 0;
  return annualSavingsInr / annualUnits;
}
