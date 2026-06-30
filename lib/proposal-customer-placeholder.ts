/** Names that mean “no real customer yet” — do not auto-create CRM leads. */
const PLACEHOLDER_NAMES = new Set(["", "new customer", "customer", "—", "-"]);

export function isPlaceholderProposalCustomerName(name?: string | null): boolean {
  const normalized = name?.trim().toLowerCase() ?? "";
  return PLACEHOLDER_NAMES.has(normalized);
}

/** Default stored name for logo-only / anonymous quick quotes (empty in DB). */
export function anonymousQuickQuoteCustomerName(): string {
  return "";
}

/** Hub list + chips — friendly label until installer adds a real name. */
export function proposalHubCustomerLabel(name?: string | null): string {
  const trimmed = name?.trim() ?? "";
  if (isPlaceholderProposalCustomerName(trimmed)) return "Quick quote";
  return trimmed;
}

/** Public proposal / WhatsApp — personalise only when a real name exists. */
export function proposalCustomerDisplayName(name?: string | null): string {
  const trimmed = name?.trim() ?? "";
  if (isPlaceholderProposalCustomerName(trimmed)) return "Solar customer";
  return trimmed;
}

/** Resolve builder save name — never persist placeholder strings. */
export function resolveProposalCustomerName(
  ...candidates: Array<string | null | undefined>
): string {
  for (const raw of candidates) {
    const trimmed = raw?.trim() ?? "";
    if (trimmed && !isPlaceholderProposalCustomerName(trimmed)) return trimmed.slice(0, 120);
  }
  return "";
}
