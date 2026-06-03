# Customer Documents Hub — Phase 5A Validation Report

**Generated:** 2026-06-03  
**Phase:** 5A — v2-only reads, legacy UI hidden  
**Commit / tag:** none (awaiting review)

---

## Executive summary

| Criterion | Result |
|-----------|--------|
| Legacy read OFF (`DOCUMENTS_HUB_LEGACY_READ=false`) | **PASS** |
| Hub sources v2-only (no `customer_files` / `project_documents` in API) | **PASS** |
| Download URLs on hub sample | **PASS** (40/40 on default page) |
| Phase 2 audit | **PASS** |
| Phase 3 manual E2E | **PASS** |
| Phase 4 stabilization audit | **PASS** |
| Phase 4 data verification | **PASS** |
| Customer / project / proposal owner filters | **PASS** |
| No DROP / no deletes | **Compliant** |

**Overall:** **PASS**

---

## 1. Configuration (Phase 5A defaults)

| Variable | Phase 5A value | Rollback |
|----------|----------------|----------|
| `DOCUMENTS_HUB_LEGACY_READ` | `false` (default when unset) | `true` |
| `NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ` | `false` (default when unset) | `true` |
| `DOCUMENTS_HUB_V2_WRITE` | `true` (unchanged) | — |
| `DOCUMENTS_HUB_PROPOSAL_PERSIST` | `true` (unchanged) | — |

See: [`customer-documents-hub-phase5a-rollback.md`](./customer-documents-hub-phase5a-rollback.md)

---

## 2. Code changes (non-destructive)

| Area | Change |
|------|--------|
| `lib/documents-hub-read-config.ts` | Server gate for legacy table reads |
| `lib/documents-hub-legacy-ui-config.ts` | Client gate for Quick upload UI |
| `lib/unified-documents-store.ts` | Skip legacy merge when read OFF |
| `lib/project-document-store.ts` | List/get/archive v2-first when read OFF |
| `lib/document-write-router.ts` | `/files` list from v2 when read OFF |
| `customer-documents-hub.tsx` | v2 upload strip when legacy UI hidden |
| `customer-detail-page.tsx` | Hide legacy Quick upload |
| `project-hub-documents-tab.tsx` | Hide duplicate Quick upload card |

**Not changed:** schema, DROP, deletes, `document_migration_map`, backfill data.

---

## 3. Unified hub (Bharti `eead2c0a-…`, legacy read OFF)

| Query | Total | Sources | Legacy rows |
|-------|------:|---------|-------------|
| All | 40 | proposal_assets 6, project_assets 15, customer_assets 19 | 0 |
| limit=100 | 44 | v2 only | 0 |
| owner=customer | 23 | customer_assets | 0 |
| owner=project | 15 | project_assets | 0 |
| owner=proposal | 6 | proposal_assets | 0 |

Artifact: `docs/verification/customer-documents-hub/phase4-stabilization/hub-verification-report.json`  
Audit bundle: `docs/verification/customer-documents-hub/phase5a/phase5a-audit-report.json`

---

## 4. Manual E2E (real customer)

| Check | Result |
|-------|--------|
| Linked proposal (Bharti) | PASS |
| `proposal_assets` + hub `owner=proposal` | PASS |
| Signed download HTTP 200 | PASS |
| Legacy table deltas during E2E | 0 |

---

## 5. Regression suite

```bash
DOCUMENTS_HUB_LEGACY_READ=false node scripts/phase5a-validation-audit.mjs
```

All child scripts exited **0** on 2026-06-03 run.

---

## 6. Upload paths (v2)

| Flow | Route | Writes |
|------|-------|--------|
| Customer hub upload | `POST /api/customers/[id]/files/upload` | `customer_assets` |
| Project survey / API | `POST /api/projects/[id]/documents` | `project_assets` / links |
| Proposal snapshot | pricing snapshot hook | `proposal_assets` |

Legacy Quick upload UI is **hidden**; customer uploads use **Upload (v2)** on Documents Hub.

---

## 7. Orphan / unmigrated legacy data

Rows only in `project_documents` on orphan projects (no `lead_id`) are **not** in the customer hub when legacy read is OFF. They remain in the database; link `projects.lead_id` or enable rollback read to surface them.

Reference: `phase4-stabilization/remaining-orphan-rows-report.json` (5 rows).

---

## 8. Reviewer checklist

- [ ] Confirm production env: `DOCUMENTS_HUB_LEGACY_READ=false` (or unset)
- [ ] Confirm `NEXT_PUBLIC_DOCUMENTS_HUB_LEGACY_READ=false` for UI
- [ ] Support briefed: no legacy rows in hub; possible fewer items vs Phase 4 duplicate view
- [ ] Rollback doc reviewed
- [ ] Approve commit when ready (no tag in this run)

---

## 9. Success criteria mapping

| # | Criterion | Status |
|---|-----------|--------|
| 1 | No legacy reads executed | PASS (hub + list APIs gated) |
| 2 | Document flows via v2 assets | PASS |
| 3 | Customer / project / proposal visible + downloadable | PASS |
| 4 | All audits PASS | PASS |
| 5 | Rollback documented | PASS |
