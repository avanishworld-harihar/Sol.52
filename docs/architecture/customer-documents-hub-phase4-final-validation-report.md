# Customer Documents Hub — Phase 4 Final Validation Report

**Generated:** 2026-06-03 (post-backfill execute)  
**Backfill:** **executed** — 8 rows, 0 errors  
**Commit / tag:** none — awaiting review

---

## Executive summary

| Gate | Result |
|------|--------|
| Backfill execute | **PASS** (8/8 migratable) |
| `document_migration_map` | **PASS** (8 entries, integrity sample OK) |
| Legacy table preservation | **PASS** (`customer_files` 3→3, `project_documents` 12→12) |
| V2 table growth | **PASS** (+7 customer_assets, +1 project_assets from backfill) |
| Unified hub API | **PASS** |
| Phase 2 regression | **PASS** |
| Phase 3 regression | **PASS** |
| Data verification script | **PASS** |
| Stabilization audit | **PASS** |
| Legacy write soak (ops) | **PENDING** — 14–30 day window still required |

**Final validation:** **PASS** for backfill execution and technical verification. **Ops soak** remains open for full Phase 4 production sign-off.

---

## 1. Backfill execution

```text
node scripts/backfill-document-assets.mjs --execute
→ Rows migrated: 8, Errors: 0
```

See: `customer-documents-hub-phase4-execution-report.md`

---

## 2. Row count verification

| Verification | Expected | Actual | OK |
|--------------|----------|--------|-----|
| Map entries | 8 | 8 | ✓ |
| customer_files unchanged | 3 | 3 | ✓ |
| project_documents unchanged | 12 | 12 | ✓ |
| customer_assets delta | +7 | 16→23 | ✓ |
| project_assets delta | +1 | 14→15 | ✓ |
| Unmigrated migratable rows | 0 | dry-run 0 | ✓ |

---

## 3. `document_migration_map`

| Check | Result |
|-------|--------|
| Row count | 8 |
| Integrity sample (8 rows) | 0 missing `new_id` targets |
| customer_files mapped | 3/3 |
| Migratable project_documents mapped | 5/5 (linked project) |

---

## 4. Data verification (`phase4-data-verification.mjs`)

```json
{
  "summary": "PASS",
  "map_rows": 8,
  "missing_targets": 0,
  "customer_assets_backfill_channel": 7
}
```

Note: 7 rows use `source_channel=backfill` in `customer_assets`; 1 migrated row landed in `project_assets`.

---

## 5. Unified hub

Script: `scripts/phase4-hub-verification.mjs` — **PASS**

- All owner filters return 200 + `ok: true`
- Combined sources: `customer_assets`, `project_assets`, `proposal_assets`, `customer_files`, `project_documents`
- Post-backfill: expect **duplicate** entries (legacy + v2) for migrated files — observed (`legacy_count` 8 at `limit=100`)

---

## 6. Regression

| Script | Exit | Summary |
|--------|------|---------|
| `phase2-validation-audit.mjs` (`SKIP_UPLOAD=1`) | 0 | Hub + schema checks PASS |
| `phase3-manual-e2e.mjs` | 0 | Proposal hub + download PASS; legacy deltas 0 |

---

## 7. Rollback status

| Item | Value |
|------|-------|
| Map export | `backfill-rollback-report.json` (8 rows) |
| Rollback executed | **No** |
| Legacy tables | Intact |
| Flags | `DOCUMENTS_HUB_LEGACY_READ` not disabled |

Manual rollback: remove v2 rows listed in map; delete map rows; legacy data remains.

---

## 8. Remaining orphans

| Count | Reason |
|------:|--------|
| 5 | `orphan_project_no_lead_id` |

Report: `phase4-stabilization/remaining-orphan-rows-report.json`

---

## 9. Artifacts index

| File | Purpose |
|------|---------|
| `phase4-stabilization/phase4-backfill-execute-result.json` | Execute summary |
| `phase4-stabilization/before-after-row-counts.json` | Count comparison |
| `phase4-stabilization/backfill-rollback-report.json` | Rollback map |
| `phase4-stabilization/hub-verification-report.json` | Hub API proof |
| `phase4-stabilization/phase4-audit-report.json` | Full stabilization audit |
| `phase4-stabilization/data-verification-report.json` | Data verification |
| `phase4-stabilization/remaining-orphan-rows-report.json` | Orphan list |
| `customer-documents-hub-phase4-execution-report.md` | Execution narrative |

---

## 10. Reviewer sign-off checklist

- [ ] Backfill counts and map reviewed
- [ ] Duplicate hub entries acknowledged for support
- [ ] Orphan rows accepted or remediation scheduled
- [ ] Legacy-write soak assigned to ops
- [ ] Approve commit + tag when ready

**Do not tag until human approval after this report.**
