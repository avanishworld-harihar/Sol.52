/**
 * Residential bill upload path (Proposal OS) — development lock.
 *
 * Madhya Pradesh LT / domestic bill scanning is **working and locked**.
 * Do not change these modules when building commercial HT, other-state DISCOMs,
 * or shared refactors — unless the user explicitly asks to change residential
 * (MP) bill upload.
 *
 * Multi-state rule: add a new DISCOM/state adapter; do not broaden MP-only
 * sanitizers or prompts to “fix” another state.
 *
 * See also `.cursor/rules/residential-bill-path-lock.mdc` and `lib/bill-scan-lanes.ts`.
 */

export const RESIDENTIAL_BILL_PATH_DEV_LOCKED = true;

/** Canonical residential / LT scan lane id used in Proposal OS. */
export const RESIDENTIAL_LT_BILL_LANE = "residential_lt" as const;

/**
 * Frozen for residential MP LT bill upload. Edit only when the user explicitly
 * asks to change residential bill scanning.
 */
export const RESIDENTIAL_BILL_FROZEN_PATHS = [
  "lib/resolve-bill-month.ts",
  "lib/mp-bill-field-sanitize.ts",
  "lib/mp-bill-month.ts",
  "lib/mp-bill-engine.ts",
  "lib/mp-bill-audit.ts",
  "lib/mp-bill-audit-fetch.ts",
  "lib/mp-bill-audit-persistence.ts",
  "lib/pdf-bill-fallback.ts",
  "lib/discom-billing-rules.ts",
  // Prompt + model routing for LT domestic (shared file — prefer lane guards / new HT modules)
  "lib/anthropic.ts",
  "lib/bill-ai.ts",
] as const;

/**
 * Prefer putting commercial HT / new-state work here (or new folders) instead of
 * editing frozen residential paths.
 */
export const BILL_EXTENSION_SAFE_PATHS = [
  "lib/ht-bill-sanitize.ts",
  "lib/bill-scan-lanes.ts",
  "lib/discom/", // future per-state adapters: lib/discom/mp/, lib/discom/mh/, …
] as const;

export function isResidentialBillFrozenPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return RESIDENTIAL_BILL_FROZEN_PATHS.some(
    (p) => normalized === p || normalized.endsWith(`/${p}`) || normalized.includes(`/${p}`)
  );
}
