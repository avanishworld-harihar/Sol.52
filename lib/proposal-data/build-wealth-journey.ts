/**
 * 25-year compounding wealth journey for Canvas / ProposalData.economics.
 */

import type { ProposalWealthPoint } from "@/lib/proposal-data/types";

const TARIFF_ESCALATION = 0.06;

/**
 * Build cumulative savings path with mild tariff escalation.
 * Year N cumulative ≈ sum of annualSavings * (1+e)^(i-1) for i=1..N
 * Endpoint soft-anchored to lifetimeProfit when provided.
 */
export function buildWealthJourney(opts: {
  annualSavingsInr: number;
  lifetimeProfitInr: number;
  paybackYears: number;
  horizonYears?: number;
}): ProposalWealthPoint[] {
  const horizon = opts.horizonYears ?? 25;
  const annual0 =
    opts.annualSavingsInr > 0
      ? opts.annualSavingsInr
      : opts.lifetimeProfitInr > 0
        ? opts.lifetimeProfitInr / horizon
        : 0;

  if (annual0 <= 0 && opts.lifetimeProfitInr <= 0) return [];

  const raw: number[] = [];
  let cumulative = 0;
  for (let y = 1; y <= horizon; y++) {
    const yearSavings = annual0 * Math.pow(1 + TARIFF_ESCALATION, y - 1);
    cumulative += yearSavings;
    raw.push(cumulative);
  }

  const last = raw[raw.length - 1] || 1;
  const target = opts.lifetimeProfitInr > 0 ? opts.lifetimeProfitInr : last;
  const scale = last > 0 ? target / last : 1;
  const payback = opts.paybackYears > 0 ? opts.paybackYears : 0;

  return raw.map((cum, i) => {
    const year = i + 1;
    const cumulativeInr = Math.round(cum * scale);
    const annualInr = Math.round(
      annual0 * Math.pow(1 + TARIFF_ESCALATION, i) * scale
    );
    return {
      year,
      cumulativeInr,
      annualInr,
      isPayback: payback > 0 && Math.abs(year - payback) < 0.51,
    };
  });
}
