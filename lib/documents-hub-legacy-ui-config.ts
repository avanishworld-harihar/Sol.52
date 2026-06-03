/**
 * Client-visible legacy upload UI (Quick upload sections).
 * Mirror server flag via NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ.
 */

export function isLegacyDocumentUploadUiEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ?.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return false;
}
