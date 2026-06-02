/** Profile (timeline, files, calls) — use for “View profile”, not lead form. */
export function buildCustomerLeadProfileHref(leadId: string): string {
  return `/customers/${encodeURIComponent(leadId.trim())}`;
}

/** Open the Customers list with the edit-lead modal for an existing lead. */
export function buildCustomerLeadEditHref(leadId: string): string {
  const id = leadId.trim();
  const params = new URLSearchParams();
  params.set("editLead", id);
  params.set("lead", id);
  return `/customers?${params.toString()}`;
}
