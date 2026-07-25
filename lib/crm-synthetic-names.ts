/**
 * Dev / audit script names that must never become real CRM customers.
 * `scripts/audit-proposal-pdf.mjs` creates proposals named "PDF Audit {timestamp}".
 */
export function isSyntheticCrmCustomerName(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  if (/^pdf\s*audit\b/i.test(n)) return true;
  return false;
}
