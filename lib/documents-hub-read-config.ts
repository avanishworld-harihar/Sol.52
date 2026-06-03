/**
 * Phase 5A — hub/API legacy table reads (customer_files, project_documents merge).
 * Default OFF after Phase 5A. Set DOCUMENTS_HUB_LEGACY_READ=true to rollback Phase 4 merge behavior.
 */

export function isDocumentsHubLegacyReadEnabled(): boolean {
  const raw = process.env.DOCUMENTS_HUB_LEGACY_READ?.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return false;
}
