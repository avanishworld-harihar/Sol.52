# Customer Documents Hub — Phase 3 Handoff Report

**Purpose:** Engineering handoff after Phase 3 proposal-assets approval.  
**Status:** Phase 3 complete — PPTX persist on pricing snapshot, hub `owner=proposal`.  
**Date:** June 2026  
**Tag:** `phase3-documents-hub-complete`  
**Base:** Phase 2 commit `a48e1e6` (tag `phase2-documents-hub-complete`)

---

## 1. What shipped

| Area | Summary |
|------|---------|
| **Migration 050** | `proposal_assets` table + RLS |
| **Storage** | Private bucket `proposal-assets`; signed download URLs |
| **Persist hook** | `createPricingSnapshot()` → `persistProposalAssetForSnapshot()` (PPTX via `buildPremiumProposalPptBuffer`) |
| **Categories** | `sent` → `proposal_pdf`; `revised` → `proposal_revision` |
| **Hub read** | `listUnifiedCustomerDocuments` merges `proposal_assets`; filter **Owner: Proposal** |
| **Feature flag** | `DOCUMENTS_HUB_PROPOSAL_PERSIST` (default on) |

**Not shipped:** PDF generation, historical proposal backfill, legacy UI collapse, legacy DROP, backfill execute.

---

## 2. Migrations

| Migration | File | Notes |
|-----------|------|--------|
| **050** | `050_proposal_assets.sql` | Apply in Supabase before using persist |
| **048 / 049** | Unchanged | Phase 1–2 tables |

**050 rollback (emergency):** `DROP TABLE IF EXISTS public.proposal_assets CASCADE;`

---

## 3. Feature flags

| Env | Default | Effect |
|-----|---------|--------|
| `DOCUMENTS_HUB_V2_WRITE` | on | Phase 2 customer/project writes |
| `DOCUMENTS_HUB_PROPOSAL_PERSIST` | on | `false` → skip PPTX persist on snapshot |

---

## 4. Git state

| Field | Value |
|-------|--------|
| **Commit** | `e4664a5dba1f229b00aade41768c8c654c3aec28` (short `e4664a5`) |
| **Tag** | `phase3-documents-hub-complete` |
| **Message** | `feat(documents-hub): phase 3 proposal assets and hub` |

### Key paths

| Area | Paths |
|------|--------|
| Migration | `supabase/migrations/050_proposal_assets.sql` |
| Persist | `lib/proposal-asset-persist.ts`, `lib/proposal-asset-store.ts`, `lib/proposal-asset-upload.ts` |
| Config | `lib/documents-hub-proposal-config.ts` |
| Hook | `lib/proposal-snapshot-store.ts` |
| Hub read | `lib/unified-documents-store.ts`, `lib/unified-documents-types.ts`, `lib/document-category-registry.ts` |
| Validation | `scripts/phase3-validation-audit.mjs`, `scripts/phase3-manual-e2e.mjs` |
| Docs | `customer-documents-hub-phase3-plan.md`, `phase3-validation-report.md`, `phase3-audit/` |

---

## 5. Manual E2E (approved)

**Proposal:** bharti gupta `fd4369ad-d6f4-4396-aead-2ae6c1977635` → lead `eead2c0a-8f20-4c7a-8128-ce8fff874834`

| Check | Result |
|-------|--------|
| `proposal_assets` row | PASS |
| Hub `owner=proposal` | PASS |
| Signed download | PASS |
| `customer_files` delta | 0 |
| `project_documents` delta | 0 |

Artifact: `docs/verification/customer-documents-hub/phase3-audit/manual-e2e-final-report.md`

---

## 6. Write-path

```
createPricingSnapshot (sent | revised)
  → persistProposalAssetForSnapshot (if DOCUMENTS_HUB_PROPOSAL_PERSIST)
       → buildPremiumProposalPptBuffer
       → upload proposal-assets
       → insert proposal_assets (unique pricing_snapshot_id)
```

Requires `proposals.lead_id` for customer hub indexing.

---

## 7. Rollback

1. `DOCUMENTS_HUB_PROPOSAL_PERSIST=false` — stop new rows.  
2. Hub still reads existing `proposal_assets`.  
3. Drop table only if empty/disposable.

---

## 8. Known issues

| Item | Notes |
|------|--------|
| `proposal_status` column | Migration **021** may be missing; `PATCH sent` can 503; persist still runs via snapshot hook when pricing exists |
| Orphan proposals | No `lead_id` → persist skips |
| PPTX vs PDF label | Registry labels say PPTX; no PDF pipeline |

---

## 9. Phase 4 boundary (not started)

See master plan: legacy read-only period, stop legacy writes, eventual DROP of `customer_files` / `project_documents` — **separate approval**.

---

## 10. Prompt stub

```
Phase 1–3 Documents Hub complete.
Tags: phase1-documents-hub-complete, phase2-documents-hub-complete, phase3-documents-hub-complete
Flags: DOCUMENTS_HUB_V2_WRITE, DOCUMENTS_HUB_PROPOSAL_PERSIST (default on)
Backfill: dry-run only — do not --execute without approval
Do not start Phase 4 unless asked.
```

---

## 11. Related docs

| Doc | Path |
|-----|------|
| Phase 3 plan | `customer-documents-hub-phase3-plan.md` |
| Phase 3 validation | `customer-documents-hub-phase3-validation-report.md` |
| Phase 2 handoff | `customer-documents-hub-handoff-phase2.md` |
| Master plan | `customer-documents-hub-implementation-plan.md` |
