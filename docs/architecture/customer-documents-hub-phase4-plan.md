# Customer Documents Hub — Phase 4 Plan (Stabilization — Non-Destructive)

**Status:** Stabilization tooling implemented — **awaiting review** (no commit/tag)  
**No code, no migrations, no commits in this revision**  
**Prerequisite tags:** `phase1-documents-hub-complete`, `phase2-documents-hub-complete`, `phase3-documents-hub-complete`  
**Base:** `main` through `5ae72fc` (tag `phase3-documents-hub-complete`)  
**Date:** June 2026

---

## Executive summary

Phase 4 is redefined as a **non-destructive stabilization phase**: prove production is healthy on v2 writes, optionally **backfill historical legacy metadata** into v2 tables, and document rollback paths — **without** turning off legacy hub reads, **without** DROP migrations, and **without** any destructive schema change.

| Approved for Phase 4 | Deferred (not approved — future phase) |
|----------------------|----------------------------------------|
| 4A — Legacy write verification & soak | Legacy read OFF (`DOCUMENTS_HUB_LEGACY_READ=false`) |
| 4B — Backfill execute **planning and ops run** | DROP `customer_files` / `project_documents` |
| Rollback planning (flags + row-level backfill) | Destructive migrations (051+) |
| Data verification checklist | UI removal of legacy Quick upload (optional later) |
| Production rollout checklist | |

---

## 0. Current production state

| Layer | State |
|-------|--------|
| **V2 schema** | 048 `customer_assets`, `project_assets`, `asset_links`; 049 `document_migration_map`; 050 `proposal_assets` |
| **Legacy schema** | `customer_files`, `project_documents` — **remain in place and in hub merge** for all of Phase 4 |
| **Writes** | `DOCUMENTS_HUB_V2_WRITE` default **on** → new data → v2 tables |
| **Reads** | Hub merges **legacy + v2 + proposal_assets** (unchanged) |
| **Backfill** | Script exists; `--execute` **not** run |
| **Risks** | Orphan `projects.lead_id`; dual upload UI; optional missing migration 021 |

---

## 1. Stabilization strategy (non-destructive)

### 1.1 Objective

Stabilize the Documents Hub in production so that:

1. **No new legacy writes** occur while v2 is enabled.  
2. **Historical legacy rows** are copied into v2 metadata (backfill) where migratable.  
3. **Hub continues to show** legacy + v2 + proposal rows (no read-path change).  
4. **Legacy tables and buckets** stay intact for rollback and audit.

### 1.2 In scope — Phase 4A (validation)

| Activity | Deliverable |
|----------|-------------|
| Confirm prod env flags | `DOCUMENTS_HUB_V2_WRITE=true`, `DOCUMENTS_HUB_PROPOSAL_PERSIST=true` |
| Legacy write soak | 14–30 days: monitor `customer_files` / `project_documents` insert count → **0** |
| Automated regression | `phase2-validation-audit.mjs`, `phase3-manual-e2e.mjs` (or scheduled) |
| Code-path audit (read-only) | Confirm upload routes do not write legacy when v2 flag on |
| Baseline artifact | `docs/verification/customer-documents-hub/phase4-stabilization/baseline-counts.json` |

**No schema change.** Optional: `phase4-stabilization-audit.mjs` (counts + flag check only) — implement after approval.

### 1.3 In scope — Phase 4B (backfill execute)

| Activity | Deliverable |
|----------|-------------|
| Dry-run + review | `phase4-backfill-dry-run.json` |
| Approved `--execute` | Additive rows in `customer_assets` / `project_assets` + `document_migration_map` |
| Post-execute verification | §4 checklist |

**Explicit:** Backfill does **not** delete or alter legacy rows. Blobs are **not** copied.

### 1.4 Out of scope (deferred)

| Item | Why deferred |
|------|----------------|
| `DOCUMENTS_HUB_LEGACY_READ=false` | Not approved — hub must keep merging legacy |
| DROP legacy tables | Destructive — not approved |
| Migration 051+ | Not approved |
| Collapse legacy Quick upload UI | Not required for stabilization |
| `asset_links` backfill for old rows | Optional follow-up; not blocking |

### 1.5 Legacy tables end state (after Phase 4)

| Table | Phase 4 end state |
|-------|-------------------|
| `customer_files` | Unchanged; still readable in hub; no new writes (expected) |
| `project_documents` | Unchanged; still readable in hub; no new writes (expected) |
| `customer_assets` / `project_assets` | Grows via live v2 writes + backfill |
| `document_migration_map` | Populated by backfill execute |

### 1.6 Orphan policy (unchanged)

`project_documents` on projects with `lead_id IS NULL` → backfill **skips**; hub **still** shows them via legacy merge when project is not customer-linked. Remediation = data fix (link `lead_id`), not Phase 4 DROP.

### 1.7 Duplicate hub rows (accepted)

After backfill, hub may show both legacy and v2 entries for the same file until a **future** read-retirement phase. Dedupe prefers non-legacy when match keys align; imperfect dedupe is acceptable for Phase 4.

---

## 2. Backfill execute strategy

### 2.1 Tooling (existing)

`scripts/backfill-document-assets.mjs`

| Mode | Command |
|------|---------|
| Dry-run (default) | `node scripts/backfill-document-assets.mjs` |
| Execute | `node scripts/backfill-document-assets.mjs --execute` |
| Map export | `node scripts/backfill-document-assets.mjs --rollback-report` |

### 2.2 Pre-execute gates

- [ ] This revised Phase 4 plan approved for **implementation** (ops + scripts)  
- [ ] 4A soak shows **zero** new legacy writes (or documented exceptions)  
- [ ] Baseline counts captured  
- [ ] Dry-run reviewed: `would_migrate` / `skipped` / `errors`  
- [ ] Orphan skip list reviewed and accepted  
- [ ] Supabase backup / PITR checkpoint recorded  
- [ ] `DOCUMENTS_HUB_V2_WRITE=true` in production  

### 2.3 Execute procedure

1. Save dry-run → `docs/verification/customer-documents-hub/phase4-stabilization/backfill-dry-run.json`  
2. Sign-off on counts  
3. Run `--execute` (service role, maintenance window optional)  
4. Re-run dry-run (expect `already_mapped` skips)  
5. Complete §4 verification  
6. Spot-check ≥3 customers in hub (downloads)  
7. Archive execute log + map row count  

### 2.4 Post-execute expectations

- Legacy tables **unchanged** (row counts stable).  
- Hub document count may **increase** (legacy + backfilled v2); expected.  
- `source_channel='backfill'` on new asset rows.  
- Re-run execute is **idempotent** via `document_migration_map`.

---

## 3. Rollback strategy (non-destructive)

### 3.1 Application rollback

| Action | Effect | Reversible? |
|--------|--------|-------------|
| `DOCUMENTS_HUB_V2_WRITE=false` | Uploads go to legacy tables again | Yes |
| `DOCUMENTS_HUB_PROPOSAL_PERSIST=false` | Stop new proposal_assets | Yes |
| Redeploy prior app version | If flag behavior regresses | Yes |

**Not used in Phase 4:** legacy read flag (not implemented / not approved).

### 3.2 Backfill rollback (row-level)

Per `document_migration_map` entry:

1. Archive or delete `new_id` in `customer_assets` or `project_assets`.  
2. Delete map row.  
3. Legacy row untouched.

Export: `--rollback-report` → `docs/verification/customer-documents-hub/backfill-rollback-report.json`

### 3.3 What Phase 4 does **not** require

- PITR for normal rollback (only if catastrophic mistake during execute)  
- DROP rollback SQL (no DROP)  
- Disabling legacy hub reads  

---

## 4. Data verification checklist

Run after 4A soak and again after 4B execute.

### 4.1 4A — Write verification

| Check | Pass criteria |
|-------|----------------|
| `customer_files` count delta (7–30d soak) | **0** while v2 on |
| `project_documents` count delta (non-archived) | **0** while v2 on |
| Phase 2 audit | 16/16 PASS (or documented env caveat) |
| Prod env flags | v2 + proposal persist enabled |

### 4.2 4B — Post-backfill verification

| Check | Pass criteria |
|-------|----------------|
| `document_migration_map` count | Matches successful inserts |
| `customer_assets` backfill rows | Matches CF migrated ±0 |
| `project_assets` backfill rows | Matches PD migrated ±0 |
| Skipped orphans | Documented and accepted |
| Hub sample (≥3 customers) | Downloads work for backfilled + legacy rows |
| Phase 3 proposal path | Still PASS |
| Legacy table counts | **Unchanged** vs pre-execute snapshot |

### 4.3 Orphan audit

- [ ] Export orphan `project_documents` list  
- [ ] Support note: link `projects.lead_id` to surface on customer hub  

### 4.4 Sign-off artifact

`docs/verification/customer-documents-hub/phase4-stabilization/verification-signoff.json` (at execute time)

---

## 5. Production rollout checklist

### 5.1 Planning (before any execute)

- [ ] Revised Phase 4 stabilization plan approved  
- [ ] Owner: engineering + ops  
- [ ] Baseline: table counts + storage sizes  
- [ ] Backup / PITR documented  

### 5.2 Rollout — 4A stabilization

- [ ] Capture baseline counts JSON  
- [ ] Confirm production flags  
- [ ] Start 14–30 day legacy-write soak monitor  
- [ ] Run Phase 2 + Phase 3 regression audits  
- [ ] Record 4A PASS in sign-off JSON  

### 5.3 Rollout — 4B backfill (only after 4A PASS)

- [ ] Dry-run approved  
- [ ] `--execute` completed  
- [ ] §4.2 verification PASS  
- [ ] Reports stored under `phase4-stabilization/`  

### 5.4 Explicitly **not** in this rollout

- [ ] ~~Legacy read OFF~~ — deferred  
- [ ] ~~DROP migration~~ — deferred  
- [ ] ~~Quick upload UI removal~~ — deferred  

### 5.5 Communication

- [ ] Ops: backfill window (low risk; additive only)  
- [ ] Support: hub may show duplicate filenames briefly after backfill  
- [ ] Engineering: future “Phase 5 retirement” is separate approval track  

---

## 6. Risk assessment (stabilization scope)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Legacy writes resume | Low | Medium | Env monitor + 4A soak |
| Backfill category mismatch | Low | Medium | Dry-run samples + spot downloads |
| Partial backfill failure | Low | Medium | Idempotent re-run; error log; row rollback |
| Duplicate hub entries | Medium | Low | Accepted; dedupe; explain to support |
| Orphan docs not on customer hub | Medium | Low | Document linking procedure |
| Flag misconfiguration | Low | High | Pre-flight env checklist |
| Accidental destructive migration | N/A | Critical | **No DROP migrations in Phase 4** |
| Proposal regression | Low | Medium | Phase 3 audit in regression |
| Storage cost spike | Low | Low | Metadata-only backfill |

**Removed from Phase 4 risks:** DROP without backfill, legacy read-off missing files.

---

## 7. Success criteria

Phase 4 stabilization is **complete** when:

| # | Criterion | Measure |
|---|-----------|---------|
| 1 | Legacy write soak | ≥14 days with **0** new `customer_files` / `project_documents` rows (v2 on) |
| 2 | 4A verification | Baseline + soak PASS documented |
| 3 | Backfill (if approved to run) | Execute completed; map populated; §4.2 PASS |
| 4 | Legacy tables preserved | Row counts for legacy tables unchanged by backfill (only additive v2) |
| 5 | Hub regression | Phase 2 + Phase 3 audits PASS |
| 6 | Rollback docs | Flag rollback + backfill row rollback documented |
| 7 | Artifacts archived | `phase4-stabilization/` verification folder |

**Not required for Phase 4 success:**

- Legacy read OFF  
- DROP tables  
- Zero duplicate hub rows  
- UI consolidation  

### Suggested tag (after implementation + verification only)

`phase4-documents-hub-stabilization-complete` — **not** “deprecation complete”.

---

## 8. Implementation order (after approval — non-destructive only)

| Step | Deliverable | Destructive? |
|------|-------------|--------------|
| 1 | `phase4-stabilization-audit.mjs` (counts, flags, legacy write delta) | No |
| 2 | Ops: baseline + soak monitoring | No |
| 3 | 4A sign-off | No |
| 4 | Backfill dry-run + review | No |
| 5 | Backfill `--execute` (ops) | No (additive) |
| 6 | Post-execute verification + sign-off JSON | No |
| 7 | `customer-documents-hub-handoff-phase4-stabilization.md` | No |

**Not in implementation order:** `DOCUMENTS_HUB_LEGACY_READ`, migration 051, DROP, UI collapse.

---

## 9. Future phase pointer (deferred — do not implement)

When separately approved, **Phase 5 (Retirement)** may include:

- `DOCUMENTS_HUB_LEGACY_READ` flag and hub read change  
- 30–90 day soak with legacy read off  
- Migration to DROP `customer_files` / `project_documents`  
- UI consolidation  

Phase 4 must complete and remain stable before any Phase 5 discussion.

---

## 10. Approval checklist (implementation gate)

**Plan review (this document):**

- [x] 4A validation / legacy write verification — approved  
- [x] Backfill execution planning — approved  
- [x] Rollback planning — approved  
- [x] Data verification — approved  
- [x] Production rollout checklist — approved  
- [x] Legacy read OFF — **not approved**  
- [x] DROP / destructive schema — **not approved**  

**Before code or backfill execute:**

- [ ] Implementation of step §8 approved  
- [ ] 4A soak duration agreed (14 vs 30 days)  
- [ ] Backfill execute date scheduled (optional — can complete 4A only first)  
- [ ] Orphan policy accepted  

---

## 11. Related references

| Doc | Path |
|-----|------|
| Phase 3 handoff | `customer-documents-hub-handoff-phase3.md` |
| Phase 2 handoff (backfill) | `customer-documents-hub-handoff-phase2.md` |
| Master plan (original Phase 4 deprecation) | `customer-documents-hub-implementation-plan.md` — superseded for execution by this doc |
| Backfill script | `scripts/backfill-document-assets.mjs` |

---

*Revised stabilization plan — awaiting implementation approval. No code or migrations until sign-off on §8.*
