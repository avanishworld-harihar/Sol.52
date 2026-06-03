# Customer Documents Hub — Phase 2 Plan (pre-implementation)

**Approved:** Phase 2 write-path + linking + backfill framework.  
**Out of scope:** Phase 3 (`proposal_assets`), legacy DROP, automatic backfill execution.

---

## 1. Affected files

| Action | Path |
|--------|------|
| **New** | `supabase/migrations/049_document_migration_map.sql` |
| **New** | `lib/documents-hub-write-config.ts` |
| **New** | `lib/customer-asset-store.ts` |
| **New** | `lib/project-asset-store.ts` |
| **New** | `lib/asset-link-store.ts` |
| **New** | `lib/document-write-router.ts` |
| **New** | `scripts/backfill-document-assets.mjs` |
| **New** | `docs/architecture/customer-documents-hub-phase2-validation-report.md` |
| **Edit** | `app/api/customers/[id]/files/upload/route.ts` |
| **Edit** | `app/api/customers/[id]/files/route.ts` |
| **Edit** | `app/api/projects/[id]/documents/route.ts` |
| **Edit** | `app/api/projects/[id]/documents/[docId]/route.ts` |
| **Edit** | `lib/project-document-store.ts` |
| **Edit** | `lib/project-store.ts` |
| **Edit** | `app/api/projects/route.ts` |
| **Edit** | `lib/document-category-registry.ts` (project doc → write target helpers) |
| **Edit** | `components/customers/customer-detail-page.tsx` (mutate hub after upload) |

**Not touched:** `proposal_assets`, proposal PDF hooks, Phase 1 hub read UI (except SWR mutate).

---

## 2. Write-path architecture

```
                    DOCUMENTS_HUB_V2_WRITE (env, default ON)
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        │                                                       │
  Customer upload                                      Project upload
  POST …/files/upload                                  POST …/projects/[id]/documents
  POST …/files (JSON)                                           │
        │                                                       │
        ▼                                                       ▼
              document-write-router.ts
        │                                                       │
        ├─ customer_files path (V2 off)                         │
        │                                                       ├─ doc_category → customer-owned?
        └─ customer_assets (V2 on)                              │     YES → customer_assets + asset_links
             storage: customer-files bucket                      │     NO  → project_assets
             metadata only                                       │     storage: project-files bucket
                                                                 └─ project_documents (V2 off)

Project create (POST /api/projects, ensureProjectForWonLead)
        → asset-link-store.linkCustomerAssetsOnProjectCreate()
        → metadata only (latest customer_asset per link_role)

Read paths (unchanged merge, Phase 1):
        unified-documents-store ← customer_assets + project_assets + legacy tables
        GET …/files ← legacy + mapped customer_assets (UI compat)
        listProjectDocuments ← legacy + v2 rows when V2 on
```

**No blob copy on link or backfill** — reuse `storage_path` / `file_url`.

---

## 3. Migration impact

| Migration | Content |
|-----------|---------|
| **049** | `document_migration_map` (legacy_id → new_id audit trail for backfill) |

**No** ALTER/DROP on `customer_files` or `project_documents`.  
**048** must already be applied (`customer_assets`, `project_assets`, `asset_links`).

---

## 4. Rollback strategy

| Lever | Effect |
|-------|--------|
| `DOCUMENTS_HUB_V2_WRITE=false` | Upload routes write legacy tables only; reads still merge legacy + any existing v2 rows |
| Revert git commit | Remove router + stores; legacy paths unchanged |
| SQL | Do not drop v2 tables; optional delete v2 rows manually if needed |

**Backfill:** dry-run by default; `--execute` only when operator approves; `--rollback-report` lists migration_map rows.

---

## 5. Backfill execution

**Not run automatically.** Operator runs:

```bash
node scripts/backfill-document-assets.mjs --dry-run
# after approval:
node scripts/backfill-document-assets.mjs --execute
node scripts/backfill-document-assets.mjs --rollback-report
```
