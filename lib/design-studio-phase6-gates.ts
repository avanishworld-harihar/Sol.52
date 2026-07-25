/**
 * Design Studio Phase 6 kickoff — QA gate helpers (snapshot + recovery).
 * Pure checks used by save/load paths; expand as pilot QA grows.
 */

/** PNG magic bytes + minimum size — reject empty / non-image blobs. */
export function isLikelyValidPngSnapshot(buffer: Uint8Array | Buffer): boolean {
  if (!buffer || buffer.length < 1024) return false;
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

export type DesignStudioDraftIntegrity = {
  ok: boolean;
  reasons: string[];
};

/** Lightweight IndexedDB draft integrity for reopen recovery QA. */
export function assessDesignStudioDraftIntegrity(draft: {
  projectId?: string | null;
  roof?: unknown;
  savedAt?: string | null;
} | null): DesignStudioDraftIntegrity {
  const reasons: string[] = [];
  if (!draft) {
    return { ok: true, reasons: ["no_draft"] };
  }
  if (!draft.projectId?.trim()) reasons.push("missing_project_id");
  if (!draft.roof) reasons.push("missing_roof");
  if (!draft.savedAt) reasons.push("missing_saved_at");
  return { ok: reasons.length === 0, reasons };
}

export const DESIGN_STUDIO_PHASE6_GATES = [
  "desktop_ipad_parity",
  "pencil_palm_rejection",
  "indexeddb_draft_recovery",
  "snapshot_not_black",
  "polygon_panel_collision",
  "engineering_shadow_determinism",
  "multi_tenant_rls_share_tokens",
  "large_roof_performance",
  "installer_pilot",
] as const;
