/**
 * Detect sparse / unpopulated ProposalData (no real DB deck yet).
 * Used so Zenith can render luxury mock layout for immediate UI verification.
 */
import type { ProposalData } from "@/lib/proposal-data";

export function isSparseProposalData(data: ProposalData | null | undefined): boolean {
  if (!data) return true;
  const kw = data.meta?.systemKw ?? 0;
  const net = data.economics?.netInr ?? 0;
  const bomLen = data.bom?.length ?? 0;
  const customer = (data.meta?.customerName ?? "").trim().toLowerCase();
  const placeholderCustomer =
    !customer ||
    customer === "valued customer" ||
    customer === "—" ||
    customer === "-";

  // No system + no economics + no BOM → treat as empty deck
  if (kw <= 0 && net <= 0 && bomLen === 0) return true;
  // Placeholder customer with empty BOM and zero lifetime profit
  if (placeholderCustomer && bomLen === 0 && (data.economics?.lifetimeProfitInr ?? 0) <= 0) {
    return true;
  }
  return false;
}
