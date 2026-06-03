# Customer Documents Hub — Phase 4 Production Rollout Checklist

**Phase:** 4 Stabilization (non-destructive)  
**Not in this rollout:** legacy read OFF, DROP migrations, automatic backfill `--execute`

---

## Pre-flight (before any backfill execute)

- [ ] Migrations **048**, **049**, **050** applied in production Supabase
- [ ] `DOCUMENTS_HUB_V2_WRITE=true` in production env
- [ ] `DOCUMENTS_HUB_PROPOSAL_PERSIST=true` in production env
- [ ] `DOCUMENTS_HUB_LEGACY_READ` **not** set to `false` (Phase 4 requirement)
- [ ] Baseline captured: `node scripts/phase4-stabilization-audit.mjs` → `phase4-stabilization/baseline-counts.json`
- [ ] Backfill dry-run reviewed: `phase4-stabilization/phase4-backfill-dry-run.json` — **migratable_row_counts** approved by engineering + ops
- [ ] Orphan skip list (`orphan_project_no_lead_id`) reviewed and accepted
- [ ] Supabase backup / PITR checkpoint recorded (ops)
- [ ] No migration in repo that `DROP`s `customer_files` or `project_documents`

---

## 4A — Validation and soak (14–30 days)

- [ ] Daily or weekly: compare `customer_files` and `project_documents` row counts to baseline
- [ ] Target: **0** new legacy rows while v2 write flag is on
- [ ] Log exceptions in `docs/verification/customer-documents-hub/phase4-stabilization/legacy-write-soak-log.md`
- [ ] Regression (staging or prod read-only): `SKIP_UPLOAD=1 node scripts/phase2-validation-audit.mjs`
- [ ] Proposal regression: `node scripts/phase3-manual-e2e.mjs` (linked proposal sample)

**4A sign-off:** Engineering records PASS in soak log when window complete with zero legacy writes (or documented exceptions).

---

## 4B — Backfill execute (ops only, after approval)

**Gate:** Dry-run report approved in writing. Do **not** run `--execute` from CI or deploy hooks.

```bash
# 1. Dry-run (default — safe)
node scripts/backfill-document-assets.mjs --dry-run --json-out=docs/verification/customer-documents-hub/phase4-stabilization/phase4-backfill-dry-run.json

# 2. After explicit approval only
node scripts/backfill-document-assets.mjs --execute
```

- [ ] Post-execute: `node scripts/phase4-data-verification.mjs`
- [ ] Post-execute: re-run `node scripts/phase4-stabilization-audit.mjs`
- [ ] Spot-check: download 3 migrated files from hub (customer + project categories)
- [ ] Export map: `node scripts/backfill-document-assets.mjs --rollback-report`

**Expected:** Legacy table row counts **unchanged**; `customer_assets` / `project_assets` grow; `document_migration_map` populated.

---

## Rollback

| Scenario | Action |
|----------|--------|
| V2 writes misbehaving | Set `DOCUMENTS_HUB_V2_WRITE=false` → legacy writes only; hub still merges legacy |
| Proposal persist issue | Set `DOCUMENTS_HUB_PROPOSAL_PERSIST=false` |
| Backfill mistake | Use `backfill-rollback-report.json`; delete/archive `new_id` rows per map; delete map rows (manual, ops-run) |
| Hub read issue | **Do not** disable legacy merge in Phase 4 |

Rollback SQL hints are in the rollback report JSON artifact — **no automated row delete** in scripts.

---

## Communication

- [ ] Ops: backfill window (additive; low risk to blobs)
- [ ] Support: possible duplicate filenames in hub after backfill (legacy + v2)
- [ ] Engineering: Phase 5 retirement is a **separate** approval track

---

## Success criteria (Phase 4 stabilization complete)

| # | Criterion |
|---|-----------|
| 1 | Legacy write soak: 14+ days, 0 new legacy rows (v2 on) |
| 2 | 4A verification documented |
| 3 | Backfill execute (if approved): map populated; data verification PASS |
| 4 | Legacy tables preserved |
| 5 | Phase 2 + Phase 3 audits PASS |
| 6 | Rollback docs and artifacts in `phase4-stabilization/` |

**Suggested tag (after review only):** `phase4-documents-hub-stabilization-complete`
