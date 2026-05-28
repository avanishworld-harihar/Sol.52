import type { ParsedBillShape } from "@/lib/bill-parse";
import {
  mergeCustomerForProposal,
  mergeParsedBills,
  type ManualProposalCustomer,
} from "@/lib/merge-proposal-customer";

export type LeadPatchFromProposal = {
  name?: string;
  city?: string;
  state?: string;
  discom?: string;
  consumer_id?: string | null;
  phone?: string | null;
  connection_type?: string | null;
  area?: "urban" | "rural" | null;
  location?: string | null;
  monthly_bill?: number;
};

export function buildLeadPatchFromProposal(
  manual: ManualProposalCustomer,
  latestBill: ParsedBillShape | null,
  previousBill: ParsedBillShape | null,
  options?: { monthlyBillInr?: number; leadPhone?: string; billPhone?: string }
): LeadPatchFromProposal | null {
  const merged = mergeCustomerForProposal(manual, mergeParsedBills(latestBill, previousBill));
  const name =
    merged?.name?.trim() ||
    manual.officialBillName.trim() ||
    manual.leadContactName.trim();
  if (!name) return null;

  const patch: LeadPatchFromProposal = { name };

  const city = manual.city.trim() || merged?.district?.trim();
  if (city) patch.city = city;

  const state = manual.state.trim() || merged?.state?.trim();
  if (state) patch.state = state;

  const discom = manual.discom.trim() || merged?.discom?.trim();
  if (discom) patch.discom = discom;

  const consumerId = manual.consumerId.trim() || merged?.consumer_id?.trim();
  if (consumerId) patch.consumer_id = consumerId;

  const connectionType = manual.connectionType.trim() || merged?.connection_type?.trim();
  if (connectionType) patch.connection_type = connectionType;

  const area = manual.area.trim();
  if (area === "urban" || area === "rural") patch.area = area;

  const location = manual.location.trim();
  if (location) patch.location = location;

  const phone = (options?.leadPhone ?? manual.leadPhone).trim() || (options?.billPhone ?? manual.billPhone).trim();
  if (phone) patch.phone = phone;

  const monthly = options?.monthlyBillInr;
  if (monthly != null && monthly > 0) patch.monthly_bill = Math.round(monthly);

  return patch;
}

export async function patchLeadFromProposal(
  leadId: string,
  patch: LeadPatchFromProposal
): Promise<boolean> {
  const res = await fetch(`/api/customers/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return false;
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean };
  return json.ok === true;
}
