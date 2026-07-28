/**
 * Wave 3 — org isolation sanity checks (no live DB required).
 * Run: node scripts/run-org-isolation-checks.mjs
 */
import assert from "node:assert/strict";

function denyIfCrossOrg(resourceOrg, scopeOrg, mode) {
  if (mode !== "session" || !scopeOrg) return null;
  if (!resourceOrg) return "org_missing_soft_ok";
  if (resourceOrg !== scopeOrg) return "org_forbidden";
  return null;
}

assert.equal(denyIfCrossOrg("org-a", "org-a", "session"), null);
assert.equal(denyIfCrossOrg("org-b", "org-a", "session"), "org_forbidden");
assert.equal(denyIfCrossOrg("org-b", "org-a", "legacy"), null);
assert.equal(denyIfCrossOrg(null, "org-a", "legacy"), null);

console.log("org isolation checks passed");
