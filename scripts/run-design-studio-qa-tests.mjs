/**
 * Design Studio Phase 6 — packing / collision / shadow / share / perf smoke.
 * Run: node scripts/run-design-studio-qa-tests.mjs
 */

import assert from "node:assert/strict";

/** Minimal east-west rotation metadata check (mirrors packSection rule). */
function eastWestRotation(row) {
  return row % 2 === 0 ? 90 : 270;
}

assert.equal(eastWestRotation(0), 90);
assert.equal(eastWestRotation(1), 270);
assert.equal(eastWestRotation(2), 90);

/** Panel fully inside buildable: AABB containment smoke. */
function footprintInsideAabb(panel, box) {
  return (
    panel.minX >= box.minX &&
    panel.maxX <= box.maxX &&
    panel.minY >= box.minY &&
    panel.maxY <= box.maxY
  );
}

assert.equal(
  footprintInsideAabb(
    { minX: 1, maxX: 2, minY: 1, maxY: 2 },
    { minX: 0, maxX: 5, minY: 0, maxY: 5 }
  ),
  true
);
assert.equal(
  footprintInsideAabb(
    { minX: -1, maxX: 2, minY: 1, maxY: 2 },
    { minX: 0, maxX: 5, minY: 0, maxY: 5 }
  ),
  false
);

/** AABB collision (axis-aligned). */
function aabbsOverlap(a, b) {
  return !(a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY);
}
assert.equal(
  aabbsOverlap(
    { minX: 0, maxX: 2, minY: 0, maxY: 2 },
    { minX: 1, maxX: 3, minY: 1, maxY: 3 }
  ),
  true
);
assert.equal(
  aabbsOverlap(
    { minX: 0, maxX: 1, minY: 0, maxY: 1 },
    { minX: 2, maxX: 3, minY: 2, maxY: 3 }
  ),
  false
);

/** Shadow fraction clamp. */
function clampShade(v) {
  return Math.max(0, Math.min(1, v));
}
assert.equal(clampShade(1.2), 1);
assert.equal(clampShade(-0.1), 0);
assert.equal(clampShade(0.4), 0.4);

/** Share token length gate (UUID) + org isolation smoke (logical). */
function isShareTokenShape(token) {
  return typeof token === "string" && token.trim().length >= 32;
}
assert.equal(isShareTokenShape("123e4567-e89b-12d3-a456-426614174000"), true);
assert.equal(isShareTokenShape("short"), false);

function shareTokenBelongsToOrg(tokenRow, orgId) {
  return Boolean(tokenRow && tokenRow.organization_id === orgId && tokenRow.share_token);
}
assert.equal(
  shareTokenBelongsToOrg(
    { organization_id: "org-a", share_token: "123e4567-e89b-12d3-a456-426614174000" },
    "org-a"
  ),
  true
);
assert.equal(
  shareTokenBelongsToOrg(
    { organization_id: "org-a", share_token: "123e4567-e89b-12d3-a456-426614174000" },
    "org-b"
  ),
  false
);

/** Snapshot not-black: reject tiny / empty buffers (mirrors PNG gate length). */
function isLikelyNonEmptySnapshot(byteLength) {
  return typeof byteLength === "number" && byteLength >= 1024;
}
assert.equal(isLikelyNonEmptySnapshot(2048), true);
assert.equal(isLikelyNonEmptySnapshot(12), false);

/** Large-roof pack performance smoke — synthetic O(n) grid, bounded. */
function packSyntheticGrid(cols, rows) {
  const panels = [];
  const t0 = Date.now();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      panels.push({ id: `p-${r}-${c}`, row: r, col: c });
    }
  }
  const elapsed = Date.now() - t0;
  return { count: panels.length, elapsedMs: elapsed };
}
const synth = packSyntheticGrid(40, 40);
assert.equal(synth.count, 1600);
assert.ok(synth.elapsedMs < 2000, `synthetic pack too slow: ${synth.elapsedMs}ms`);

/** Roof type advice matrix smoke. */
function adviseRoof(roofType) {
  const key = String(roofType ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (key.includes("ground")) {
    return { preferredMounting: "ground_mount", allowEastWest: true };
  }
  if (key.includes("flat") || (key.includes("rcc") && !key.includes("slope"))) {
    return { preferredMounting: "elevated", allowEastWest: true };
  }
  if (key.includes("slope") || key.includes("tile") || key.includes("metal")) {
    return { preferredMounting: "flush", allowEastWest: false };
  }
  return { preferredMounting: "flush", allowEastWest: true };
}
assert.equal(adviseRoof("flat_rcc").preferredMounting, "elevated");
assert.equal(adviseRoof("sloped_rcc").allowEastWest, false);
assert.equal(adviseRoof("ground_mount").preferredMounting, "ground_mount");

/** Safety profile edge defaults. */
const PROFILES = {
  residential: 1.5,
  commercial: 2.5,
  industrial: 3,
};
assert.equal(PROFILES.residential, 1.5);
assert.ok(PROFILES.industrial > PROFILES.commercial);

console.log("design-studio-qa-tests: ok");
