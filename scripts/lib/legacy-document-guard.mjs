/**
 * Phase E — block accidental legacy document table mutations from ops scripts.
 * Runtime app code must not call these tables; approved scripts set:
 *   ALLOW_LEGACY_DOCUMENT_SCRIPT_MUTATIONS=true
 */

export const LEGACY_DOCUMENT_TABLE_NAMES = Object.freeze([
  "customer_files",
  "project_documents",
]);

const ALLOW_ENV = "ALLOW_LEGACY_DOCUMENT_SCRIPT_MUTATIONS";

export function isLegacyDocumentScriptMutationsAllowed() {
  const raw = process.env[ALLOW_ENV]?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "on";
}

/**
 * Call at the top of scripts that INSERT/UPDATE/DELETE legacy document tables.
 */
export function assertLegacyDocumentScriptMutationsAllowed(scriptName, action) {
  if (isLegacyDocumentScriptMutationsAllowed()) return;
  console.error(
    `[legacy-document-guard] Blocked: ${scriptName} — ${action} on legacy document tables.`
  );
  console.error(
    `Set ${ALLOW_ENV}=true only for approved one-off backfill/revert (never in production app).`
  );
  process.exit(1);
}

/**
 * Fail if DOCUMENTS_HUB_V2_WRITE would disable v2 writes (removed from app; guard for old env).
 */
export function assertNoLegacyWriteEnvFlags(scriptName) {
  const raw = process.env.DOCUMENTS_HUB_V2_WRITE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") {
    console.error(
      `[legacy-document-guard] ${scriptName}: DOCUMENTS_HUB_V2_WRITE=false is no longer supported (legacy writes removed from app).`
    );
    process.exit(1);
  }
  const legacyRead = process.env.DOCUMENTS_HUB_LEGACY_READ?.trim().toLowerCase();
  if (legacyRead === "true" || legacyRead === "1" || legacyRead === "on") {
    console.warn(
      `[legacy-document-guard] ${scriptName}: DOCUMENTS_HUB_LEGACY_READ is set but app ignores it after Phase C retirement.`
    );
  }
}
