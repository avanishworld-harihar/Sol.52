# Phase 2 Validation Audit Report

**Date:** 2026-06-03  
**Commit base:** `51072bb` (Phase 1 handoff) + **uncommitted** Phase 2 working tree  
**Backfill:** Dry-run only — **not executed**  
**Recommendation:** **FIX ISSUES FIRST** (see §9)

---

## 1. Migration 049

### Schema diff (additive only)

**New table:** `document_migration_map`

| Column | Type | Notes |
|--------|------|-------|
| `legacy_table` | `text NOT NULL` | e.g. `customer_files` |
| `legacy_id` | `uuid NOT NULL` | |
| `new_table` | `text NOT NULL` | e.g. `customer_assets` |
| `new_id` | `uuid NOT NULL` | |
| `migrated_at` | `timestamptz DEFAULT now()` | |
| **PK** | `(legacy_table, legacy_id)` | |

**Index:** `document_migration_map_new_idx (new_table, new_id)`  
**RLS:** enabled + `service_all_document_migration_map` policy

### Destructive changes

| Check | Result |
|-------|--------|
| DROP legacy tables | **None** |
| ALTER `customer_files` / `project_documents` | **None** |
| ALTER 048 tables | **None** |

### Rollback

```sql
DROP TABLE IF EXISTS public.document_migration_map CASCADE;
```

Set `DOCUMENTS_HUB_V2_WRITE=false` to restore legacy-only writes (048 tables remain).

**Live DB:** `document_migration_map` exists (`table_exists: true` in audit).

---

## 2. Customer upload flow (Bharti `eead2c0a-…`)

| Test | API | `customer_assets.category` | Result |
|------|-----|---------------------------|--------|
| BILL | `POST …/files/upload` `file_type=bill` | `bill` | **PASS** (201) |
| ROOF (CRM) | `file_type=site_image` | `survey_media` | **PASS** (201) |
| ROOF (project slot) | `doc_category=roof_photo` | `roof_photo` + `asset_links` | **PASS** (201) |
| METER | `doc_category=meter_photo` | `meter_photo` + `asset_links` | **PASS** (201) |

**Counts:** `customer_assets` 0 → **4** (audit files); `customer_files` unchanged (1).

**No new legacy rows** on v2 upload (`customer_files` delta 0).

---

## 3. Project upload flow (KYC categories)

| Test | `doc_category` | Expected table | Result |
|------|----------------|----------------|--------|
| AADHAAR | `aadhaar` | `project_assets` | **FAIL** — `invalid_doc_category` |
| PAN | `pan` | `project_assets` | **FAIL** — `invalid_doc_category` |
| AGREEMENT | `agreement` | `project_assets` | **FAIL** — `invalid_doc_category` |
| SLD (control) | `sld` | `project_assets` | **PASS** (201, `_source: project_assets`) |

**Root cause:** `lib/project-document-types.ts` `PROJECT_DOCUMENT_CATEGORIES` does not include `aadhaar`, `pan`, `agreement` (registry has them; API gate does not).

**Counts:** `project_assets` 0 → **1** (SLD only).

---

## 4. Asset linking

| Check | Result |
|-------|--------|
| `asset_links` rows after survey uploads | **PASS** — 2 links (`roof_photo`, `meter_photo`) |
| Duplicate blobs | **PASS** — 4 audit uploads → 4 unique `storage_path` values |
| Metadata-only | **PASS** — links reference existing `customer_assets.id`; no second upload |

---

## 5. Unified Documents Hub API

| Test | Result |
|------|--------|
| All items | **PASS** — 8 items (legacy + v2) |
| `owner=customer` | **PASS** |
| `owner=project` | **PASS** (includes legacy + v2 SLD) |
| `types=ROOF_PHOTO` | **PASS** |
| `project_id` | **PASS** |
| `q=phase2-audit` | **PASS** |

---

## 6. Legacy compatibility

| Check | Result |
|-------|--------|
| Legacy rows in hub (`legacy: true`) | **PASS** |
| `GET …/files` still works | **PASS** (merged list) |
| Quick upload UI endpoint unchanged | **PASS** |
| `project_documents` count unchanged on v2 upload | **PASS** (10) |

---

## 7. Backfill dry-run (not executed)

```
would_migrate: { customer_files: 1, project_documents: 3 }
skipped: 5 (orphan / already mapped)
```

**Not run:** `--execute`

---

## 8. Git summary (uncommitted Phase 2)

**Modified (10):**  
`app/api/customers/[id]/files/route.ts`, `files/upload/route.ts`,  
`app/api/projects/[id]/documents/route.ts`, `app/api/projects/route.ts`,  
`components/customers/customer-detail-page.tsx`,  
`docs/architecture/customer-documents-hub-handoff-phase1.md`,  
`lib/document-category-registry.ts`, `lib/project-document-store.ts`,  
`lib/project-store.ts`

**New (9):**  
`supabase/migrations/049_document_migration_map.sql`,  
`lib/documents-hub-write-config.ts`, `lib/customer-asset-store.ts`,  
`lib/project-asset-store.ts`, `lib/asset-link-store.ts`,  
`lib/document-write-router.ts`, `scripts/backfill-document-assets.mjs`,  
`docs/architecture/customer-documents-hub-phase2-plan.md`,  
`docs/architecture/customer-documents-hub-phase2-validation-report.md`

**Audit artifacts:**  
`scripts/phase2-validation-audit.mjs`,  
`docs/verification/customer-documents-hub/phase2-audit/audit-report.json`,  
`docs/verification/customer-documents-hub/phase2-audit/01-hub-phase2.png`

---

## PASS / FAIL summary

| # | Area | Result |
|---|------|--------|
| 1 | Migration 049 additive | **PASS** |
| 2 | Migration rollback path | **PASS** |
| 3 | Customer BILL → `customer_assets` | **PASS** |
| 4 | Customer ROOF / METER → `customer_assets` | **PASS** |
| 5 | Project AADHAAR / PAN / AGREEMENT → `project_assets` | **FAIL** |
| 6 | Project write path (SLD proof) | **PASS** |
| 7 | `asset_links` + no duplicate blobs | **PASS** |
| 8 | Hub search / filters | **PASS** |
| 9 | Legacy visible + UI compat | **PASS** |
| 10 | Backfill dry-run | **PASS** |
| 11 | `npm run typecheck` | **PASS** |

---

## Risks discovered

1. **Registry vs API mismatch (blocker):** Phase 2 registry lists AADHAAR/PAN/AGREEMENT but `isProjectDocumentCategory()` rejects them — project KYC uploads cannot reach `project_assets` until types are aligned.
2. **CRM `site_image` → `survey_media`**, not `ROOF_PHOTO` — expected mapping; document for ops.
3. **Hub dedup:** Legacy + v2 rows may both appear until backfill; dry-run shows 4 migratable rows on Bharti.
4. **Test pollution:** Audit files left in DB (`phase2-audit-*`); clean up before prod or use revert script pattern.

---

## 9. Recommendation

### **FIX ISSUES FIRST**

Before commit / Phase 2 acceptance:

1. Extend `PROJECT_DOCUMENT_CATEGORIES` (and labels/MIME rules) to include registry project categories: `aadhaar`, `pan`, `agreement`, `advance_receipt`, `net_metering`, `installation_photo` — **or** validate uploads via `document-category-registry` in `POST …/documents`.
2. Re-run `node scripts/phase2-validation-audit.mjs` and confirm AADHAAR/PAN/AGREEMENT return 201 + `project_assets` rows.
3. Optional: add `DB_PHOTO` to audit script.

Do **not** run backfill `--execute` until upload path is green.

---

## Screenshots

| File | Description |
|------|-------------|
| `docs/verification/customer-documents-hub/phase2-audit/01-hub-phase2.png` | Bharti customer profile / Documents section after v2 uploads |
