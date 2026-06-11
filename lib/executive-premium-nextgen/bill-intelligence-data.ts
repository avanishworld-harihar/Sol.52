import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import { monthLabels } from "@/lib/proposal-i18n";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { NextgenBillIntelligence } from "@/lib/executive-premium-nextgen/types";

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Map deck audit rows → NextGen bill intelligence model (data only). */
export function buildBillIntelligenceData(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary
): NextgenBillIntelligence {
  const labels = monthLabels(summary.lang);
  const peakIndices = new Set([3, 4, 5, 6]);

  const monthly_pattern = summary.auditRows.map((row, i) => ({
    month_label: labels[i] ?? row.label,
    units: row.units,
    net_inr: row.total,
    is_peak_season: peakIndices.has(i),
  }));

  const annual_units = summary.auditTotals.units || summary.annualUse;
  const annual_spend_inr = summary.yearlyBill || summary.auditTotals.total;
  const average_monthly_spend_inr =
    annual_spend_inr > 0 ? Math.round(annual_spend_inr / 12) : 0;

  const effective_rate_inr_per_unit =
    summary.effectiveTariffRateInrPerKwh != null && summary.effectiveTariffRateInrPerKwh > 0
      ? Math.round(summary.effectiveTariffRateInrPerKwh * 100) / 100
      : annual_units > 0 && annual_spend_inr > 0
        ? Math.round((annual_spend_inr / annual_units) * 100) / 100
        : null;

  const discom = (pptInput.discom ?? "").trim() || "Regional utility";
  const state = (pptInput.state ?? "").trim();

  const insight1 =
    summary.summerPct > 0
      ? `Summer months cost about ${summary.summerPct}% more than your average month.`
      : "Your use is fairly even across the year.";

  const insight2 =
    summary.fixedAnnual > 0
      ? `You pay ${inr(summary.fixedAnnual)} in fixed charges every year — even if use is low.`
      : "Most of your bill depends on how much power you use.";

  const insight3 =
    effective_rate_inr_per_unit != null
      ? `Effective all-in rate: ₹${effective_rate_inr_per_unit.toLocaleString("en-IN")} per unit across the audit year.`
      : "Tariff context will refine once DISCOM category is confirmed.";

  return {
    discom_name: discom,
    state_name: state || "—",
    annual_spend_inr,
    average_monthly_spend_inr,
    annual_units,
    peak_season_pct: summary.summerPct,
    effective_rate_inr_per_unit,
    fixed_charges_annual_inr: summary.fixedAnnual,
    monthly_pattern,
    insight_lines: [insight1, insight2, insight3],
    tariff_context_line: summary.mpSmartBillingCaption ?? summary.mpBillingSubTypeLabel ?? null,
  };
}

export function resolveNextgenFlowMode(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary
): "bill" | "requirement" {
  if (pptInput.dataSource === "requirement" || summary.requirementBased) return "requirement";
  if (pptInput.dataSource === "bill") return "bill";
  return isProposalBillAuditBacked(pptInput) ? "bill" : "requirement";
}
