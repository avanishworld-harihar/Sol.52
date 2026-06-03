# Customer Documents Hub — Phase 4 Validation Report

**Generated:** 2026-06-03  
**Audit:** `node scripts/phase4-stabilization-audit.mjs` (exit 0)  
**Data verification:** `node scripts/phase4-data-verification.mjs` (exit 0)  
**Backfill execute:** completed 2026-06-03 — see **final** report below  
**Commit / tag:** none (awaiting human review)

> **Superseded for post-execute:** [`customer-documents-hub-phase4-final-validation-report.md`](./customer-documents-hub-phase4-final-validation-report.md) and [`customer-documents-hub-phase4-execution-report.md`](./customer-documents-hub-phase4-execution-report.md)

---

## Executive summary

| Area | Result |
|------|--------|
| Phase 4 scope (non-destructive) | **PASS** |
| Migrations 048 / 049 / 050 applied | **PASS** |
| Feature flags (local `.env.local`) | **PASS** — v2 write + proposal persist on |
| No Phase 2+ DROP legacy migrations | **PASS** (049–050 only scanned) |
| Backfill dry-run | **PASS** — 8 migratable, 5 skipped (orphan) |
| Phase 2 regression (`SKIP_UPLOAD=1`) | **PASS** |
| Phase 3 manual E2E | **PASS** |
| Legacy write soak (14d proxy) | **PENDING_OPS_SOAK** |
| Backfill `--execute` | **not approved / not run** |

**Overall implementation audit:** **PASS** with **ops follow-ups** before Phase 4 can be considered fully complete in production.

---

## 1. Scope compliance

| Rule | Status |
|------|--------|
| No `DOCUMENTS_HUB_LEGACY_READ=false` | Compliant — flag unset |
| No DROP migrations in 049+ | Compliant |
| No destructive schema change | Compliant |
| No automatic backfill `--execute` | Compliant |

---

## 2. Baseline counts (2026-06-03)

| Table | Count |
|-------|------:|
| customer_assets | 16 |
| project_assets | 14 |
| asset_links | 4 |
| document_migration_map | 0 |
| proposal_assets | 2 |
| customer_files | 3 |
| project_documents | 12 |

Artifact: `docs/verification/customer-documents-hub/phase4-stabilization/baseline-counts.json`

---

## 3. Backfill dry-run (approval required before execute)

| Metric | Value |
|--------|------:|
| **Migratable total** | **8** |
| customer_files | 3 |
| project_documents | 5 |
| Skipped total | 5 |
| Skip reason | `orphan_project_no_lead_id` (5) |
| Errors | 0 |

Artifact: `docs/verification/customer-documents-hub/phase4-stabilization/phase4-backfill-dry-run.json`

**Execute command (do not run without approval):**

```bash
node scripts/backfill-document-assets.mjs --execute
```

---

## 4. Legacy write soak

| Window | 14 days |
|--------|---------|
| project_documents with `created_at` in window | 12 |
| customer_files with `created_at` in window | 3 |
| Proxy status | `PENDING_OPS_SOAK` |

Historical and audit-test legacy rows fall inside the 14-day window; this does **not** indicate v2 writes are failing. Ops must run the **14–30 day** soak log (`legacy-write-soak-log.md`) and confirm **zero net new** legacy rows while `DOCUMENTS_HUB_V2_WRITE=true`.

Phase 3 E2E during this audit showed **0 delta** on legacy tables for the proposal test cycle.

---

## 5. Orphan policy

| Metric | Value |
|--------|------:|
| Projects without `lead_id` (sample) | 3 |
| Active `project_documents` on those projects | 5 |

These rows are **skipped** by backfill and remain visible via **legacy hub merge** when applicable.

---

## 6. Regression

| Script | Result |
|--------|--------|
| `phase2-validation-audit.mjs` (`SKIP_UPLOAD=1`) | exit 0 |
| `phase3-manual-e2e.mjs` | exit 0 — hub proposal + download |

---

## 7. Rollback readiness

| Item | State |
|------|--------|
| `document_migration_map` rows | 0 (backfill not executed) |
| Rollback report export | `backfill-rollback-report.json` |
| Flag rollback | Documented in production rollout checklist |

---

## 8. Deliverables added in Phase 4

| Path | Purpose |
|------|---------|
| `scripts/phase4-stabilization-audit.mjs` | Main stabilization audit |
| `scripts/phase4-data-verification.mjs` | Map / legacy verification |
| `scripts/backfill-document-assets.mjs` | `--json-out`, skip breakdown |
| `docs/architecture/customer-documents-hub-phase4-production-rollout-checklist.md` | Ops checklist |
| `docs/architecture/customer-documents-hub-handoff-phase4-stabilization.md` | Handoff |
| `docs/verification/.../phase4-stabilization/*` | Audit artifacts |

---

## 9. Reviewer actions

1. Review dry-run: **8 migratable / 5 orphan skips** — approve or adjust orphan data before `--execute`.
2. Assign ops **14–30 day** legacy-write soak using baseline counts above.
3. After soak PASS + dry-run approval: run `--execute`, then re-run data verification + audit.
4. Commit and tag `phase4-documents-hub-stabilization-complete` only after sign-off (not done in this run).

---

## 10. Full audit JSON

See `docs/verification/customer-documents-hub/phase4-stabilization/phase4-audit-report.json`.
