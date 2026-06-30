/**
 * Canonical URL for editing an existing proposal in the builder
 * (plant / panel / proposal options) — not the legacy BOM manage screen.
 */
export function buildProposalEditHref(input: {
  leadId?: string | null;
  proposalId?: string | null;
  /** Opens builder in requirement vs bill input mode (quick quotes). */
  inputMode?: "bill" | "requirement" | null;
}): string {
  const leadId = input.leadId?.trim();
  const proposalId = input.proposalId?.trim();
  const params = new URLSearchParams();
  if (leadId) params.set("leadId", leadId);
  if (proposalId) params.set("proposalId", proposalId);
  if (input.inputMode === "bill" || input.inputMode === "requirement") {
    params.set("inputMode", input.inputMode);
  }
  const qs = params.toString();
  return qs ? `/proposal?${qs}` : "/proposal";
}
