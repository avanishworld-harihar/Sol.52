import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { residentialAnnualGenerationUnits } from "@/lib/residential-deck-helpers";
import type { NextgenRequirementContext } from "@/lib/executive-premium-nextgen/types";

/** Map requirement-path deck data → NextGen system context model. */
export function buildRequirementContextData(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary
): NextgenRequirementContext {
  const annual_requirement_units = summary.annualUse > 0 ? summary.annualUse : Math.round(summary.systemKw * 1200);
  const declared_monthly_units =
    annual_requirement_units > 0 ? Math.round(annual_requirement_units / 12) : 0;

  const modelled_annual_production =
    summary.requirementBased === true
      ? residentialAnnualGenerationUnits(summary.systemKw)
      : summary.annualGen;

  const coverage_pct = Math.min(
    100,
    annual_requirement_units > 0
      ? Math.round((modelled_annual_production / annual_requirement_units) * 100)
      : summary.coverage
  );

  const discom = (pptInput.discom ?? "").trim() || "To be confirmed";
  const connection = (pptInput.connectionType ?? pptInput.tariffCategory ?? "").trim() || "Domestic";

  const insight1 =
    declared_monthly_units > 0
      ? `You stated about ${declared_monthly_units.toLocaleString("en-IN")} units per month (${annual_requirement_units.toLocaleString("en-IN")} per year).`
      : "Your power need is based on the sizing form.";

  const insight2 = `This system is expected to cover ${coverage_pct}% of that need.`;

  const insight3 =
    pptInput.state?.trim()
      ? `Connection profile: ${connection} · ${discom} · ${pptInput.state.trim()}`
      : `Connection profile: ${connection} · ${discom}`;

  return {
    declared_monthly_units,
    annual_requirement_units,
    proposed_capacity_kw: summary.systemKw,
    modelled_annual_production,
    coverage_pct,
    discom_name: discom,
    connection_category: connection,
    insight_lines: [insight1, insight2, insight3],
  };
}
