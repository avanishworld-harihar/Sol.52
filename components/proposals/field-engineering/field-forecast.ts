/** Field Engineering — seasonal generation share (local copy; do not import other presets). */

export const FIELD_MONTH_SHORT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const MP_GEN_SHARE = [
  0.072, 0.078, 0.092, 0.098, 0.105, 0.095, 0.068, 0.065, 0.082, 0.095, 0.088,
  0.062,
] as const;

export type FieldForecastMonth = {
  m: string;
  val: number;
  pct: number;
};

export function buildFieldForecastMonths(annualUnits: number): FieldForecastMonth[] {
  const shareSum = MP_GEN_SHARE.reduce((s, v) => s + v, 0);
  const maxShare = Math.max(...MP_GEN_SHARE);
  return FIELD_MONTH_SHORT.map((m, i) => {
    const share = MP_GEN_SHARE[i]! / shareSum;
    const val = annualUnits > 0 ? Math.round(annualUnits * share) : 0;
    const pct = Math.max(8, Math.round((MP_GEN_SHARE[i]! / maxShare) * 100));
    return { m, val, pct };
  });
}
