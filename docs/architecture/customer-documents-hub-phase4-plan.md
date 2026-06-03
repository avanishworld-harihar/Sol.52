# Customer Documents Hub — Phase 4 Plan (Deprecation & Migration)

**Status:** Awaiting approval — **no implementation, no migrations, no commits**  
**Prerequisite tags:** `phase1-documents-hub-complete`, `phase2-documents-hub-complete`, `phase3-documents-hub-complete`  
**Base production architecture:** Phases 1–3 on `main` (through `5ae72fc` / tag `phase3-documents-hub-complete`)  
**Date:** June 2026

---

## 0. Current production state (review summary)

| Layer | State |
|-------|--------|
| **Schema (additive)** | `customer_assets`, `project_assets`, `asset_links` (048); `document_migration_map` (049); `proposal_assets` (050) |
| **Legacy schema** | `customer_files`, `project_documents` — **still present**, still merged in hub read path |
| **Storage buckets** | `customer-files`, `project-files`, `proposal-assets` — unchanged; backfill reuses paths (no blob copy) |
| **Writes** | `DOCUMENTS_HUB_V2_WRITE` default **on** → new uploads go to v2 tables, not legacy (validated Phase 2) |
| **Proposal persist** | `DOCUMENTS_HUB_PROPOSAL_PERSIST` default **on** → PPTX on pricing snapshot |
| **Backfill** | `scripts/backfill-document-assets.mjs` — **dry-run only**; `--execute` **not** run in production |
| **`document_migration_map`** | Expected **empty or near-empty** until backfill execute |
| **Hub UI** | Unified hub + legacy Quick upload blocks (dual UI) |
| **Known gaps** | Orphan `projects.lead_id IS NULL`; migration **021** (`proposal_status`) may be missing; test/audit filenames in DB |

**Implication for Phase 4:** Retirement is a **process + flag + verification** problem first; **DROP** is last and irreversible.

---

## 1. Legacy table retirement strategy

### 1.1 Tables in scope

| Table | Bucket | Phase 4 action |
|-------|--------|----------------|
| `customer_files` | `customer-files` | Read-only → archive metadata → DROP (late) |
| `project_documents` | `project-files` | Read-only → archive metadata → DROP (late) |

**Out of scope for DROP:** `customer_assets`, `project_assets`, `asset_links`, `proposal_assets`, `document_migration_map`, `proposals`, storage buckets.

### 1.2 Phased retirement (recommended)

```
Phase 4A — Write retirement (reversible)
  DOCUMENTS_HUB_V2_WRITE stays ON (already default)
  Confirm no code path writes legacy when flag ON
  Optional: DOCUMENTS_HUB_LEGACY_READ=true (default) — hub still merges legacy rows

Phase 4B — Historical migration (reversible per row)
  Approved backfill --execute
  Populate document_migration_map
  Orphan / skip report for unmigrated legacy rows

Phase 4C — Read retirement (reversible)
  After backfill + soak: DOCUMENTS_HUB_LEGACY_READ=false
  Hub reads v2 + proposal_assets only
  Legacy tables remain in DB for emergency rollback window

Phase 4D — Schema retirement (irreversible)
  New migration 051+ (NOT 049 — already used): archive views optional, then DROP legacy tables
  Keep document_migration_map indefinitely for audit
```

### 1.3 Timeline (default proposal)

| Window | Duration | Activity |
|--------|----------|----------|
| **Soak** | 14–30 days post–Phase 3 deploy | Monitor v2 write volume; zero new legacy rows |
| **Backfill** | Single maintenance window | Execute backfill; verification checklist |
| **Legacy read soak** | 30–90 days post-backfill | Hub still merges legacy; compare counts |
| **DROP gate** | After sign-off | Backup + DROP migration |

Adjust durations per org risk tolerance; **90-day read fallback** aligns with master plan.

### 1.4 Orphan and unmigrated rows

| Case | Strategy |
|------|----------|
| `project_documents` on projects with `lead_id IS NULL` | **Do not DROP** until linked or explicitly archived; backfill script skips (`orphan_project_no_lead_id`) |
| Legacy rows without map entry after backfill | Keep in legacy tables until manual remediation or accept hub-only-v2 after read flag off |
| Duplicate hub display (legacy + v2) | Expected until read flag off; dedupe in `unified-documents-store` prefers non-legacy |

### 1.5 UI retirement (optional sub-phase)

| Item | When |
|------|------|
| Collapse legacy Quick upload on customer profile | After 4A soak + stakeholder sign-off |
| Project Hub docs tab | Already uses v2 API when flag on — no legacy write |

**Not required for table DROP** but reduces user confusion.

---

## 2. Backfill execute strategy

### 2.1 Tooling

**Script:** `scripts/backfill-document-assets.mjs`

| Mode | Command |
|------|---------|
| Dry-run (default) | `node scripts/backfill-document-assets.mjs` or `--dry-run` |
| Execute | `node scripts/backfill-document-assets.mjs --execute` |
| Rollback report | `node scripts/backfill-document-assets.mjs --rollback-report` |

**Behavior:** Metadata-only; **reuses** `file_url` / `storage_path`; inserts `customer_assets` or `project_assets`; records `document_migration_map`; customer-owned project docs → `customer_assets` (no duplicate blobs).

### 2.2 Pre-execute gates

- [ ] Phase 4 plan approved  
- [ ] Production row counts recorded (baseline JSON artifact)  
- [ ] Dry-run reviewed: `would_migrate` vs `skipped` counts acceptable  
- [ ] Orphan project list exported and reviewed  
- [ ] Supabase backup / PITR checkpoint documented  
- [ ] Maintenance window communicated (read-only not required; writes already v2)  
- [ ] `DOCUMENTS_HUB_V2_WRITE=true` confirmed in production env  

### 2.3 Execute procedure (ordered)

1. Run dry-run; save output to `docs/verification/customer-documents-hub/phase4-backfill-dry-run.json`.  
2. Stakeholder sign-off on counts + skip reasons.  
3. Run `--execute` from operator machine with production `.env.local` (service role).  
4. Re-run dry-run — expect skips = `already_mapped` for migrated ids.  
5. Run data verification checklist (§4).  
6. Spot-check hub for 3 customers: legacy filenames visible, download URLs work.  
7. Archive execute log + `document_migration_map` row count.

### 2.4 Post-execute

| Action | Detail |
|--------|--------|
| **asset_links** | Backfill does **not** auto-create links; optional follow-up script or rely on new uploads + project create linking |
| **Duplicates** | Hub dedupe may show legacy + v2 until read retirement; acceptable short term |
| **Re-run safety** | Idempotent via `document_migration_map` + `alreadyMapped()` |

### 2.5 Rollback of backfill (row-level)

Not automated in script. Per row:

1. Query `document_migration_map` for `legacy_table` / `legacy_id`.  
2. Archive or delete `new_id` in `new_table`.  
3. Delete map row.  
4. Legacy row remains untouched.

Use `--rollback-report` to export map for audit.

---

## 3. Rollback strategy

### 3.1 By phase (reversibility)

| Phase | Rollback | Data loss risk |
|-------|----------|----------------|
| **4A** Write off legacy | Set `DOCUMENTS_HUB_V2_WRITE=false` | None — legacy tables intact |
| **4B** Backfill execute | Row-level map rollback (§2.5) | Low if legacy not dropped |
| **4C** Legacy read off | Set `DOCUMENTS_HUB_LEGACY_READ=true` (to be implemented) | None |
| **4D** DROP tables | **Restore from backup / PITR only** | **High — irreversible** |

### 3.2 Feature flags (proposed Phase 4 additions)

| Env | Default (during 4A–4C) | Effect |
|-----|------------------------|--------|
| `DOCUMENTS_HUB_V2_WRITE` | `true` | Keep current production behavior |
| `DOCUMENTS_HUB_LEGACY_READ` | `true` → later `false` | When `false`, hub omits `customer_files` + `project_documents` merge |
| `DOCUMENTS_HUB_PROPOSAL_PERSIST` | `true` | Unchanged from Phase 3 |

**No flag for DROP** — migration-gated only.

### 3.3 Emergency rollback (operations)

1. `DOCUMENTS_HUB_V2_WRITE=false` — all uploads to legacy.  
2. `DOCUMENTS_HUB_LEGACY_READ=true` — hub shows legacy again.  
3. Redeploy previous app build if needed.  
4. If DROP already ran: Supabase PITR to pre-DROP timestamp (RTO/RPO per Supabase plan).

### 3.4 Migration rollback SQL (051+ DROP only)

**Before DROP:** export:

```sql
-- Counts snapshot
SELECT COUNT(*) FROM customer_files;
SELECT COUNT(*) FROM project_documents;
SELECT COUNT(*) FROM document_migration_map;
```

**DROP rollback:** none without restore. **Do not drop** `document_migration_map`.

---

## 4. Data verification checklist

Run after backfill execute and before legacy read off / DROP.

### 4.1 Count reconciliation

| Check | SQL / script | Pass criteria |
|-------|----------------|---------------|
| Map rows | `SELECT COUNT(*) FROM document_migration_map` | = successful inserts |
| Legacy CF unmigrated | CF rows not in map | Documented skips only |
| Legacy PD unmigrated | PD rows not in map (non-archived) | Orphans + already-v2 duplicates only |
| New CA growth | `customer_assets` where `source_channel='backfill'` | Matches CF migrated count ±0 |
| New PA growth | `project_assets` where `source_channel='backfill'` | Matches PD migrated count ±0 |
| No new legacy writes | `customer_files` count delta over 7 days | 0 while v2 flag on |

### 4.2 Spot samples (minimum 5 customers)

- [ ] Hub `GET /documents` total ≥ pre-backfill visible docs for customer  
- [ ] Download URL works for 1 backfilled customer asset  
- [ ] Download URL works for 1 backfilled project asset  
- [ ] `owner=project` / `owner=customer` filters correct  
- [ ] `owner=proposal` unchanged (Phase 3)  

### 4.3 Orphan audit

- [ ] Export `project_documents` where `project_id` in (select id from projects where lead_id is null)  
- [ ] Stakeholder accepts hub will not show these on customer profile until linked  

### 4.4 Automated scripts (reuse / extend)

| Script | Purpose |
|--------|---------|
| `phase2-validation-audit.mjs` | Regression: v2 uploads, no new legacy writes |
| `phase3-manual-e2e.mjs` | Proposal path still PASS |
| New `phase4-verification-audit.mjs` (future) | Counts + map coverage — implement in Phase 4 after approval |

### 4.5 Sign-off record

Store in `docs/verification/customer-documents-hub/phase4-verification/verification-signoff.json` (created at execute time, not now).

---

## 5. Production rollout checklist

### 5.1 Pre-rollout (planning)

- [ ] Phase 4 plan approved (this document)  
- [ ] Owner assigned (engineering + ops)  
- [ ] Baseline metrics captured (table counts, storage bucket sizes)  
- [ ] Backup / PITR verified  

### 5.2 Rollout 4A — Write retirement confirmation

- [ ] Confirm prod env: `DOCUMENTS_HUB_V2_WRITE` not `false`  
- [ ] 7-day monitor: `customer_files` / `project_documents` insert rate → 0  
- [ ] Deploy no change if already satisfied  

### 5.3 Rollout 4B — Backfill execute

- [ ] Maintenance note posted  
- [ ] Dry-run approved  
- [ ] `--execute` completed  
- [ ] §4 verification PASS  
- [ ] Artifacts committed (reports only, optional)  

### 5.4 Rollout 4C — Legacy read retirement

- [ ] Implement `DOCUMENTS_HUB_LEGACY_READ` + deploy  
- [ ] Set `DOCUMENTS_HUB_LEGACY_READ=false` in staging → smoke test  
- [ ] Production flip with monitoring  
- [ ] 14-day soak; no P1 hub “missing file” reports  

### 5.5 Rollout 4D — DROP (optional, separate approval)

- [ ] Written sign-off: “DROP approved”  
- [ ] Fresh backup + PITR checkpoint  
- [ ] Migration `051_deprecate_legacy_file_tables.sql` reviewed (additive rename/archive optional first)  
- [ ] Apply during low-traffic window  
- [ ] Post-DROP: hub + project hub smoke tests  
- [ ] Tag `phase4-documents-hub-complete` (only after DROP or explicit “4C complete without DROP” decision)  

### 5.6 Communication

- [ ] Installers: legacy Quick upload removal (if UI collapsed)  
- [ ] Support: orphan project linking procedure  
- [ ] Docs: update handoff Phase 4 section when complete  

---

## 6. Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **DROP without backfill** | Low if gated | Critical — data invisible in hub | Enforce 4B before 4C/4D |
| **Orphan project docs lost from hub** | Medium | Medium | Link `lead_id` or accept exclusion; document in support KB |
| **Duplicate hub entries** | Medium | Low | Dedupe logic; legacy read off removes legacy leg |
| **Backfill wrong category mapping** | Low | Medium | Dry-run sample review; spot-check downloads |
| **Public `file_url` in customer_assets** | Low | Medium | Already supported in v2 read; verify signed URL path |
| **Map / asset mismatch on partial failure** | Low | Medium | Script logs errors; re-run idempotent; rollback per §2.5 |
| **Flag misconfiguration in prod** | Low | High | Env checklist in deploy pipeline |
| **Irreversible DROP** | N/A if gated | Critical | 4C soak + backup + separate DROP approval |
| **Storage costs** | Low | Low | No blob copy in backfill |
| **Proposal path regression** | Low | Medium | Keep Phase 3 audit in regression suite |
| **Missing proposal_status (021)** | Known | Low | Independent of Phase 4; optional parallel migration |

---

## 7. Success criteria

Phase 4 is **complete** when all **approved sub-phases** meet their criteria:

### 7.1 Minimum success (4A + 4B + 4C, no DROP)

| Criterion | Measure |
|-----------|---------|
| Zero new legacy writes | 30-day count delta 0 on `customer_files` and `project_documents` |
| Backfill coverage | ≥95% of migratable legacy rows in `document_migration_map` (orphans excluded) |
| Hub functional | Phase 2 + Phase 3 audit scripts PASS on production-like data |
| Legacy read off | `DOCUMENTS_HUB_LEGACY_READ=false` in prod with no increase in missing-file incidents |
| Audit trail | `document_migration_map` retained; execute report archived |

### 7.2 Full success (includes 4D DROP)

| Criterion | Measure |
|-----------|---------|
| All minimum criteria | Met |
| Legacy tables dropped | `customer_files`, `project_documents` absent from schema |
| Hub unchanged UX | Customers still see backfilled + net-new v2 docs |
| Rollback doc | PITR restore procedure tested or documented |

### 7.3 Explicit non-goals

- PDF proposal exports  
- Merging CRM and project timelines  
- Consolidating storage buckets  
- Auto-fixing all orphan projects  

---

## 8. Proposed implementation order (after approval)

| Step | Deliverable | Destructive? |
|------|-------------|--------------|
| 1 | `DOCUMENTS_HUB_LEGACY_READ` config + unified store guard | No |
| 2 | `phase4-verification-audit.mjs` | No |
| 3 | Ops runbook + baseline capture | No |
| 4 | Approved backfill `--execute` | No (additive rows) |
| 5 | Flip legacy read flag | No |
| 6 | Optional UI: collapse Quick upload | No |
| 7 | Migration 051 DROP (separate approval) | **Yes** |
| 8 | `customer-documents-hub-handoff-phase4.md` + tag | No / tag only |

**Migration numbering:** Use **051+** for DROP; **049** is `document_migration_map`.

---

## 9. Approval checklist

Before any Phase 4 code or execute:

- [ ] Sub-phases approved: 4A / 4B / 4C / 4D (check which apply)  
- [ ] Backfill execute window scheduled  
- [ ] DROP explicitly approved or deferred  
- [ ] Orphan project policy accepted  
- [ ] Soak durations agreed  
- [ ] Success criteria §7 agreed  

---

## 10. Related references

| Doc | Path |
|-----|------|
| Master plan | `customer-documents-hub-implementation-plan.md` §Phase 4 |
| Phase 2 handoff | `customer-documents-hub-handoff-phase2.md` §7 backfill |
| Phase 3 handoff | `customer-documents-hub-handoff-phase3.md` |
| Backfill script | `scripts/backfill-document-assets.mjs` |
| Migrations | `048_*`, `049_*`, `050_*` (no 051 until approved) |

---

*End of plan — awaiting approval. No implementation until sign-off.*
