# Customer Documents Hub — Phase 4 Backfill Execution Report

**Executed:** 2026-06-03T13:19:59Z  
**Command:** `node scripts/backfill-document-assets.mjs --execute`  
**Approval:** Dry-run reviewed and approved  
**Commit / tag:** none

---

## 1. Execution summary

| Metric | Value |
|--------|------:|
| Rows migrated | **8** |
| Errors | **0** |
| Skipped (orphan) | **5** |
| `document_migration_map` rows created | **8** |
| Legacy rows deleted/updated | **0** |

**Result:** **SUCCESS**

---

## 2. Migration map breakdown

| Legacy table | Count | New table |
|--------------|------:|-----------|
| customer_files | 3 | customer_assets |
| project_documents | 5 | customer_assets (4), project_assets (1) |

Full map export: `docs/verification/customer-documents-hub/phase4-stabilization/backfill-rollback-report.json`

---

## 3. Before / after row counts

| Table | Before | After | Δ |
|-------|-------:|------:|--:|
| customer_assets | 16 | 23 | +7 |
| project_assets | 14 | 15 | +1 |
| asset_links | 4 | 4 | 0 |
| document_migration_map | 0 | 8 | +8 |
| proposal_assets | 2 | 3 | +1* |
| **customer_files** | **3** | **3** | **0** |
| **project_documents** | **12** | **12** | **0** |

\* `proposal_assets` +1 is from live proposal persist during the audit window, not backfill.

Artifact: `phase4-stabilization/before-after-row-counts.json`

---

## 4. Post-execute verification

| Check | Result |
|-------|--------|
| `phase4-data-verification.mjs` | **PASS** — 8 map rows, 0 broken targets |
| `phase4-stabilization-audit.mjs` | **PASS** |
| `phase4-hub-verification.mjs` | **PASS** — hub returns all sources |
| Phase 2 regression (`SKIP_UPLOAD=1`) | **PASS** |
| Phase 3 manual E2E | **PASS** |
| Re-run dry-run migratable | **0** (8 already_mapped) |

---

## 5. Unified hub (Bharti lead `eead2c0a-…`)

| Query | HTTP | Total items | Sources |
|-------|------|------------:|---------|
| All (paginated default) | 200 | 40 | proposal 4, project_assets 13, customer_assets 19, legacy pd 2, legacy cf 2 |
| `?limit=100` | 200 | 50 | Includes 8 legacy rows (expected duplicates with v2) |
| `owner=customer` | 200 | 30 | PASS |
| `owner=project` | 200 | 16 | PASS |
| `owner=proposal` | 200 | 4 | PASS |

All items returned `download_url`. Duplicate legacy + v2 entries for backfilled files are **expected** per Phase 4 plan.

Artifact: `phase4-stabilization/hub-verification-report.json`

---

## 6. Rollback status

| Item | Status |
|------|--------|
| Map exported | **8 rows** in `backfill-rollback-report.json` |
| Automated rollback | **Not run** (manual ops only) |
| Flag rollback | Unchanged — legacy read **not** disabled |
| Rollback procedure | Delete/archive `new_id` per map row; delete map rows; legacy tables untouched |

---

## 7. Remaining orphan rows

**5** `project_documents` on projects without `lead_id` — not migrated.

Artifact: `phase4-stabilization/remaining-orphan-rows-report.json`

---

## 8. Scope compliance

| Rule | Compliant |
|------|-----------|
| Legacy read OFF | No |
| DROP migrations | No |
| Destructive schema | No |
| Commit / tag | No |

---

## 9. Awaiting review

- Confirm duplicate hub entries acceptable for support
- Continue 14–30 day legacy-write soak (`legacy-write-soak-log.md`)
- Sign-off before commit/tag `phase4-documents-hub-stabilization-complete`
