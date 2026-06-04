/**
 * Proposal Financial Engine — single source of truth for all proposal money metrics.
 *
 * ROI, payback, profit, IRR, NPV, savings, and 25-year cashflow MUST come from here.
 * `commercial-proposal-financials.ts` re-exports this module for backward compatibility.
 */

import { honestPaybackYears } from "@/lib/proposal-deck-helpers";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";

export const COMMERCIAL_TARIFF_INR_PER_KWH = 8;
export const COMMERCIAL_SELF_USE_FACTOR = 0.85;
export const COMMERCIAL_GEN_KWH_PER_KW = 1500;
export const CASHFLOW_ESCALATION_PCT = 6;
export const DISCOUNT_RATE_PCT = 8;

export type CashflowRow = { year: number; saving: number; cumulative: number };

export type ProposalFinancialInput = {
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

export type ProposalFinancialMetrics = {
  netCost: number;
  annualSaving: number;
  monthlySaving: number;
  yearlyBill: number;
  afterSolar: number;
  paybackYears: number;
  lifetime25Profit: number;
  roiPctFirstYear: number;
  irrEstimate: number;
  cashflow25: CashflowRow[];
  breakEvenYear: number;
  profit25: number;
  npv: number;
};

/** @deprecated alias */
export type ReconcileFinancialInput = ProposalFinancialInput;
/** @deprecated alias */
export type ReconciledFinancialMetrics = ProposalFinancialMetrics;

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

/** Canonical financial computation — all consumers must call this. */
export function computeProposalFinancials(input: ProposalFinancialInput): ProposalFinancialMetrics {
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

  if (annualSaving <= 0 && savingHint > 0) annualSaving = savingHint;

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
    paybackYears > 0 && paybackYears < 99 ? Math.round((72 / paybackYears) * 10) / 10 : 0;

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
    netCost,
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

/** @deprecated use computeProposalFinancials */
export const reconcileCommercialFinancialMetrics = computeProposalFinancials;

export function computeProposalFinancialsFromDeck(
  summary: Pick<
    ProposalDeckSummary,
    | "annualGen"
    | "netCost"
    | "yearlyBill"
    | "afterSolar"
    | "annualSaving"
    | "paybackYears"
    | "effectiveTariffRateInrPerKwh"
  >,
  pptInput: Pick<PremiumProposalPptInput, "saving" | "commercialConfig">
): ProposalFinancialMetrics {
  return computeProposalFinancials({
    annualGen: summary.annualGen,
    netCost: summary.netCost,
    yearlyBill: summary.yearlyBill,
    afterSolar: summary.afterSolar,
    billDerivedAnnualSaving: summary.annualSaving,
    paybackHint: summary.paybackYears,
    savingHintInr: pptInput.saving,
    effectiveTariffInrPerKwh: summary.effectiveTariffRateInrPerKwh,
    preferGenerationPath: Boolean(pptInput.commercialConfig),
  });
}

export function buildEscalatedCashflow25(
  netCost: number,
  firstYearAnnualSaving: number,
  escalationPct = CASHFLOW_ESCALATION_PCT
): CashflowRow[] {
  const rows: CashflowRow[] = [];
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

export function buildCashflowChartRows(
  cashflow25: CashflowRow[],
  breakEvenYear: number
): CashflowRow[] {
  const years = new Set<number>();
  cashflow25.forEach((row, i) => {
    if (i % 2 === 0) years.add(row.year);
  });
  if (breakEvenYear > 0) {
    years.add(breakEvenYear);
    if (breakEvenYear > 1) years.add(breakEvenYear - 1);
  }
  years.add(25);
  return cashflow25.filter((row) => years.has(row.year));
}

export function isSchoolInstitutionOrg(orgType?: string | null): boolean {
  return orgType === "school";
}

export type FinancialValidationResult = { ok: boolean; errors: string[] };

/** Automated financial consistency rules — used in CI / prebuild. */
export function validateProposalFinancials(
  metrics: ProposalFinancialMetrics,
  ctx: { annualGen: number; label?: string }
): FinancialValidationResult {
  const prefix = ctx.label ? `[${ctx.label}] ` : "";
  const errors: string[] = [];
  const { annualGen } = ctx;
  const {
    annualSaving,
    paybackYears,
    netCost,
    roiPctFirstYear,
    lifetime25Profit,
    profit25,
    irrEstimate,
    breakEvenYear,
    cashflow25,
  } = metrics;

  if (annualGen > 0 && annualSaving <= 0) {
    errors.push(`${prefix}annualGen > 0 but annualSaving is ₹0`);
  }

  if (annualSaving <= 0 && paybackYears > 0 && paybackYears < 99) {
    errors.push(`${prefix}positive payback (${paybackYears} yr) with ₹0 annual saving`);
  }

  if (annualSaving <= 0 && irrEstimate > 0) {
    errors.push(`${prefix}positive IRR (${irrEstimate}%) with ₹0 annual saving`);
  }

  if (annualSaving > 0 && netCost > 0 && paybackYears < 99) {
    const impliedPayback = netCost / annualSaving;
    if (Math.abs(impliedPayback - paybackYears) > 0.35) {
      errors.push(
        `${prefix}payback ${paybackYears} yr does not match netCost/annualSaving (${impliedPayback.toFixed(1)} yr)`
      );
    }
  }

  if (annualSaving > 0 && netCost > 0) {
    const expectedRoi = Math.round((annualSaving / netCost) * 100 * 10) / 10;
    if (Math.abs(expectedRoi - roiPctFirstYear) > 0.25) {
      errors.push(`${prefix}ROI ${roiPctFirstYear}% != expected ${expectedRoi}%`);
    }
  }

  if (Math.abs(lifetime25Profit - (annualSaving * 25 - netCost)) > 2) {
    errors.push(`${prefix}lifetime25Profit does not match annualSaving×25 − netCost`);
  }

  const cfProfit = cashflow25[24]?.cumulative;
  if (cfProfit != null && Math.abs(cfProfit - profit25) > 2) {
    errors.push(`${prefix}profit25 != cashflow25[24].cumulative`);
  }

  if (breakEvenYear > 0) {
    const row = cashflow25.find((r) => r.year === breakEvenYear);
    if (row && row.cumulative < 0) {
      errors.push(`${prefix}breakEvenYear ${breakEvenYear} still has negative cumulative cashflow`);
    }
  }

  return { ok: errors.length === 0, errors };
}
