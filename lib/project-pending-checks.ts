/**
 * Unit checks for lib/project-pending.ts
 * Run: npm run test:project-pending
 */

import {
  computePendingInr,
  countProjectsWithBalance,
  hasStoredContract,
  isOutstandingCollectionRow,
  normalizeReceivedInr,
  sumPendingInr,
} from "@/lib/project-pending";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

export function runProjectPendingChecks(): void {
  assertEqual(normalizeReceivedInr(null), 0, "normalizeReceivedInr(null)");
  assertEqual(normalizeReceivedInr(undefined), 0, "normalizeReceivedInr(undefined)");
  assertEqual(normalizeReceivedInr(-5), 0, "normalizeReceivedInr(negative)");
  assertEqual(normalizeReceivedInr(50_000), 50_000, "normalizeReceivedInr(50000)");

  assert(hasStoredContract(0), "hasStoredContract(0)");
  assert(hasStoredContract(100), "hasStoredContract(100)");
  assert(!hasStoredContract(null), "hasStoredContract(null)");
  assert(!hasStoredContract(undefined), "hasStoredContract(undefined)");

  assertEqual(computePendingInr(null, 0), null, "pending when contract null");
  assertEqual(computePendingInr(undefined, 10), null, "pending when contract undefined");
  assertEqual(computePendingInr(100, 30), 70, "basic pending");
  assertEqual(computePendingInr(100, null), 100, "pending with null received");
  assertEqual(computePendingInr(100, 150), 0, "over-payment clamped");
  assertEqual(computePendingInr(0, 0), 0, "zero contract zero received");

  assert(isOutstandingCollectionRow(100, 30), "outstanding row");
  assert(!isOutstandingCollectionRow(100, 100), "fully paid not outstanding");
  assert(!isOutstandingCollectionRow(null, 0), "no contract not outstanding");

  assertEqual(
    sumPendingInr([
      { stored_contract_amount_inr: 100, amount_received_inr: 40 },
      { stored_contract_amount_inr: null, amount_received_inr: 0 },
      { stored_contract_amount_inr: 50, amount_received_inr: 50 },
    ]),
    60,
    "sumPendingInr"
  );

  assertEqual(
    countProjectsWithBalance([
      { stored_contract_amount_inr: 100, amount_received_inr: 40 },
      { stored_contract_amount_inr: null, amount_received_inr: 0 },
      { stored_contract_amount_inr: 50, amount_received_inr: 50 },
      { stored_contract_amount_inr: 200, amount_received_inr: 250 },
    ]),
    1,
    "countProjectsWithBalance"
  );
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1]?.replace(/\\/g, "/").includes("project-pending-checks");

if (isMain) {
  runProjectPendingChecks();
  console.log("[project-pending] all checks passed");
}
