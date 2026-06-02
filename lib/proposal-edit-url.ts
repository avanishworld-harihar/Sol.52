/**
 * Canonical URL for editing an existing proposal in the builder
 * (plant / panel / proposal options) — not the legacy BOM manage screen.
 */
export function buildProposalEditHref(input: {
  leadId?: string | null;
  proposalId?: string | null;
}): string {
  const leadId = input.leadId?.trim();
  const proposalId = input.proposalId?.trim();
  const params = new URLSearchParams();
  if (leadId) params.set("leadId", leadId);
  if (proposalId) params.set("proposalId", proposalId);
  const qs = params.toString();
  return qs ? `/proposal?${qs}` : "/proposal";
}
