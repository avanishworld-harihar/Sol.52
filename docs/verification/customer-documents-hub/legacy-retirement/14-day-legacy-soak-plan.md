# 14-Day Legacy Table Soak — Operational Verification Plan

**Post Phase C/E · Read-only verification · No code / DB / migration / DROP changes during soak**

| Field | Value |
|-------|--------|
| **Purpose** | Prove production produces **zero net new activity** on `customer_files` and `project_documents` while the app uses v2 tables only |
| **Duration** | 14 calendar days (extend to 30 if any exception or ambiguous delta) |
| **Executor** | Ops / engineering with Supabase SQL Editor (service role or read-only analyst role) |
| **App state assumed** | Phase C/E deployed; legacy hub flags unset; no `ALLOW_LEGACY_DOCUMENT_SCRIPT_MUTATIONS` in production |

---

## 1. Scope

### In scope (monitor only)

| Object | Monitor |
|--------|---------|
| `public.customer_files` | Row count, new `created_at`, updates/deletes |
| `public.project_documents` | Row count, new `created_at`, `archived_at` changes, updates/deletes |
| `public.document_migration_map` | New map rows, orphaned map entries |
| Orphan `project_documents` | Rows on `projects.lead_id IS NULL` |
| Production env | No legacy document flags; no approved legacy script runs |

### Out of scope (do not do during soak)

- Application code changes
- Schema migrations
- `DROP` / `TRUNCATE` / bulk delete on legacy tables
- Running mutating ops scripts (`link-bharti-*`, `cleanup-bharti-*`, `backfill --execute`) unless logged as **Exception**

### V2 sanity (informational, not a failure if growing)

| Object | Expected |
|--------|----------|
| `customer_assets`, `project_assets`, `proposal_assets`, `asset_links` | May increase with normal uploads — confirms app is alive |

---

## 2. Day 0 — Baseline (before Day 1 checklist)

Run all **Section 4** SQL once. Record results in the log table (Section 8).

| Metric | Day 0 value | Notes |
|--------|-------------|-------|
| `customer_files` total count | | |
| `project_documents` total count | | |
| `project_documents` active (`archived_at IS NULL`) | | |
| `customer_files` max `created_at` | | |
| `project_documents` max `created_at` | | |
| `document_migration_map` total count | | |
| Orphan `project_documents` count | | |
| Unmapped legacy rows (sample) | | |
| Production `DOCUMENTS_HUB_*` env | unset / documented | |

**Soak start date:** __________  
**Soak end date (Day 14):** __________  
**Reviewer:** __________

---

## 3. Daily Verification Checklist (Days 1–14)

Complete **every calendar day** within 24h of the same time (±2h). Mark each item PASS / FAIL / N/A.

### A. Environment & deployment (2 min)

- [ ] Production deploy unchanged from Phase C/E build (no hotfix touching `lib/document-*`, `app/api/**/files`, `app/api/**/documents`)
- [ ] `DOCUMENTS_HUB_LEGACY_READ` — **unset** or not `true`
- [ ] `DOCUMENTS_HUB_V2_WRITE` — **unset** or not `false` (flag ignored by app post–Phase C; log if set)
- [ ] `NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ` — **unset** or not `true`
- [ ] `ALLOW_LEGACY_DOCUMENT_SCRIPT_MUTATIONS` — **not set** in production runtime or CI against prod

### B. Legacy table activity SQL (5 min)

Run **Section 4.1–4.3**. Record counts in daily log.

- [ ] `customer_files` total count = Day 0 baseline (Δ = 0)
- [ ] `project_documents` total count = Day 0 baseline (Δ = 0)
- [ ] Zero rows with `created_at >= soak_start` on **customer_files**
- [ ] Zero rows with `created_at >= soak_start` on **project_documents**
- [ ] Zero rows with `created_at >= soak_start` on **document_migration_map**

### C. Legacy mutation signals (3 min)

Run **Section 4.4**. 

- [ ] No new `customer_files` rows in last 24h
- [ ] No new `project_documents` rows in last 24h
- [ ] No `project_documents` rows newly un-archived (`archived_at` cleared) in last 24h unless documented exception

### D. Orphan & map integrity (5 min, Days 1, 7, 14 — quick count other days)

- [ ] Orphan `project_documents` count unchanged from Day 0 (Δ = 0) — **Section 5**
- [ ] `document_migration_map` count unchanged from Day 0 (Δ = 0) — **Section 6**
- [ ] Unmapped legacy sample empty or unchanged — **Section 6.3**

### E. Application smoke (optional, 5 min)

- [ ] Customer Documents Hub loads for a known customer (e.g. Bharti) — documents visible
- [ ] Upload test file in **non-prod** OR confirm prod upload ticket created v2 row only (do not inspect legacy tables via app)
- [ ] No P0/P1 errors in logs mentioning `customer_files` / `project_documents`

### F. Exceptions & scripts

- [ ] No entry in **Section 7** Exception log today
- [ ] No mutating legacy script run against production today

**Day result:** PASS only if A–F all pass (E optional if skipped, note reason).

---

## 4. SQL Checks — Legacy Table Activity (read-only)

Replace `:soak_start` with Day 0 timestamp (timestamptz), e.g. `'2026-06-04T00:00:00+00'`.

### 4.1 Baseline counts (run daily; compare to Day 0)

```sql
-- Snapshot: legacy + map + v2 (v2 for sanity only)
SELECT 'customer_files' AS tbl, COUNT(*)::bigint AS cnt FROM public.customer_files
UNION ALL
SELECT 'project_documents', COUNT(*) FROM public.project_documents
UNION ALL
SELECT 'project_documents_active', COUNT(*) FROM public.project_documents WHERE archived_at IS NULL
UNION ALL
SELECT 'document_migration_map', COUNT(*) FROM public.document_migration_map
UNION ALL
SELECT 'customer_assets', COUNT(*) FROM public.customer_assets
UNION ALL
SELECT 'project_assets', COUNT(*) FROM public.project_assets;
```

### 4.2 New rows since soak start (must be 0 every day)

```sql
SELECT 'customer_files_new' AS check_name, COUNT(*)::bigint AS cnt
FROM public.customer_files
WHERE created_at >= :soak_start::timestamptz

UNION ALL

SELECT 'project_documents_new', COUNT(*)
FROM public.project_documents
WHERE created_at >= :soak_start::timestamptz

UNION ALL

SELECT 'document_migration_map_new', COUNT(*)
FROM public.document_migration_map
WHERE migrated_at >= :soak_start::timestamptz;
```

**PASS:** all three `cnt = 0`.

### 4.3 Latest activity timestamps (detect drift)

```sql
SELECT
  (SELECT MAX(created_at) FROM public.customer_files) AS cf_max_created_at,
  (SELECT MAX(created_at) FROM public.project_documents) AS pd_max_created_at,
  (SELECT MAX(migrated_at) FROM public.document_migration_map) AS map_max_migrated_at;
```

**PASS daily:** max timestamps equal Day 0 values (or NULL if table empty).

### 4.4 Rolling 24-hour window (catch late-day writes)

```sql
SELECT 'customer_files_24h' AS check_name, COUNT(*)::bigint AS cnt
FROM public.customer_files
WHERE created_at >= now() - interval '24 hours'

UNION ALL

SELECT 'project_documents_24h', COUNT(*)
FROM public.project_documents
WHERE created_at >= now() - interval '24 hours'

UNION ALL

SELECT 'project_documents_unarchived_24h', COUNT(*)
FROM public.project_documents
WHERE archived_at IS NULL
  AND created_at < now() - interval '24 hours'
  AND updated_at >= now() - interval '24 hours';  -- only if column exists; else skip
```

> **Note:** `project_documents` may not have `updated_at`. If missing, use only 4.2 + 4.3 + count equality. For archive activity, compare active count:

```sql
SELECT COUNT(*) AS pd_active_now
FROM public.project_documents
WHERE archived_at IS NULL;
```

Compare to Day 0 `project_documents_active` count.

### 4.5 Deletes since soak start (optional; count drop without archive)

```sql
-- If Day 0 total > today's total, investigate (script or manual delete)
SELECT
  :day0_cf_count::bigint - (SELECT COUNT(*) FROM public.customer_files) AS cf_count_delta,
  :day0_pd_count::bigint - (SELECT COUNT(*) FROM public.project_documents) AS pd_count_delta;
```

**PASS:** both deltas = 0 unless documented exception (cleanup script with approval).

---

## 5. Orphan Row Verification (read-only)

**Definition:** `project_documents` whose `project_id` belongs to a project with `lead_id IS NULL`.

### 5.1 Orphan counts (Days 0, 1, 7, 14 — count only other days)

```sql
SELECT COUNT(*)::bigint AS orphan_project_documents
FROM public.project_documents pd
JOIN public.projects p ON p.id = pd.project_id
WHERE p.lead_id IS NULL
  AND pd.archived_at IS NULL;

SELECT COUNT(*)::bigint AS orphan_project_documents_all
FROM public.project_documents pd
JOIN public.projects p ON p.id = pd.project_id
WHERE p.lead_id IS NULL;
```

**Soak PASS criterion:** `orphan_project_documents_all` unchanged from Day 0 (no new orphan docs, no deletes unless approved).

### 5.2 Orphan inventory (Day 0 and Day 14)

```sql
SELECT
  pd.id,
  pd.project_id,
  p.customer_name,
  pd.filename,
  pd.doc_category,
  pd.created_at,
  pd.archived_at
FROM public.project_documents pd
JOIN public.projects p ON p.id = pd.project_id
WHERE p.lead_id IS NULL
ORDER BY pd.created_at DESC
LIMIT 100;
```

### 5.3 Projects without customer link

```sql
SELECT id, customer_name, created_at
FROM public.projects
WHERE lead_id IS NULL
ORDER BY created_at DESC;
```

**Pre-DROP remediation (after soak, separate approval):** link `projects.lead_id`, migrate storage to v2, or archive orphan rows — not during soak.

---

## 6. document_migration_map Verification (read-only)

### 6.1 Map stability (daily count; detail on Days 0, 7, 14)

```sql
SELECT legacy_table, new_table, COUNT(*)::bigint AS cnt
FROM public.document_migration_map
GROUP BY legacy_table, new_table
ORDER BY 1, 2;
```

**Soak PASS:** total map rows = Day 0; no new `migrated_at >= soak_start`.

### 6.2 Orphan map entries (new_id missing in target table)

```sql
-- customer_files → customer_assets
SELECT m.legacy_id, m.new_id, 'missing_customer_asset' AS issue
FROM public.document_migration_map m
LEFT JOIN public.customer_assets ca ON ca.id = m.new_id
WHERE m.legacy_table = 'customer_files'
  AND m.new_table = 'customer_assets'
  AND ca.id IS NULL

UNION ALL

-- project_documents → customer_assets or project_assets
SELECT m.legacy_id, m.new_id, 'missing_target_' || m.new_table
FROM public.document_migration_map m
LEFT JOIN public.customer_assets ca ON ca.id = m.new_id AND m.new_table = 'customer_assets'
LEFT JOIN public.project_assets pa ON pa.id = m.new_id AND m.new_table = 'project_assets'
WHERE m.legacy_table = 'project_documents'
  AND m.new_table IN ('customer_assets', 'project_assets')
  AND ca.id IS NULL
  AND pa.id IS NULL;
```

**PASS:** zero rows (or same as Day 0 snapshot).

### 6.3 Unmapped legacy rows (Day 0, 7, 14)

```sql
-- customer_files without map entry
SELECT cf.id, cf.file_name, cf.created_at
FROM public.customer_files cf
LEFT JOIN public.document_migration_map m
  ON m.legacy_table = 'customer_files' AND m.legacy_id = cf.id
WHERE m.legacy_id IS NULL
LIMIT 50;

-- project_documents without map entry (active only)
SELECT pd.id, pd.filename, pd.project_id, pd.created_at
FROM public.project_documents pd
LEFT JOIN public.document_migration_map m
  ON m.legacy_table = 'project_documents' AND m.legacy_id = pd.id
WHERE m.legacy_id IS NULL
  AND pd.archived_at IS NULL
LIMIT 50;
```

Record counts; changing during soak = FAIL unless backfill exception logged.

### 6.4 Duplicate map keys (should not exist; PK prevents inserts)

```sql
SELECT legacy_table, legacy_id, COUNT(*)
FROM public.document_migration_map
GROUP BY legacy_table, legacy_id
HAVING COUNT(*) > 1;
```

**PASS:** zero rows.

---

## 7. Exception Log

| Date | Actor | Action | Tables touched | Ticket / reason | Legacy Δ | Restored? |
|------|-------|--------|----------------|-----------------|----------|-----------|
| | | | | | | |

**Examples requiring a row:** `DOCUMENTS_HUB_V2_WRITE=false` deploy, manual SQL insert, `link-bharti-realworld-validation.mjs`, `cleanup-bharti-* --execute`, emergency rollback.

Any exception **resets or extends** soak per ops policy (recommend +14 days from last legacy write).

---

## 8. Daily Log Table (14 days)

| Day | Date | cf_cnt | pd_cnt | map_cnt | cf_new | pd_new | map_new | orphan_pd | PASS | Reviewer |
|-----|------|--------|--------|---------|--------|--------|---------|-----------|------|----------|
| 0 | | | | | — | — | — | | baseline | |
| 1 | | | | | | | | | | |
| 2 | | | | | | | | | | |
| 3 | | | | | | | | | | |
| 4 | | | | | | | | | | |
| 5 | | | | | | | | | | |
| 6 | | | | | | | | | | |
| 7 | | | | | | | | | | |
| 8 | | | | | | | | | | |
| 9 | | | | | | | | | | |
| 10 | | | | | | | | | | |
| 11 | | | | | | | | | | |
| 12 | | | | | | | | | | |
| 13 | | | | | | | | | | |
| 14 | | | | | | | | | | |

---

## 9. Final DROP Readiness Criteria (after Day 14 PASS)

Soak **PASS** alone is not sufficient to DROP tables. All criteria below must be **YES** before scheduling a DROP migration (separate approval).

### 9.1 Soak & production

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | 14 consecutive daily checklists PASS | Section 8 complete |
| 2 | Zero `customer_files` / `project_documents` / `document_migration_map` inserts since soak start | Section 4.2 = 0 for full window |
| 3 | Legacy table counts unchanged (or only approved exceptions documented) | Section 4.1 / 4.5 |
| 4 | Phase C/E production audit PASS | `drop-readiness-audit.json` — runtime/API safe |
| 5 | No production legacy feature flags enabled | Env screenshot / config export |
| 6 | No unapproved legacy mutating script runs in soak window | Section 7 empty or approved |

### 9.2 Data & migration map

| # | Criterion | Evidence |
|---|-----------|----------|
| 7 | Every production-needed legacy file has v2 equivalent OR is explicitly abandoned | Backfill report + spot-check downloads |
| 8 | `document_migration_map` orphan check (6.2) = 0 | SQL output archived |
| 9 | Unmapped legacy rows (6.3) reviewed and accepted or backfilled | Signed data owner note |
| 10 | Orphan `project_documents` policy decided | Link project, archive, or accept loss — **Section 5** inventory signed |

### 9.3 Operations & safety

| # | Criterion | Evidence |
|---|-----------|----------|
| 11 | Supabase PITR / backup taken immediately before DROP migration | Backup ticket ID |
| 12 | DROP migration reviewed (no accidental v2 table DROP) | PR + second reviewer |
| 13 | Roll-forward plan if DROP reverted | Restore from backup doc |
| 14 | Mutating ops scripts archived or removed from runbooks | `link-bharti`, `cleanup-bharti-*`, etc. |
| 15 | Stale architecture docs updated (rollback flags removed) | Doc PR or ops note |

### 9.4 DROP sign-off block

| Field | Value |
|-------|-------|
| Soak start | |
| Soak end | |
| 14-day soak result | PASS / FAIL |
| Data owner | |
| Engineering lead | |
| DROP migration approved (Y/N) | |
| Target migration ID | (future — not created during soak) |

---

## 10. Failure Handling

| Failure | Action |
|---------|--------|
| Any legacy `created_at >= soak_start` | Stop DROP timeline; find writer (logs, script history, env); log Section 7; restart soak |
| Count drop without exception | Investigate delete script or manual SQL |
| Map row increase | Identify backfill/cleanup script; treat as legacy mutation |
| Orphan count increase | New doc on unlinked project — find API/script path (should not happen post Phase C) |
| 1–2 day miss | Do not backfill PASS; extend soak 14 days from last complete day |

---

## 11. Reference Baselines (informational — re-capture on your Day 0)

Historical snapshots (environment may differ; **do not use as substitute for Day 0**):

| Source | customer_files | project_documents | document_migration_map |
|--------|----------------|-------------------|------------------------|
| `baseline-counts.json` (2026-06-03) | 3 | 12 | 0 |
| `legacy-rows-investigation.json` (2026-06-04) | 0 | 5 (all archived test) | — |

Post Phase C/E, expect **zero app-driven legacy writes** regardless of env flags.

---

*End of soak plan — operational document only; no schema or application changes.*
