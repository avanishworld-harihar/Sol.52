/**
 * Ownership ledger — derived from existing proposal financial projections.
 * Uses the same escalation model as `computeSolarVsGrid` in proposal-deck-helpers.
 */

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { NextgenLedger, NextgenLedgerRow } from "@/lib/executive-premium-nextgen/types";

const LEDGER_YEARS = [1, 5, 10, 15, 25] as const;
const ESCALATION_PCT = 5;

function cumulativeGridSpend(yearlyBill: number, throughYear: number): number {
  let sum = 0;
  for (let y = 1; y <= throughYear; y++) {
    sum += Math.round(yearlyBill * Math.pow(1 + ESCALATION_PCT / 100, y - 1));
  }
  return sum;
}

function cumulativeWithDecision(opts: {
  netCostInr: number;
  afterSolarYearly: number;
  yearlyAmcInr: number;
  throughYear: number;
}): number {
  let sum = opts.netCostInr;
  for (let y = 1; y <= opts.throughYear; y++) {
    sum += Math.round(opts.afterSolarYearly * Math.pow(1 + ESCALATION_PCT / 100, y - 1));
    sum += opts.yearlyAmcInr;
  }
  return sum;
}

function rowForYear(
  year: number,
  without: number,
  withDecision: number
): { without: NextgenLedgerRow; with: NextgenLedgerRow } {
  return {
    without: { year, cumulative_expenditure_inr: without },
    with: { year, cumulative_expenditure_inr: withDecision },
  };
}

/** Build ledger rows from deck summary — no tariff trajectory engine required. */
export function buildOwnershipLedgerFromSummary(
  summary: Pick<
    ProposalDeckSummary,
    "yearlyBill" | "afterSolar" | "netCost" | "solarVsGrid"
  >
): NextgenLedger {
  const yearlyBill = Math.max(0, summary.yearlyBill);
  const afterSolar = Math.max(0, summary.afterSolar);
  const netCost = Math.max(0, summary.netCost);
  const yearlyAmc = Math.round(netCost * 0.005);

  const without_solar: NextgenLedgerRow[] = [];
  const with_solar: NextgenLedgerRow[] = [];

  for (const year of LEDGER_YEARS) {
    const withoutVal = cumulativeGridSpend(yearlyBill, year);
    const withVal = cumulativeWithDecision({
      netCostInr: netCost,
      afterSolarYearly: afterSolar,
      yearlyAmcInr: yearlyAmc,
      throughYear: year,
    });
    const pair = rowForYear(year, withoutVal, withVal);
    without_solar.push(pair.without);
    with_solar.push(pair.with);
  }

  const difference_year25_inr =
    without_solar[without_solar.length - 1]!.cumulative_expenditure_inr -
    with_solar[with_solar.length - 1]!.cumulative_expenditure_inr;

  return {
    without_solar,
    with_solar,
    difference_year25_inr: Math.max(0, difference_year25_inr),
    column_header_left: "Without solar",
    column_header_right: "With solar",
    closing_statement:
      "This saving stays with your home — not with the electricity company. Figures assume tariff rises of about 5% per year.",
  };
}
