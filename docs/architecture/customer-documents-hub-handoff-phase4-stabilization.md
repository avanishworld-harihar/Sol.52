# Customer Documents Hub — Phase 4 Stabilization Handoff

**Purpose:** Non-destructive production stabilization after Phase 3.  
**Status:** Implementation complete — **awaiting review** (no commit/tag in agent run)  
**Prerequisite tags:** `phase1-documents-hub-complete`, `phase2-documents-hub-complete`, `phase3-documents-hub-complete`  
**Date:** June 2026

---

## 1. What shipped (Phase 4 only)

| Area | Summary |
|------|---------|
| **4A audit** | `scripts/phase4-stabilization-audit.mjs` — counts, flags, soak proxy, regression hooks |
| **Data verification** | `scripts/phase4-data-verification.mjs` — legacy vs map, integrity sample |
| **Backfill reporting** | `backfill-document-assets.mjs` — `--json-out`, skip breakdown, rollback report path |
| **Docs** | Production rollout checklist, validation report, soak log template |
| **Artifacts** | `docs/verification/customer-documents-hub/phase4-stabilization/` |

**Not shipped:** `DOCUMENTS_HUB_LEGACY_READ=false`, migration 051+, DROP legacy tables, backfill `--execute`, UI consolidation.

---

## 2. Scripts

| Script | Command | Destructive? |
|--------|---------|--------------|
| Stabilization audit | `node scripts/phase4-stabilization-audit.mjs` | No |
| Data verification | `node scripts/phase4-data-verification.mjs` | No |
| Backfill dry-run | `node scripts/backfill-document-assets.mjs --dry-run --json-out=docs/verification/.../phase4-backfill-dry-run.json` | No |
| Backfill execute | `node scripts/backfill-document-assets.mjs --execute` | Additive only — **requires approval** |
| Rollback map export | `node scripts/backfill-document-assets.mjs --rollback-report` | No |

Env for audit:

| Variable | Default | Effect |
|----------|---------|--------|
| `SKIP_REGRESSION=1` | off | Skip phase2/phase3 child scripts |
| `SKIP_PHASE3=1` | off | Skip phase3 manual E2E only |
| `SKIP_UPLOAD=1` | (phase2 child) | No test uploads |
| `PHASE4_SOAK_DAYS` | 14 | Legacy write window |
| `BASE_URL` | `http://localhost:3000` | Hub API regression |

---

## 3. Feature flags (unchanged)

| Env | Phase 4 expectation |
|-----|---------------------|
| `DOCUMENTS_HUB_V2_WRITE` | **true** (default on) |
| `DOCUMENTS_HUB_PROPOSAL_PERSIST` | **true** (default on) |
| `DOCUMENTS_HUB_LEGACY_READ` | **unset or true** — do not turn off in Phase 4 |

---

## 4. Backfill approval gate

Before any `--execute`:

1. Run dry-run and archive `phase4-backfill-dry-run.json`
2. Review **migratable_row_counts** and **skipped.by_reason**
3. Obtain explicit ops/engineering approval
4. Record PITR/backup checkpoint
5. Run execute manually; re-run data verification + audit

---

## 5. Verification artifacts

| File | Description |
|------|-------------|
| `phase4-stabilization/baseline-counts.json` | Table counts at audit time |
| `phase4-stabilization/phase4-backfill-dry-run.json` | Migratable / skipped counts |
| `phase4-stabilization/phase4-audit-report.json` | Full audit JSON |
| `phase4-stabilization/backfill-rollback-report.json` | Map export for rollback planning |
| `phase4-stabilization/data-verification-report.json` | Data verification output |
| `phase4-stabilization/legacy-write-soak-log.md` | Ops daily soak template |

---

## 6. Deferred — Phase 5 pointer

When separately approved:

- Legacy read retirement flag
- Extended soak with legacy read off
- DROP `customer_files` / `project_documents`
- Hub dedupe / UI consolidation

See `customer-documents-hub-phase4-plan.md` §9.

---

## 7. Review checklist

- [ ] Validation report reviewed (`customer-documents-hub-phase4-validation-report.md`)
- [ ] Dry-run migratable counts acceptable
- [ ] Soak plan assigned to ops (14–30 days)
- [ ] No accidental `--execute` in deploy pipeline
- [ ] Commit + tag `phase4-documents-hub-stabilization-complete` only after human sign-off
