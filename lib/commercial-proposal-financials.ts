/**
 * Single source for commercial proposal savings, payback, ROI, and cashflow inputs.
 * Prevents contradictory outputs (e.g. positive payback with ₹0 annual saving).
 */

import { honestPaybackYears } from "@/lib/proposal-deck-helpers";

export const COMMERCIAL_TARIFF_INR_PER_KWH = 8;
export const COMMERCIAL_SELF_USE_FACTOR = 0.85;
export const COMMERCIAL_GEN_KWH_PER_KW = 1500;
export const CASHFLOW_ESCALATION_PCT = 6;
export const DISCOUNT_RATE_PCT = 8;

export type ReconcileFinancialInput = {
  annualGen: number;
  netCost: number;
  yearlyBill: number;
  afterSolar: number;
  billDerivedAnnualSaving: number;
  paybackHint?: number;
  savingHintInr?: number;
  effectiveTariffInrPerKwh?: number | null;
  /** When true, prefer generation-based savings if bill path is zero. */
  preferGenerationPath?: boolean;
};

export type ReconciledFinancialMetrics = {
  annualSaving: number;
  monthlySaving: number;
  yearlyBill: number;
  afterSolar: number;
  paybackYears: number;
  lifetime25Profit: number;
  roiPctFirstYear: number;
  irrEstimate: number;
  cashflow25: { year: number; saving: number; cumulative: number }[];
  breakEvenYear: number;
  profit25: number;
  npv: number;
};

export function deriveAnnualSavingsFromGeneration(
  annualGen: number,
  tariffPerKwh?: number | null,
  selfUseFactor = COMMERCIAL_SELF_USE_FACTOR
): number {
  if (annualGen <= 0) return 0;
  const tariff =
    typeof tariffPerKwh === "number" && tariffPerKwh > 0
      ? tariffPerKwh
      : COMMERCIAL_TARIFF_INR_PER_KWH;
  return Math.round(annualGen * tariff * selfUseFactor);
}

/** Pick the best annual saving estimate and align bill fields for charts. */
export function reconcileCommercialFinancialMetrics(
  input: ReconcileFinancialInput
): ReconciledFinancialMetrics {
  const tariff =
    typeof input.effectiveTariffInrPerKwh === "number" && input.effectiveTariffInrPerKwh > 0
      ? input.effectiveTariffInrPerKwh
      : COMMERCIAL_TARIFF_INR_PER_KWH;

  const genBasedSaving = deriveAnnualSavingsFromGeneration(input.annualGen, tariff);
  const savingHint =
    typeof input.savingHintInr === "number" && input.savingHintInr > 0
      ? Math.round(input.savingHintInr)
      : 0;

  let annualSaving = Math.max(0, Math.round(input.billDerivedAnnualSaving));

  if (annualSaving <= 0 && savingHint > 0) {
    annualSaving = savingHint;
  }

  if (
    annualSaving <= 0 &&
    input.annualGen > 0 &&
    (input.preferGenerationPath || tariff > 0)
  ) {
    annualSaving = genBasedSaving;
  }

  if (
    annualSaving > 0 &&
    input.preferGenerationPath &&
    input.billDerivedAnnualSaving <= 0 &&
    genBasedSaving > 0 &&
    Math.abs(genBasedSaving - annualSaving) / Math.max(annualSaving, 1) > 0.35
  ) {
    annualSaving = genBasedSaving;
  }

  let yearlyBill = Math.max(0, Math.round(input.yearlyBill));
  let afterSolar = Math.max(0, Math.round(input.afterSolar));

  if (annualSaving > 0 && yearlyBill <= 0) {
    yearlyBill = Math.round(annualSaving / COMMERCIAL_SELF_USE_FACTOR);
    afterSolar = Math.max(0, yearlyBill - annualSaving);
  } else if (annualSaving > 0 && yearlyBill > 0 && afterSolar >= yearlyBill) {
    afterSolar = Math.max(0, yearlyBill - annualSaving);
  } else if (annualSaving > 0 && yearlyBill > 0 && yearlyBill - afterSolar !== annualSaving) {
    const billGap = yearlyBill - afterSolar;
    if (billGap <= 0 || Math.abs(billGap - annualSaving) / Math.max(annualSaving, 1) > 0.2) {
      afterSolar = Math.max(0, yearlyBill - annualSaving);
    }
  }

  const netCost = Math.max(0, Math.round(input.netCost));
  const paybackYears = honestPaybackYears({
    paybackHint: input.paybackHint,
    netCostInr: netCost,
    annualSavingInr: annualSaving,
  });

  const lifetime25Profit = annualSaving * 25 - netCost;
  const roiPctFirstYear =
    netCost > 0 && annualSaving > 0
      ? Math.round((annualSaving / netCost) * 100 * 10) / 10
      : 0;

  const irrEstimate =
    paybackYears > 0 && paybackYears < 99
      ? Math.round((72 / paybackYears) * 10) / 10
      : 0;

  const cashflow25 = buildEscalatedCashflow25(netCost, annualSaving);
  const breakEvenYear =
    cashflow25.find((r) => r.cumulative >= 0)?.year ??
    (paybackYears > 0 && paybackYears < 99 ? Math.round(paybackYears) : 0);
  const profit25 = cashflow25[24]?.cumulative ?? lifetime25Profit;
  const npv = cashflow25.reduce(
    (acc, row) => acc + row.saving / Math.pow(1 + DISCOUNT_RATE_PCT / 100, row.year),
    -netCost
  );

  return {
    annualSaving,
    monthlySaving: Math.round(annualSaving / 12),
    yearlyBill,
    afterSolar,
    paybackYears,
    lifetime25Profit,
    roiPctFirstYear,
    irrEstimate,
    cashflow25,
    breakEvenYear,
    profit25,
    npv: Math.round(npv),
  };
}

export function buildEscalatedCashflow25(
  netCost: number,
  firstYearAnnualSaving: number,
  escalationPct = CASHFLOW_ESCALATION_PCT
): { year: number; saving: number; cumulative: number }[] {
  const rows: { year: number; saving: number; cumulative: number }[] = [];
  let cumulative = -Math.max(0, netCost);
  let annualSaving = Math.max(0, firstYearAnnualSaving);
  for (let yr = 1; yr <= 25; yr++) {
    cumulative += annualSaving;
    rows.push({
      year: yr,
      saving: Math.round(annualSaving),
      cumulative: Math.round(cumulative),
    });
    annualSaving *= 1 + escalationPct / 100;
  }
  return rows;
}

export function isSchoolInstitutionOrg(orgType?: string | null): boolean {
  return orgType === "school";
}
