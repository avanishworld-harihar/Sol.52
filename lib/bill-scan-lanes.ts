/**
 * Bill scan lanes — keep residential LT and commercial HT pipelines isolated.
 *
 * Architecture (multi-state safe):
 * - Lane is chosen from client `billTypeHint` (residential → "lt", HT → "ht").
 * - Shared API route (`/api/analyze-bill`) dispatches post-parse steps by lane.
 * - State/DISCOM rules come from registries (`getBillingRule`, future
 *   `lib/discom/<state>/…`). One state's sanitizer must no-op for others.
 * - Do not merge HT industrial heuristics into the residential LT lane.
 *
 * Locked residential MP path: `lib/residential-bill-path-lock.ts`.
 */

import type { ParsedBillShape } from "@/lib/bill-parse";
import { sanitizeMpMeteredVsSubsidyFields } from "@/lib/mp-bill-field-sanitize";
import { sanitizeHtBillConsumption, sanitizeLtBillFields } from "@/lib/ht-bill-sanitize";
import { RESIDENTIAL_LT_BILL_LANE } from "@/lib/residential-bill-path-lock";

export type BillScanLane = "residential_lt" | "commercial_lt" | "commercial_ht";

export type BillTypeHint = "auto" | "lt" | "ht";

/**
 * Resolve lane from Proposal OS hint.
 * Residential + commercial LT both use LT sanitizers; HT never shares that path.
 */
export function resolveBillScanLane(hint: BillTypeHint = "auto"): BillScanLane {
  if (hint === "ht") return "commercial_ht";
  if (hint === "lt") return "residential_lt";
  // "auto" is legacy — prefer LT-safe handling so HT rules do not leak into homes.
  return RESIDENTIAL_LT_BILL_LANE;
}

/**
 * Post-AI / post-PDF field guards, isolated by lane.
 * Commercial HT work should extend the `commercial_ht` branch only.
 */
export function applyBillLanePostParse(
  parsed: ParsedBillShape,
  hint: BillTypeHint = "auto"
): ParsedBillShape {
  const lane = resolveBillScanLane(hint);

  if (lane === "commercial_ht") {
    // HT-only: do not run residential LT strip / MP domestic subsidy repair here
    // beyond what sanitizeHt needs. MP subsidy sanitizer no-ops for non-MP shapes.
    let next = sanitizeMpMeteredVsSubsidyFields(parsed);
    next = sanitizeHtBillConsumption(next, "ht");
    return next;
  }

  // residential_lt (+ commercial LT using the same hint)
  let next = sanitizeMpMeteredVsSubsidyFields(parsed);
  next = sanitizeLtBillFields(next, "lt");
  // Explicitly skip HT consumption rewrite on LT lane.
  return next;
}

export function isCommercialHtLane(hint: BillTypeHint): boolean {
  return resolveBillScanLane(hint) === "commercial_ht";
}
