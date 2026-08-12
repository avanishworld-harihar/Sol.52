/**
 * Monthly generation forecast — same seasonal model as Canvas,
 * kept local so Atelier stays independent of the Canvas CSS module.
 * Optional bill-units overlay when proposal has uploaded bill months.
 */

import type { ProposalBillMonth } from "@/lib/proposal-data";

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

const MONTH_KEY_TO_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
  जन: 0,
  फर: 1,
  मार: 2,
  अप्र: 3,
  मई: 4,
  जून: 5,
  जू: 5,
  जुल: 6,
  अग: 7,
  सित: 8,
  सि: 8,
  अक्ट: 9,
  नव: 10,
  दिस: 11,
};

export type AtelierForecastMonth = {
  label: string;
  /** Solar generation estimate for the month */
  units: number;
  /** Uploaded bill consumption units (null = series off / no bill) */
  billUnits: number | null;
  savingsInr: number;
  barPct: number;
  billBarPct: number;
  isPeak?: boolean;
};

/** Bar track height (px) — keep in sync with `.forecastTrack` min-height in CSS. */
export const ATELIER_FORECAST_TRACK_PX = 260;

export function forecastBarHeightPx(
  barPct: number,
  trackPx = ATELIER_FORECAST_TRACK_PX
): number {
  return Math.max(8, Math.round((barPct / 100) * trackPx));
}

function monthIndexFromLabel(label: string): number | null {
  const raw = label.trim();
  if (!raw) return null;
  const key3 = raw.slice(0, 3).toLowerCase();
  if (key3 in MONTH_KEY_TO_INDEX) return MONTH_KEY_TO_INDEX[key3]!;
  const key2 = raw.slice(0, 2).toLowerCase();
  if (key2 in MONTH_KEY_TO_INDEX) return MONTH_KEY_TO_INDEX[key2]!;
  const full = raw.toLowerCase();
  const fullIdx = MONTH_SHORT.findIndex((m) =>
    full.startsWith(m.toLowerCase())
  );
  return fullIdx >= 0 ? fullIdx : null;
}

function mapBillUnitsByCalendarMonth(
  billMonths: ProposalBillMonth[] | undefined | null
): Array<number | null> {
  const out: Array<number | null> = Array.from({ length: 12 }, () => null);
  if (!billMonths?.length) return out;
  for (const row of billMonths) {
    const idx = monthIndexFromLabel(row.label);
    if (idx == null) continue;
    const units = Math.max(0, Math.round(Number(row.units) || 0));
    out[idx] = units;
  }
  return out;
}

export function buildAtelierForecastMonths(
  annualUnits: number,
  annualSavingsInr: number,
  opts?: {
    billMonths?: ProposalBillMonth[] | null;
    includeBillSeries?: boolean;
  }
): AtelierForecastMonth[] {
  const shareSum = MP_GEN_SHARE.reduce((s, v) => s + v, 0);
  const billByMonth = mapBillUnitsByCalendarMonth(opts?.billMonths);
  const hasAnyBill = billByMonth.some((u) => u != null && u > 0);
  const includeBill = Boolean(opts?.includeBillSeries && hasAnyBill);

  const genUnitsList = MONTH_SHORT.map((_, i) => {
    const share = MP_GEN_SHARE[i]! / shareSum;
    return annualUnits > 0 ? Math.round(annualUnits * share) : 0;
  });

  const maxUnits = Math.max(
    ...genUnitsList,
    ...(includeBill
      ? billByMonth.map((u) => (u != null && u > 0 ? u : 0))
      : [0]),
    1
  );

  const effectiveSavingPerUnit =
    annualUnits > 0 && annualSavingsInr > 0
      ? annualSavingsInr / annualUnits
      : 0;

  return MONTH_SHORT.map((label, i) => {
    const units = genUnitsList[i]!;
    const billRaw = billByMonth[i];
    const billUnits =
      includeBill && billRaw != null ? billRaw : includeBill ? 0 : null;
    const savingsInr =
      effectiveSavingPerUnit > 0
        ? Math.round(units * effectiveSavingPerUnit)
        : 0;
    return {
      label,
      units,
      billUnits,
      savingsInr,
      barPct: Math.max(10, Math.round((units / maxUnits) * 100)),
      billBarPct:
        billUnits != null && billUnits > 0
          ? Math.max(10, Math.round((billUnits / maxUnits) * 100))
          : 0,
      isPeak: i >= 3 && i <= 5,
    };
  });
}
