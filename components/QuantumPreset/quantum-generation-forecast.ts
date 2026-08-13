/**
 * Quantum — monthly generation forecast (Central India seasonal profile)
 * + optional bill-based consumption overlay by calendar month.
 */

import type { ProposalBillMonth } from "@/lib/proposal-data";

/** Central India seasonal share of annual generation (sums ≈ 1). */
const MP_GEN_SHARE = [
  0.072, 0.078, 0.092, 0.098, 0.105, 0.095, 0.068, 0.065, 0.082, 0.095, 0.088,
  0.062,
] as const;

export const QUANTUM_MONTH_SHORT = [
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

export type QuantumForecastMonth = {
  label: string;
  genUnits: number;
  billUnits: number | null;
  savingsInr: number;
  genBarPct: number;
  billBarPct: number;
  isPeak?: boolean;
};

function monthIndexFromLabel(label: string): number | null {
  const raw = label.trim();
  if (!raw) return null;
  const key3 = raw.slice(0, 3).toLowerCase();
  if (key3 in MONTH_KEY_TO_INDEX) return MONTH_KEY_TO_INDEX[key3]!;
  const key2 = raw.slice(0, 2).toLowerCase();
  if (key2 in MONTH_KEY_TO_INDEX) return MONTH_KEY_TO_INDEX[key2]!;
  const full = raw.toLowerCase();
  const fullIdx = QUANTUM_MONTH_SHORT.findIndex((m) =>
    full.startsWith(m.toLowerCase())
  );
  return fullIdx >= 0 ? fullIdx : null;
}

export function mapBillUnitsByCalendarMonth(
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

export function buildQuantumForecastMonths(opts: {
  annualGenUnits: number;
  annualSavingsInr: number;
  billMonths?: ProposalBillMonth[] | null;
  includeBillSeries?: boolean;
  monthLabels?: readonly string[];
}): QuantumForecastMonth[] {
  const labels = opts.monthLabels?.length === 12
    ? opts.monthLabels
    : QUANTUM_MONTH_SHORT;
  const shareSum = MP_GEN_SHARE.reduce((s, v) => s + v, 0);
  const billByMonth = mapBillUnitsByCalendarMonth(opts.billMonths);
  const hasAnyBill = billByMonth.some((u) => u != null && u > 0);
  const includeBill = Boolean(opts.includeBillSeries && hasAnyBill);

  const genUnitsList = MP_GEN_SHARE.map((share) => {
    const n = share / shareSum;
    return opts.annualGenUnits > 0 ? Math.round(opts.annualGenUnits * n) : 0;
  });

  const maxUnits = Math.max(
    ...genUnitsList,
    ...(includeBill
      ? billByMonth.map((u) => (u != null && u > 0 ? u : 0))
      : [0]),
    1
  );

  const savingPerUnit =
    opts.annualGenUnits > 0 && opts.annualSavingsInr > 0
      ? opts.annualSavingsInr / opts.annualGenUnits
      : 0;

  return labels.map((label, i) => {
    const genUnits = genUnitsList[i]!;
    const billRaw = billByMonth[i];
    const billUnits =
      includeBill && billRaw != null ? billRaw : includeBill ? 0 : null;
    return {
      label,
      genUnits,
      billUnits,
      savingsInr:
        savingPerUnit > 0 ? Math.round(genUnits * savingPerUnit) : 0,
      genBarPct: Math.max(10, Math.round((genUnits / maxUnits) * 100)),
      billBarPct:
        billUnits != null && billUnits > 0
          ? Math.max(10, Math.round((billUnits / maxUnits) * 100))
          : 0,
      isPeak: i >= 3 && i <= 5,
    };
  });
}
