/**
 * CRM household helpers — family members with shared or separate phones.
 * Each person is a distinct lead row; household_id groups them.
 */

import { normalizeLeadPhoneForStorage } from "@/lib/lead-phone";

/** Strip honorifics / punctuation for name comparison. */
export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(shri|smt|mr|mrs|ms|miss|dr|ku|kumari|sri)\b\.?/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * True when two display names likely refer to the same person
 * (exact match after normalize, or one contains the other with enough length).
 */
export function personNamesLikelySame(a: string, b: string): boolean {
  const na = normalizePersonName(a);
  const nb = normalizePersonName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  const ta = new Set(na.split(" ").filter((t) => t.length > 1));
  const tb = new Set(nb.split(" ").filter((t) => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  const minSize = Math.min(ta.size, tb.size);
  return overlap >= minSize && overlap >= 2;
}

export function personNamesLikelyDifferent(a: string, b: string): boolean {
  const na = normalizePersonName(a);
  const nb = normalizePersonName(b);
  if (!na || !nb) return false;
  return !personNamesLikelySame(a, b);
}

export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const pa = normalizeLeadPhoneForStorage(String(a ?? ""));
  const pb = normalizeLeadPhoneForStorage(String(b ?? ""));
  if (!pa || !pb) return false;
  const da = pa.replace(/\D/g, "");
  const db = pb.replace(/\D/g, "");
  if (da === db) return true;
  if (da.length >= 10 && db.length >= 10 && da.slice(-10) === db.slice(-10)) return true;
  return false;
}
