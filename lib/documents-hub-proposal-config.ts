/**
 * Phase 3 — feature flag for proposal asset persistence (PPTX on snapshot).
 * Set DOCUMENTS_HUB_PROPOSAL_PERSIST=false to skip storage writes.
 */

export function isDocumentsHubProposalPersistEnabled(): boolean {
  const raw = process.env.DOCUMENTS_HUB_PROPOSAL_PERSIST?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}
