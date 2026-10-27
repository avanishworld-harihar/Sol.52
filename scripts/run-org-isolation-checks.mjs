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

function canAccessOwned({ resourceOrg, assignee, sessionOrg, userId, role }) {
  if (resourceOrg !== sessionOrg) return false;
  if (role === "company_admin") return true;
  return Boolean(assignee && assignee === userId);
}

assert.equal(canAccessOwned({ resourceOrg: "org-a", assignee: "u-1", sessionOrg: "org-a", userId: "u-1", role: "employee" }), true);
assert.equal(canAccessOwned({ resourceOrg: "org-a", assignee: "u-2", sessionOrg: "org-a", userId: "u-1", role: "employee" }), false);
assert.equal(canAccessOwned({ resourceOrg: "org-a", assignee: null, sessionOrg: "org-a", userId: "u-1", role: "employee" }), false);
assert.equal(canAccessOwned({ resourceOrg: "org-a", assignee: "u-2", sessionOrg: "org-a", userId: "owner", role: "company_admin" }), true);
assert.equal(canAccessOwned({ resourceOrg: "org-b", assignee: "u-1", sessionOrg: "org-a", userId: "owner", role: "company_admin" }), false);

console.log("employee ownership checks passed");

function canAccessFieldSection({ resourceOrg, assignee, sessionOrg, userId, role, workRole }) {
  if (resourceOrg !== sessionOrg) return false;
  if (role === "company_admin" || assignee === userId) return true;
  return workRole === "field_staff" || workRole === "hybrid";
}

assert.equal(canAccessFieldSection({ resourceOrg: "org-a", assignee: "sales-1", sessionOrg: "org-a", userId: "field-1", role: "employee", workRole: "field_staff" }), true);
assert.equal(canAccessFieldSection({ resourceOrg: "org-a", assignee: "sales-1", sessionOrg: "org-a", userId: "sales-2", role: "employee", workRole: "office_sales" }), false);
assert.equal(canAccessFieldSection({ resourceOrg: "org-b", assignee: "sales-1", sessionOrg: "org-a", userId: "field-1", role: "employee", workRole: "field_staff" }), false);

console.log("field section access checks passed");
