/**
 * Sol.52 — Financial Module: pending amount calculations.
 *
 * Canonical rules (Collections Radar):
 * - Pending uses **stored** `projects.contract_amount_inr` only — never proposal fallbacks.
 * - When stored contract is null/undefined, pending is null (unknown — not zero).
 * - Received defaults to 0 when null/undefined.
 * - Pending is clamped to >= 0 (over-payment does not produce negative pending).
 *
 * Task 1: utility only — callers migrate in later tasks.
 */

/** Coerce DB/API numeric fields to a finite non-negative INR amount, else 0. */
export function normalizeReceivedInr(
  amountReceivedInr: number | null | undefined
): number {
  const n = Number(amountReceivedInr ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** True when the project row has an explicit stored contract value in the database. */
export function hasStoredContract(
  storedContractAmountInr: number | null | undefined
): boolean {
  if (storedContractAmountInr == null) return false;
  const n = Number(storedContractAmountInr);
  return Number.isFinite(n) && n >= 0;
}

/**
 * Pending = max(0, storedContract − received).
 * Returns null when stored contract is not set.
 */
export function computePendingInr(
  storedContractAmountInr: number | null | undefined,
  amountReceivedInr: number | null | undefined
): number | null {
  if (!hasStoredContract(storedContractAmountInr)) return null;

  const contract = Number(storedContractAmountInr);
  const received = normalizeReceivedInr(amountReceivedInr);
  const pending = contract - received;
  if (!Number.isFinite(pending)) return null;
  return Math.max(0, pending);
}

/** Whether a project row qualifies for outstanding collections (stored contract + pending > 0). */
export function isOutstandingCollectionRow(
  storedContractAmountInr: number | null | undefined,
  amountReceivedInr: number | null | undefined
): boolean {
  const pending = computePendingInr(storedContractAmountInr, amountReceivedInr);
  return pending != null && pending > 0;
}

/** Sum pending across rows; skips projects without stored contract. */
export function sumPendingInr(
  rows: ReadonlyArray<{
    stored_contract_amount_inr?: number | null;
    contract_amount_inr?: number | null;
    amount_received_inr?: number | null;
  }>,
  opts?: { useStoredField?: boolean }
): number {
  const useStored = opts?.useStoredField !== false;
  let total = 0;
  for (const row of rows) {
    const stored = useStored
      ? row.stored_contract_amount_inr
      : row.contract_amount_inr;
    const pending = computePendingInr(stored, row.amount_received_inr);
    if (pending != null) total += pending;
  }
  return total;
}

type PendingRowInput = {
  stored_contract_amount_inr?: number | null;
  contract_amount_inr?: number | null;
  amount_received_inr?: number | null;
};

function storedContractFromRow(
  row: PendingRowInput,
  useStoredField: boolean
): number | null | undefined {
  return useStoredField ? row.stored_contract_amount_inr : row.contract_amount_inr;
}

/** Count projects with stored contract and pending > 0 (collections-eligible). */
export function countProjectsWithBalance(
  rows: ReadonlyArray<PendingRowInput>,
  opts?: { useStoredField?: boolean }
): number {
  const useStored = opts?.useStoredField !== false;
  let count = 0;
  for (const row of rows) {
    const stored = storedContractFromRow(row, useStored);
    if (isOutstandingCollectionRow(stored, row.amount_received_inr)) count++;
  }
  return count;
}
