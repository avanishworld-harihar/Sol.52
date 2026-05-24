/**
 * Requirement-based proposals — map monthly kWh or bill (₹) → flat monthlyUnits for solar engine.
 */

import { emptyMonthlyUnits } from "@/lib/bill-parse";
import type { MonthlyUnits } from "@/lib/types";
import { estimateMonthlyKwhFromBillAmount } from "@/lib/tariff-engine";
import type { TariffContext } from "@/lib/tariff-types";

const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export function flatMonthlyUnits(kwhPerMonth: number): MonthlyUnits {
  const flat = Math.max(0, Math.round(kwhPerMonth));
  const units = emptyMonthlyUnits();
  for (const k of MONTH_KEYS) units[k] = flat;
  return units;
}

export function parseRequirementMonthlyKwh(raw: string): number | null {
  const n = parseFloat(raw.trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseRequirementMonthlyBillInr(raw: string): number | null {
  const n = parseFloat(raw.replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Prefer direct kWh; else estimate kWh from bill + tariff context. */
export function monthlyUnitsFromRequirementInput(
  monthlyKwhStr: string,
  monthlyBillInrStr: string,
  tariffContext: TariffContext
): MonthlyUnits | null {
  const kwhDirect = parseRequirementMonthlyKwh(monthlyKwhStr);
  if (kwhDirect != null) return flatMonthlyUnits(kwhDirect);

  const bill = parseRequirementMonthlyBillInr(monthlyBillInrStr);
  if (bill != null) {
    const estKwh = estimateMonthlyKwhFromBillAmount(bill, tariffContext);
    if (estKwh > 0) return flatMonthlyUnits(estKwh);
  }
  return null;
}

export function requirementHasConsumptionInput(monthlyKwhStr: string, monthlyBillInrStr: string): boolean {
  return parseRequirementMonthlyKwh(monthlyKwhStr) != null || parseRequirementMonthlyBillInr(monthlyBillInrStr) != null;
}
