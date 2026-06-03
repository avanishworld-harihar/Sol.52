# Customer Documents Hub — Phase 1 Handoff Report

**Purpose:** Engineering handoff for future sessions (Phase 2+).  
**Status:** Phase 1 complete — read-only hub, additive schema, legacy merge.  
**Date:** June 2026  
**Do not treat this document as a migration runbook without re-verifying production state.**

---

## 1. Current Architecture

### 1.1 Customer Documents Hub (UI)

| Item | Detail |
|------|--------|
| **Component** | `components/customers/customer-documents-hub.tsx` |
| **Host page** | `components/customers/customer-detail-page.tsx` — **Documents** section above legacy Quick upload (Bills / Site / Documents) |
| **Route** | `/customers/[id]` (customer profile; not lead-edit redirect) |
| **Client fetch** | `lib/customer-documents-client.ts` → SWR |
| **Phase 1 behavior** | Search, owner/type/project/date filters, load-more pagination; **read-only** (uploads still use legacy blocks below hub) |

### 1.2 Unified Documents API

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/customers/[id]/documents` |
| **Route** | `app/api/customers/[id]/documents/route.ts` |
| **Store** | `lib/unified-documents-store.ts` — `listUnifiedCustomerDocuments()` |
| **Types** | `lib/unified-documents-types.ts` |

**Query parameters:** `q`, `types` (registry ids or snake_case), `project_id` (uuid or `none`), `owner` (`customer` \| `project` \| `proposal`), `from`, `to`, `limit`, `cursor`.

**Merge order (Phase 1):** In-memory union of four sources, filter, sort by `uploaded_at` desc, keyset cursor:

1. `customer_assets` (new table; empty until Phase 2 writes)
2. `project_assets` (new table; empty until Phase 2 writes)
3. `customer_files` (legacy)
4. `project_documents` for all non-archived projects where `projects.lead_id = customerId`

**Dedup:** Prefer non-legacy when same filename + project + category + day; legacy rows keyed loosely.

**Signed URLs:** Project paths via `createProjectDocumentSignedUrl`; customer bucket paths signed when not already HTTP.

### 1.3 Timeline architecture

| Surface | Source | Scope |
|---------|--------|--------|
| **Customer profile timeline** | `GET /api/customers/[id]/timeline` | CRM + **major project milestones only** |
| **Store** | `lib/customer-timeline-store.ts` — `listCustomerTimelineMerged()` | |
| **CRM leg** | `activity_events` via `listActivityTimeline()` — `kind: "crm"` | |
| **Project leg** | `project_activity_log` filtered by allowlist — `kind: "project_milestone"` | |

**Milestone allowlist (`PROJECT_MILESTONE_EVENT_TYPES`):**

- `project_created`
- `stage_changed`
- `project_completed`
- `project_archived`

**Excluded from customer timeline:** `document_uploaded`, `task_completed`, `comment_added`, etc. (remain on Project Hub timeline).

**Workspace pane:** `components/customer-workspace-pane.tsx` updated for `CustomerTimelineItem` union type.

### 1.4 Document Category Registry

| Item | Detail |
|------|--------|
| **Source of truth** | `lib/document-category-registry.ts` (TypeScript; **no** SQL seed table in Phase 1) |
| **DB enforcement** | CHECK constraints on `customer_assets.category` and `project_assets.category` in Migration 048 |
| **Approved addition** | **DB_PHOTO** / `db_photo` (customer owner) |
| **Deferred** | `PROPOSAL_PDF`, `PROPOSAL_REVISION` — types exist in registry; **no** `proposal_assets` table |

**Legacy mapping helpers:**

- `legacyCustomerFileTypeToCategory()` — `customer_files.file_type`
- `legacyProjectDocCategoryToDb()` — `project_documents.doc_category`
- `legacyProjectDocDisplayOwner()` — survey-like categories on project docs often surface as **customer** owner in hub

**Filter UI options:** `FILTER_OWNER_OPTIONS`, `FILTER_TYPE_OPTIONS` in registry.

---

## 2. Database State

### 2.1 New tables (Migration 048)

| Table | Purpose | Writes in Phase 1 |
|-------|---------|-------------------|
| `customer_assets` | Customer-owned vault metadata | **None** (table only) |
| `project_assets` | Project deliverable metadata | **None** (table only) |
| `asset_links` | Link customer asset → project without duplicate blob | **None** (table only) |

Also: RLS enabled + service policies; `pg_trgm` + filename GIN indexes on new tables.

**File:** `supabase/migrations/048_customer_documents_hub_phase1.sql`

### 2.2 Legacy tables (still authoritative for uploads)

| Table | Bucket / storage | Notes |
|-------|------------------|--------|
| `customer_files` | `customer-files` | CRM bills / site / documents; `lead_id` FK |
| `project_documents` | `project-files` | Project Hub docs + survey slots; `project_id` FK |
| `projects` | — | `lead_id` must be set for hub to include project docs |
| `activity_events` | — | CRM timeline |
| `project_activity_log` | — | Project + milestone projection |

Related prior migrations: **047** (`project_documents`), **034** / `docs/migrations/034_customer_detail_tables.sql` (`customer_files`), **015** (`projects.lead_id`).

### 2.3 Migration numbers

| Migration | Status |
|-----------|--------|
| **001–047** | Pre-existing project/CRM schema |
| **048** | **Phase 1** — `customer_assets`, `project_assets`, `asset_links` |
| **049+** | **Not applied** — deprecation, `proposal_assets`, `document_migration_map` planned later |

**Confirm in Supabase:** Dashboard → migrations or `\dt` for the three new tables before assuming prod parity with repo.

### 2.4 What has NOT been migrated yet

| Item | Status |
|------|--------|
| Writes to `customer_assets` / `project_assets` | Not started |
| `asset_links` population | Not started |
| `proposal_assets` table | Deferred (Phase 3) |
| `document_migration_map` | Not created |
| Backfill from `customer_files` / `project_documents` | Not run |
| Upload redirect off legacy APIs | Not done |
| DROP / ALTER on legacy tables | **Forbidden** in Phase 1 |
| Legacy table read removal | Not done — hub still reads legacy |

---

## 3. Validation Results

### 3.1 Phase 1 audit summary

**Script:** `node scripts/phase1-validation-audit.mjs`  
**Output artifact:** `docs/verification/customer-documents-hub/audit-output.json`

| Check | Result |
|-------|--------|
| Migration 048 additive only | PASS — no legacy DROP/ALTER |
| `npm run typecheck` / `npm run build` | PASS (at commit time) |
| Hub merge logic | PASS — code paths for 4 sources |
| Pre-link data | **13** `project_documents`, **0** `customer_files`; **all** pre-link docs on `lead_id IS NULL` projects → **0** visible on any customer hub |
| API filters (clean `next start`) | PASS — structure and params |
| Timeline milestone filter | PASS — allowlist excludes `document_uploaded` |

**Dev note:** Running `npm run build` while `npm run dev` is active can corrupt `.next` (500 / missing vendor chunks). Fix: delete `.next`, restart dev, or use dedicated `next start -p PORT`.

### 3.2 Real-world validation summary (Bharti Gupta)

**Customer:** `eead2c0a-8f20-4c7a-8128-ce8fff874834`  
**Project:** `3cfd6369-4d9a-45d3-8c90-008de6c62a46`

**Scripts:**

- `scripts/link-bharti-realworld-validation.mjs` — link orphan `project_documents` → Bharti `project_id`
- `scripts/cleanup-bharti-duplicate-docs.mjs` — dedupe after re-run
- `scripts/capture-bharti-hub-screenshots.mjs` — UI captures

**Screenshots:** `docs/verification/customer-documents-hub/realworld/01–06-*.png`

| Verification | Result |
|--------------|--------|
| `GET /documents` unfiltered | **4** items (1 `customer_files` + 3 `project_documents`) |
| Owner badges | CUSTOMER (roof, meter, customer copy) + PROJECT (`mgr-upload` as SLD) |
| `owner=customer` / `owner=project` filters | PASS |
| `types=ROOF_PHOTO`, `q=roof`, `project_id` | PASS |
| Hub UI populated | PASS (see `01-hub-populated.png`) |

**Data changes in Supabase (not in git):** Test linking moved files from 3A51 orphan projects; optional revert via `node scripts/link-bharti-realworld-validation.mjs --revert`.

### 3.3 Known limitations (Phase 1)

1. New asset tables unused — all hub rows show **Legacy** until Phase 2 writes.
2. Customer hub invisible for files on projects without `lead_id`.
3. No proposal documents in hub (`proposal_assets` deferred).
4. Dedup is weak (filename/date, not `sha256`).
5. `owner=proposal` accepted by API but returns nothing.
6. Phase 1 duplicate-link risk if link script re-run without guards (mitigated in script + cleanup).

---

## 4. Git State

| Field | Value |
|-------|--------|
| **Commit (full)** | `f758325d3e234d266a16951beca353ca5fbc4982` |
| **Commit (short)** | `f758325` |
| **Message** | `feat(documents-hub): phase 1 unified documents hub` |
| **Tag** | `phase1-documents-hub-complete` |
| **Committed** | 2026-06-03 (IST +0530 per git) |

### Modified areas (Phase 1 commit)

| Area | Files (representative) |
|------|-------------------------|
| **API** | `app/api/customers/[id]/documents/route.ts`, `timeline/route.ts` |
| **UI** | `customer-documents-hub.tsx`, `customer-detail-page.tsx`, `customer-workspace-pane.tsx` |
| **Lib** | `document-category-registry.ts`, `unified-documents-store.ts`, `unified-documents-types.ts`, `customer-documents-client.ts`, `customer-timeline-store.ts`, `followup-client.ts` |
| **DB** | `supabase/migrations/048_customer_documents_hub_phase1.sql` |
| **Docs / verification** | `customer-documents-hub-phase1-delivery.md`, screenshots, audit JSON, validation scripts |

**Related docs (not all in commit):** `docs/architecture/customer-documents-hub-implementation-plan.md` (master plan).

---

## 5. Outstanding Risks

### 5.1 Orphan project issue

**Symptom:** `project_documents` exist but Customer Hub shows zero files.  
**Cause:** `projects.lead_id IS NULL` (e.g. 3A51 doc test projects). Hub only loads docs for projects linked to the customer lead.  
**Mitigation (Phase 2):** Enforce `lead_id` on project create from won leads; guard in verify scripts; data cleanup for orphans.

### 5.2 Survey / site owner mapping issue

**Symptom:** Files uploaded via Project Hub with `doc_category` like `site_other`, `roof_photo`, `meter_photo` appear with **customer** owner badge in unified hub.  
**Cause:** `legacyProjectDocDisplayOwner()` + registry ownership rules (survey media is customer-owned).  
**Impact:** `owner=project` filter omits most survey uploads unless category is a true project type (e.g. `sld`, `pan`).  
**Phase 2 direction:** Customer-owned uploads → `customer_assets` + `asset_links`; project UI writes split by registry.

### 5.3 Duplicate image path issue

**Symptom:** Same physical file can appear twice (e.g. `roof-test.jpg` in `project_documents` and `roof-test-customer-copy.jpg` in `customer_files`).  
**Cause:** Separate legacy write paths; Phase 1 dedup does not use content hash.  
**Mitigation:** Phase 2 `sha256` on `customer_assets`; backfill map; UI dedup by storage path.

### 5.4 Cross-bucket reference

Validation inserted `customer_files` with URL/path from `project-files` bucket. Production uploads should stay bucket-consistent.

### 5.5 Other technical debt

| Item | Notes |
|------|--------|
| Dual upload UI | Hub read-only + legacy Quick upload below (confusing until Phase 2) |
| `document_category_registry` SQL table | Optional; never added — TS + CHECK only |
| RLS on new tables | Service-role-only pattern; review before anon client reads |
| Test data pollution | 3A51 scripts created orphan projects/docs — cleanup scripts exist |
| `.next` / port conflicts | Documented dev workflow issue |

---

## 6. Phase 2 Scope

**Goal:** Writes to new tables, linking, backfill, redirect uploads — **no** legacy DROP.

| Work item | Detail |
|-----------|--------|
| **Writes `customer_assets`** | `POST /api/customers/[id]/files` (+ upload route) → insert metadata; bucket `customer-files` |
| **Writes `project_assets`** | Project-owned categories only |
| **Survey/customer categories on project UI** | Write `customer_assets` + **`asset_links`** instead of duplicate blob in `project_documents` |
| **`asset_links` creation** | On project create: auto-link bill/roof/meter/db/survey customer assets; unique `(project_id, link_role)` |
| **Backfill strategy** | `scripts/backfill-document-assets.mjs` — copy metadata rows; **reuse** `storage_path` / `file_url`; populate `document_migration_map` (new table in Phase 2 migration) |
| **Upload redirect** | Feature flag `DOCUMENTS_HUB_V2_WRITE` / `NEXT_PUBLIC_DOCUMENTS_HUB_V2`; legacy routes delegate to new stores |
| **Hub UI** | Remove or collapse legacy Quick upload when flag on |
| **Timeline** | Already shipped in Phase 1; optional tighten copy |

**Explicitly out of Phase 2:** `proposal_assets`, dropping `customer_files` / `project_documents`.

---

## 7. Phase 3 Scope

| Work item | Detail |
|-----------|--------|
| **`proposal_assets` table** | New migration; bucket `proposal-assets` |
| **Proposal persistence** | On send / revise / approve → generate PDF once → insert row (`proposal_pdf`, `proposal_revision`) |
| **Hub filter** | `owner=proposal` returns real rows |
| **Integration** | Hook existing proposal PDF/PPT pipeline; no duplicate on-demand-only path for sent revisions |

**Still on-demand today:** Proposal PDFs generated at read time; not a dedicated storage domain in Phase 1.

---

## 8. Rollback Plan

### 8.1 Application (Phase 1)

| Action | Effect |
|--------|--------|
| Revert git to pre-`f758325` | Removes hub UI + API; legacy uploads unchanged |
| Hide hub via feature flag (if added) | UI-only rollback |

### 8.2 Database (Migration 048)

**Only safe if new tables are empty or disposable:**

```sql
DROP TABLE IF EXISTS public.asset_links, public.project_assets, public.customer_assets CASCADE;
```

- Does **not** remove legacy data.
- Does **not** undo Bharti test linking (manual revert: `node scripts/link-bharti-realworld-validation.mjs --revert`).

### 8.3 Phase 2+ rollback

| Phase | Rollback |
|-------|----------|
| Phase 2 writes | Set `DOCUMENTS_HUB_V2_WRITE=false`; legacy paths resume; new rows remain readable |
| Phase 3 proposals | Disable PDF persistence hook |
| Phase 4 DROP | **Irreversible** — requires backup + separate approval |

---

## 9. Recommended Next Prompt

Copy into a new session when starting Phase 2:

```
Phase 1 Documents Hub is complete (tag: phase1-documents-hub-complete, commit f758325).

Read docs/architecture/customer-documents-hub-handoff-phase1.md and
docs/architecture/customer-documents-hub-implementation-plan.md.

Implement Phase 2 only:
- Writes to customer_assets and project_assets (feature-flagged)
- asset_links on project create and survey uploads from project UI
- Backfill script from customer_files + project_documents (reuse storage paths)
- Redirect POST /api/customers/[id]/files and POST /api/projects/[id]/documents
- Do NOT create proposal_assets or drop legacy tables

Before coding, confirm Migration 048 is applied in Supabase and report row counts on legacy vs new tables.
```

---

## 10. Quick reference

| Resource | Path |
|----------|------|
| Handoff (this file) | `docs/architecture/customer-documents-hub-handoff-phase1.md` |
| Phase 1 delivery | `docs/architecture/customer-documents-hub-phase1-delivery.md` |
| Master plan | `docs/architecture/customer-documents-hub-implementation-plan.md` |
| Migration 048 | `supabase/migrations/048_customer_documents_hub_phase1.sql` |
| Registry | `lib/document-category-registry.ts` |
| Unified store | `lib/unified-documents-store.ts` |
| Real-world screenshots | `docs/verification/customer-documents-hub/realworld/` |

**Customer ID (Bharti):** `eead2c0a-8f20-4c7a-8128-ce8fff874834`  
**Phase 2 not started.**
