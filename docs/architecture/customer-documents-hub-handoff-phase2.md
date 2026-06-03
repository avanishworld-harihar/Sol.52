# Customer Documents Hub — Phase 2 Handoff Report

**Purpose:** Engineering handoff after Phase 2 write-path approval.  
**Status:** Phase 2 complete — v2 writes, asset linking, backfill framework (dry-run only).  
**Date:** June 2026  
**Do not run backfill `--execute` or drop legacy tables without a separate approved change.**

---

## 1. What shipped

| Area | Summary |
|------|---------|
| **V2 writes** | `DOCUMENTS_HUB_V2_WRITE` (default **on**). Customer uploads → `customer_assets`; project-owned categories → `project_assets`; customer-owned project slots → `customer_assets` + `asset_links`. |
| **Legacy reads** | Phase 1 hub still merges `customer_files` + `project_documents` + v2 tables. |
| **Linking** | `asset_links` on project create (`linkCustomerAssetsOnProjectCreate`). |
| **Backfill** | `scripts/backfill-document-assets.mjs` — **dry-run only** in Phase 2; uses `document_migration_map`. |
| **Category fix** | `lib/project-document-types.ts` — KYC slugs (`aadhaar`, `pan`, `agreement`, etc.) aligned with registry + API validation. |

**Explicitly not shipped:** `proposal_assets`, legacy DROP, backfill execute, Phase 3.

---

## 2. Migrations

| Migration | File | Applied in Supabase |
|-----------|------|---------------------|
| **048** | `048_customer_documents_hub_phase1.sql` | Phase 1 (`customer_assets`, `project_assets`, `asset_links`) |
| **049** | `049_document_migration_map.sql` | **Yes** — `public.document_migration_map` exists (verified via audit + service role query) |

**049 rollback (emergency):** `DROP TABLE IF EXISTS public.document_migration_map CASCADE;`  
No changes to `customer_files` or `project_documents`.

---

## 3. Feature flag

| Env | Default | Effect |
|-----|---------|--------|
| `DOCUMENTS_HUB_V2_WRITE` | on (unset = on) | `false` / `0` / `off` → legacy table writes only |

Source: `lib/documents-hub-write-config.ts`

---

## 4. Git state (update after commit)

| Field | Value |
|-------|--------|
| **Commit** | _Replace with `git rev-parse HEAD` after commit_ |
| **Message** | `feat(documents-hub): phase 2 v2 writes and asset linking` |
| **Tag** | `phase2-documents-hub-complete` |
| **Base** | `51072bb` — Phase 1 handoff on `main` |

### Files in Phase 2 commit (representative)

| Area | Paths |
|------|--------|
| **Migration** | `supabase/migrations/049_document_migration_map.sql` |
| **Stores / router** | `lib/customer-asset-store.ts`, `lib/project-asset-store.ts`, `lib/asset-link-store.ts`, `lib/document-write-router.ts`, `lib/documents-hub-write-config.ts` |
| **API** | `app/api/customers/[id]/files/route.ts`, `files/upload/route.ts`, `app/api/projects/[id]/documents/route.ts`, `app/api/projects/route.ts` |
| **Lib** | `lib/project-document-store.ts`, `lib/project-document-types.ts`, `lib/document-category-registry.ts`, `lib/project-store.ts` |
| **UI** | `components/customers/customer-detail-page.tsx` (hub mutate after upload) |
| **Scripts** | `scripts/backfill-document-assets.mjs`, `scripts/phase2-validation-audit.mjs` |
| **Docs** | `customer-documents-hub-phase2-plan.md`, `phase2-audit-report.md`, `phase2-validation-report.md`, verification under `docs/verification/customer-documents-hub/phase2-audit/` |

---

## 5. Final validation (pre-commit)

**Audit:** `node scripts/phase2-validation-audit.mjs`  
**Requires:** Dev server on latest code (`npm run dev`, port **3000**) — `BASE_URL=http://localhost:3000`.

| Check | Result |
|-------|--------|
| Migration 049 table | **PASS** |
| Upload BILL / ROOF / METER → v2 | **PASS** |
| Upload AADHAAR / PAN / AGREEMENT → `project_assets` | **PASS** (201) |
| Hub filters + legacy visible | **PASS** |
| No new `customer_files` on v2 upload (`cf delta 0`) | **PASS** |
| **Total** | **16/16 PASS** |

Artifact: `docs/verification/customer-documents-hub/phase2-audit/audit-report.json`

**Note:** `next start` on port 3006 may serve an older build without the category fix; use `npm run dev` for validation.

---

## 6. Write-path reference

```
DOCUMENTS_HUB_V2_WRITE (default ON)
        │
        ├─ POST /api/customers/[id]/files/upload  → customer_assets (legacy if flag off)
        ├─ POST /api/projects/[id]/documents      → project_assets OR customer_assets + asset_links
        └─ POST /api/projects (create)            → linkCustomerAssetsOnProjectCreate()
```

Category source of truth: `lib/document-category-registry.ts`  
Upload allowlist: `lib/project-document-types.ts` (`PROJECT_DOCUMENT_CATEGORIES`, `isProjectDocumentCategory`)

---

## 7. Backfill (not executed)

```bash
# Dry-run only (Phase 2 approved scope)
node scripts/backfill-document-assets.mjs

# DO NOT run without explicit approval:
# node scripts/backfill-document-assets.mjs --execute
```

---

## 8. Rollback

1. Set `DOCUMENTS_HUB_V2_WRITE=false` and redeploy — writes return to legacy tables only.  
2. Reads unchanged (hub still merges legacy + v2).  
3. Migration 049 is additive; rollback SQL above if table must be removed.

---

## 9. Known issues / Phase 3 boundary

| Item | Notes |
|------|--------|
| Orphan `projects.lead_id IS NULL` | Hub hides those `project_documents` until linked |
| Dual upload UI | Hub + legacy Quick upload blocks (collapse in Phase 3+) |
| `owner=proposal` | No rows until `proposal_assets` (Phase 3) |
| Test data | Bharti project `3cfd6369-…` used for audits; `phase2-audit-*` filenames in DB |
| Stale production build | Rebuild/restart after deploy so KYC categories are in API bundle |

**Phase 3:** `proposal_assets`, proposal PDF persistence, hub `owner=proposal` — see Phase 1 handoff §7.

---

## 10. Related docs

| Doc | Path |
|-----|------|
| Phase 1 handoff | `customer-documents-hub-handoff-phase1.md` |
| Phase 2 plan | `customer-documents-hub-phase2-plan.md` |
| Phase 2 audit report | `customer-documents-hub-phase2-audit-report.md` |
| Master plan | `customer-documents-hub-implementation-plan.md` |

---

## 11. Prompt stub for next session

```
Phase 1 + Phase 2 Documents Hub are complete.
- Phase 1 tag: phase1-documents-hub-complete (f758325)
- Phase 2 tag: phase2-documents-hub-complete
- V2 writes: DOCUMENTS_HUB_V2_WRITE (default on)
- Backfill: dry-run only; do not --execute without approval
- Do not start Phase 3 unless asked (proposal_assets)
```
