/** Open the Customers page with the add/edit lead modal for an existing lead. */
export function buildCustomerLeadEditHref(leadId: string): string {
  const id = leadId.trim();
  const params = new URLSearchParams();
  params.set("editLead", id);
  params.set("lead", id);
  return `/customers?${params.toString()}`;
}
