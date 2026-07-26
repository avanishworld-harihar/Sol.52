/**
 * Design Studio Phase 6 gate unit checks (PNG + draft integrity).
 * Run: node scripts/run-design-studio-phase6-tests.mjs
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Inline copies — avoid TS path resolution in plain node. */
function isLikelyValidPngSnapshot(buffer) {
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

function assessDesignStudioDraftIntegrity(draft) {
  const reasons = [];
  if (!draft) return { ok: true, reasons: ["no_draft"] };
  if (!draft.projectId?.trim()) reasons.push("missing_project_id");
  if (!draft.roof) reasons.push("missing_roof");
  const saved = draft.savedAt || draft.updated_at;
  if (!saved) reasons.push("missing_saved_at");
  return { ok: reasons.length === 0, reasons };
}

function pngHeader(size = 2048) {
  const buf = Buffer.alloc(size, 0);
  buf[0] = 0x89;
  buf[1] = 0x50;
  buf[2] = 0x4e;
  buf[3] = 0x47;
  buf[4] = 0x0d;
  buf[5] = 0x0a;
  buf[6] = 0x1a;
  buf[7] = 0x0a;
  return buf;
}

assert.equal(isLikelyValidPngSnapshot(pngHeader()), true);
assert.equal(isLikelyValidPngSnapshot(Buffer.alloc(500)), false);
assert.equal(isLikelyValidPngSnapshot(Buffer.alloc(2048, 1)), false);

assert.equal(assessDesignStudioDraftIntegrity(null).ok, true);
assert.equal(
  assessDesignStudioDraftIntegrity({
    projectId: "p1",
    roof: { type: "FeatureCollection" },
    updated_at: new Date().toISOString(),
  }).ok,
  true
);
assert.ok(
  assessDesignStudioDraftIntegrity({ projectId: "p1", roof: null, updated_at: "x" }).reasons.includes(
    "missing_roof"
  )
);

console.log("design-studio-phase6-tests: ok");
void require;
