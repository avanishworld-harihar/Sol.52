/**
 * Phase 2 — feature flag for v2 asset writes.
 * Set DOCUMENTS_HUB_V2_WRITE=false to roll back to legacy table writes only.
 */

export function isDocumentsHubV2WriteEnabled(): boolean {
  const raw = process.env.DOCUMENTS_HUB_V2_WRITE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}
