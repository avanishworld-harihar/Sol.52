# Customer Documents Hub — Phase 3 Implementation Plan

**Status:** Awaiting review — **no code changes until approved**  
**Base commit:** `a48e1e6dba1f229b00aade41768c8c654c3aec28` (Phase 2 complete)  
**Tags:** `phase1-documents-hub-complete`, `phase2-documents-hub-complete`  
**Date:** June 2026

---

## 1. Objective

Deliver the **third asset domain** (`proposal_assets`) so the Customer Documents Hub can discover frozen proposal exports, and wire **persist-on-send** to the existing proposal lifecycle — without altering legacy file tables, without running Phase 2 backfill execute, and without starting Phase 4 deprecation.

### In scope

| # | Deliverable |
|---|-------------|
| 1 | Additive migration `050` — `proposal_assets` table + CHECK constraints |
| 2 | Supabase storage bucket `proposal-assets` (private, signed URLs) |
| 3 | `lib/proposal-asset-store.ts` + upload/signed-URL helpers |
| 4 | Persist hook on proposal **sent** (and snapshot **revised**) aligned with `proposal_pricing_snapshots` |
| 5 | Unified hub read path — merge `proposal_assets`; `owner=proposal` returns real rows |
| 6 | Hub UI — owner filter includes **Proposal**; type filter includes `PROPOSAL_PDF` / `PROPOSAL_REVISION` |
| 7 | Feature flag for persistence (default on after validation) |
| 8 | `scripts/phase3-validation-audit.mjs` + verification artifacts |

### Out of scope (explicit)

| Item | Phase |
|------|--------|
| DROP / ALTER on `customer_files`, `project_documents` | Phase 4 |
| `scripts/backfill-document-assets.mjs --execute` | Separate approval (Phase 2) |
| `proposal_assets` backfill from historical sends (no legacy file table) | Optional follow-up; not auto-run |
| True server-side **PDF** rasterization (unless approved as 3b stretch) | See §4.3 |
| `proposal_assets` writes from generic hub POST | Phase 3 is lifecycle-hook driven only |
| Phase 4 feature-flag legacy write stop | Phase 4 |
| Collapsing legacy Quick upload UI | Optional stretch (§6.5); not blocking |

---

## 2. Architecture alignment (Phase 1 + 2)

Phase 3 **extends** existing decisions; it does not replace them.

| Layer | Phase 1 | Phase 2 | Phase 3 |
|-------|---------|---------|---------|
| Discovery | Unified GET hub merges sources | Same + v2 rows | + `proposal_assets` |
| Registry | `document-category-registry.ts` (owners incl. `proposal`) | Project/customer write routing | Use reserved `PROPOSAL_*` categories |
| Writes | Read-only hub | `DOCUMENTS_HUB_V2_WRITE` → customer/project assets | New flag → proposal persist hook |
| Legacy | `customer_files` + `project_documents` still read | Still read; v2 default on | **Unchanged** — no DROP |
| Snapshots | — | Pricing JSON in `proposal_pricing_snapshots` | Link `proposal_assets.pricing_snapshot_id` |
| Migration map | 049 `document_migration_map` | Backfill dry-run only | Not required for proposals (no legacy blob table) |

**Invariant:** One frozen export per pricing snapshot version (idempotent persist).

---

## 3. Data model

### 3.1 Migration `050_proposal_assets.sql` (new file)

Additive only. Follow column patterns from Migration 048 (`customer_assets` / `project_assets`).

```sql
CREATE TABLE IF NOT EXISTS public.proposal_assets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  customer_id         uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  proposal_id         uuid NOT NULL REFERENCES public.proposals (id) ON DELETE CASCADE,
  pricing_snapshot_id uuid NULL REFERENCES public.proposal_pricing_snapshots (id) ON DELETE SET NULL,
  category            text NOT NULL,
  revision_number     integer NOT NULL DEFAULT 1,
  storage_bucket      text NOT NULL DEFAULT 'proposal-assets',
  storage_path        text NOT NULL,
  filename            text NOT NULL,
  mime_type           text NOT NULL DEFAULT 'application/pdf',
  size_bytes          integer NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  triggered_by        text NOT NULL DEFAULT 'sent',
  archived_at         timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_assets_category_chk CHECK (
    category IN ('proposal_pdf', 'proposal_revision')
  ),
  CONSTRAINT proposal_assets_triggered_by_chk CHECK (
    triggered_by IN ('sent', 'revised', 'approved', 'manual')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS proposal_assets_snapshot_uidx
  ON public.proposal_assets (pricing_snapshot_id)
  WHERE pricing_snapshot_id IS NOT NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS proposal_assets_customer_time_idx
  ON public.proposal_assets (organization_id, customer_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS proposal_assets_proposal_idx
  ON public.proposal_assets (proposal_id, revision_number DESC)
  WHERE archived_at IS NULL;

ALTER TABLE public.proposal_assets ENABLE ROW LEVEL SECURITY;
-- Service-role policy pattern (match 048 / 049)
```

**Category mapping (registry → row):**

| Snapshot `triggered_by` | `proposal_assets.category` | `revision_number` |
|-------------------------|----------------------------|-------------------|
| `sent` (first send) | `proposal_pdf` | `1` |
| `revised` | `proposal_revision` | snapshot `version` |
| `approved` (no file yet) | Optional: `proposal_pdf` if generating approval export | latest |
| `manual` | `proposal_revision` or skip | per policy |

**Storage path convention:**

`{organization_id}/{customer_id}/{proposal_id}/{snapshot_id or uuid}.{ext}`

### 3.2 Storage bucket `proposal-assets`

| Property | Value |
|----------|--------|
| Name | `proposal-assets` |
| Public | **No** (signed URLs via admin client, same as project-files) |
| Creation | `lib/proposal-asset-upload.ts` `ensureProposalAssetsBucket()` on first upload; document in migration README / setup script |

**Pre-deploy checklist:** Confirm bucket exists in Supabase Dashboard or run one-time setup script (non-destructive).

### 3.3 Registry (no schema change required)

Already defined in `lib/document-category-registry.ts`:

- `PROPOSAL_PDF` → `proposal_pdf` → owner `proposal`
- `PROPOSAL_REVISION` → `proposal_revision` → owner `proposal`

**UI updates:** Add `proposal` to `FILTER_OWNER_OPTIONS` and proposal categories to `FILTER_TYPE_OPTIONS` (currently omitted).

---

## 4. Write path — proposal persistence

### 4.1 Feature flag

**File:** `lib/documents-hub-proposal-config.ts`

| Env | Default | Effect |
|-----|---------|--------|
| `DOCUMENTS_HUB_PROPOSAL_PERSIST` | on (unset = on) | `false` / `0` / `off` → skip storage writes; hub read still works |

Independent of `DOCUMENTS_HUB_V2_WRITE` (Phase 2). Both can be toggled separately for rollback.

### 4.2 Hook point (primary)

**File:** `app/api/proposals/[id]/route.ts`

Extend existing lifecycle handlers (do **not** block PATCH response):

```
PATCH proposal_status → "sent"
  → onProposalSent() [existing snapshot]
  → persistProposalAssetFromSnapshot() [NEW, fire-and-forget]

PATCH proposal_status → "approved"
  → onProposalApproved() [existing]
  → optional persist if no sent asset exists [NEW, lower priority]
```

**Alternative hook (cleaner coupling):** call persist from `lib/proposal-snapshot-store.ts` inside `createPricingSnapshot()` after successful insert — ensures every snapshot row gets at most one asset attempt.

**Recommendation:** Persist from `createPricingSnapshot` return path when `lead_id` is present and flag is on — single source of truth per snapshot.

### 4.3 Export format strategy (review decision)

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A — PPTX (MVP)** | Reuses `buildPremiumProposalPptBuffer` + `GET /api/proposals/[id]/ppt` engine; server-ready today | Registry label says “PDF”; mime is PPTX | **Default MVP** if PDF infra not approved |
| **B — PDF (target)** | Matches registry / user expectation | Today `lib/proposal-pdf.ts` is **browser-only** (html2canvas + jsPDF); needs headless render or upload callback | Phase 3b or explicit approval |
| **C — Hybrid** | PPTX on send immediately; PDF via optional `POST /api/proposals/[id]/assets` from client after download | Two rows possible | Document dedup by `pricing_snapshot_id` |

**Approved architecture text (Phase 1 handoff):** “Generate PDF once on send/revise.”

**Proposed compromise for review:**

1. **Phase 3.0 (approved MVP):** Persist **PPTX** frozen export on snapshot create; store with accurate `mime_type`; hub label uses registry (“Proposal PDF” / “Proposal revision”) with subtitle or tooltip noting format until PDF pipeline ships.
2. **Phase 3.1 (optional):** Server PDF via Playwright render of `/proposal/[share_token]/present` OR client upload endpoint — **separate approval**.

**Do not** leave on-demand-only PPT/PDF as the sole record for proposals that reached `sent` after Phase 3 ships.

### 4.4 Idempotency & skips

| Rule | Behavior |
|------|----------|
| Unique `(pricing_snapshot_id)` | Second persist attempt → no-op success |
| Missing `proposal.lead_id` | Log warning; skip persist (hub cannot index by customer) |
| Missing pricing row | Skip (same as today’s `onProposalSent`) |
| `draft` → `sent` repeat | Snapshot trigger `revised` → new row, new category `proposal_revision` |
| Persist failure | Log; never fail status PATCH |

### 4.5 New modules

| File | Responsibility |
|------|----------------|
| `lib/proposal-asset-store.ts` | CRUD insert/select by customer/proposal/snapshot |
| `lib/proposal-asset-upload.ts` | Bucket ensure, upload buffer, signed download URL |
| `lib/proposal-asset-persist.ts` | Orchestrate: load proposal + pricing + ppt_input → buffer → upload → insert row |

---

## 5. Read path — unified hub

### 5.1 Store changes

**Edit:** `lib/unified-documents-store.ts`

- Add `fetchProposalAssets(customerId, orgId)` mirroring customer/project asset fetch.
- Merge into union before sort/filter.
- Set `owner: "proposal"`, `proposal_id`, `proposal_revision` (from `revision_number`), `source: "proposal_assets"`, `legacy: false`.
- Signed URLs via `proposal-asset-upload` helper.

**Edit:** `lib/unified-documents-types.ts`

- `proposal_id: string | null`
- `proposal_revision: number | null`
- `UnifiedDocumentSource` += `"proposal_assets"`

**No API route change** — `GET /api/customers/[id]/documents` already accepts `owner=proposal`; today it returns empty.

### 5.2 Hub UI

**Edit:** `components/customers/customer-documents-hub.tsx`

- Owner badge already styles `proposal` (violet).
- Registry filter options (§3.3).
- Optional: show proposal name/link if `proposal_id` present (read `proposals.customer_name` in facets or row enrichment).

---

## 6. Affected files (complete list)

### 6.1 New files

| Path | Purpose |
|------|---------|
| `supabase/migrations/050_proposal_assets.sql` | Table + indexes + RLS |
| `lib/documents-hub-proposal-config.ts` | Feature flag |
| `lib/proposal-asset-store.ts` | DB access |
| `lib/proposal-asset-upload.ts` | Storage I/O |
| `lib/proposal-asset-persist.ts` | Lifecycle persist orchestration |
| `scripts/phase3-validation-audit.mjs` | Automated validation |
| `scripts/ensure-proposal-assets-bucket.mjs` | One-time bucket setup (optional) |
| `docs/architecture/customer-documents-hub-phase3-validation-report.md` | Post-implementation results |
| `docs/verification/customer-documents-hub/phase3-audit/` | Screenshots + `audit-report.json` |

### 6.2 Modified files

| Path | Change |
|------|--------|
| `lib/unified-documents-store.ts` | Merge `proposal_assets` |
| `lib/unified-documents-types.ts` | Proposal fields + source |
| `lib/document-category-registry.ts` | `FILTER_OWNER_OPTIONS`, `FILTER_TYPE_OPTIONS` |
| `lib/proposal-snapshot-store.ts` and/or `app/api/proposals/[id]/route.ts` | Persist hook |
| `components/customers/customer-detail-page.tsx` | SWR mutate after proposal send (if send from profile) |
| `lib/customer-documents-client.ts` | Types only if response shape extends |
| `docs/architecture/customer-documents-hub-handoff-phase2.md` | Pointer to Phase 3 (post-ship) |

### 6.3 Not modified (unless stretch approved)

| Path | Reason |
|------|--------|
| `customer_files`, `project_documents` schemas | Phase 4 only |
| `lib/document-write-router.ts` | Customer/project only |
| `scripts/backfill-document-assets.mjs` | No proposal legacy table |
| `app/api/customers/[id]/files/*` | Unchanged |
| `app/api/projects/[id]/documents/*` | Unchanged |

### 6.5 Optional stretch (separate approval within Phase 3)

| Item | Files |
|------|--------|
| Collapse legacy Quick upload when v2 + proposal flags on | `customer-detail-page.tsx` |
| Historical proposal export backfill | New `scripts/backfill-proposal-assets.mjs` (dry-run first) |
| Server PDF pipeline | New API route + Playwright dependency |

---

## 7. Rollback strategy

| Level | Action | Effect |
|-------|--------|--------|
| **App** | `DOCUMENTS_HUB_PROPOSAL_PERSIST=false` | New sends stop creating rows; PATCH/snapshot unchanged |
| **Read** | No flag needed | Hub omits `proposal_assets` if table empty or fetch disabled |
| **DB** | Only if table empty or disposable | `DROP TABLE IF EXISTS public.proposal_assets CASCADE;` |
| **Storage** | Manual | Delete objects in `proposal-assets` bucket if rollback storage |
| **Phase 2** | Unchanged | `DOCUMENTS_HUB_V2_WRITE` independent |

**Not reversible without backup:** Deleting populated `proposal_assets` rows customers rely on in hub.

**Tag after successful Phase 3:** `phase3-documents-hub-complete` (annotated, same pattern as Phase 1/2).

---

## 8. Validation steps (pre/post implementation)

### 8.1 Pre-implementation gate

- [ ] Stakeholder approves §4.3 export format (PPTX MVP vs PDF target).
- [ ] Confirm Migration 048 + 049 applied in Supabase (Phase 2 baseline).
- [ ] Approve `proposal-assets` bucket creation in Supabase project.
- [ ] Confirm test proposal has `lead_id` set (Bharti lead `eead2c0a-8f20-4c7a-8128-ce8fff874834`).

### 8.2 Post-migration (050)

```bash
# Table exists (service role / SQL editor)
SELECT COUNT(*) FROM public.proposal_assets;
```

### 8.3 Automated audit (new script)

```bash
# Dev server on latest code
npm run dev   # port 3000
node scripts/phase3-validation-audit.mjs
```

| Check ID | Expected |
|----------|----------|
| `050_table` | `proposal_assets` exists; no legacy ALTER/DROP |
| `bucket_proposal_assets` | Bucket reachable |
| `persist_on_sent` | PATCH `sent` → row in `proposal_assets` linked to snapshot |
| `idempotent_snapshot` | Re-run persist for same snapshot → no duplicate |
| `hub_owner_proposal` | `GET …/documents?owner=proposal` → ≥1 item |
| `hub_type_proposal_pdf` | `types=PROPOSAL_PDF` filter works |
| `legacy_unchanged` | `customer_files` / `project_documents` counts unchanged by proposal test |
| `flag_off_skips_write` | With `DOCUMENTS_HUB_PROPOSAL_PERSIST=false`, sent → no new row |

Artifact: `docs/verification/customer-documents-hub/phase3-audit/audit-report.json`

### 8.4 Manual / UI

1. Customer profile → Documents → filter **Owner: Proposal** — see frozen export with download.
2. Proposal workspace → mark **Sent** → refresh hub — new row appears.
3. Re-send (draft → sent again) → `proposal_revision` row with higher version.
4. Screenshots: hub proposal filter, storage row in Supabase table browser.

### 8.5 Regression

- Re-run `node scripts/phase2-validation-audit.mjs` — **16/16 PASS** (Phase 2 must not regress).
- `npm run typecheck`

---

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **PDF vs PPTX mismatch** | User expects PDF; gets PPTX | §4.3 review gate; accurate mime; Phase 3.1 PDF path |
| **Browser-only PDF today** | Cannot meet “PDF on send” without new infra | MVP PPTX; document in handoff |
| **Missing `lead_id` on proposal** | Asset not indexed in customer hub | Skip persist + log; enforce lead on send in CRM |
| **Persist fails silently** | Hub empty despite `sent` | Structured logs; audit script; optional `proposal_approval_events` extension |
| **Storage cost** | Many revisions | One row per snapshot; retention policy later |
| **Large PPTX generation** | Slow PATCH side-effect | Fire-and-forget; queue/job considered if >5s observed |
| **Duplicate exports** | Same snapshot twice | UNIQUE on `pricing_snapshot_id` |
| **Org ID resolution** | Wrong bucket path | Reuse `resolveDefaultOrgId()` from project-store pattern |
| **RLS / signed URL failures** | Download broken | Service-role upload; same signed-URL pattern as project assets |
| **Stale `next start` build** | Validation false negatives | Validate on `npm run dev` only |
| **On-demand PPT still used** | Two sources of truth | After Phase 3, hub is canonical for **sent** revisions; keep GET ppt for ad-hoc preview only |

---

## 10. Implementation order (after approval)

```
Step 1  Migration 050 + bucket setup script/docs
Step 2  proposal-asset-store + upload + config flag
Step 3  proposal-asset-persist (PPTX MVP per §4.3 decision)
Step 4  Hook snapshot / onProposalSent
Step 5  unified-documents-store + types + registry filters
Step 6  Hub UI facets / proposal link (minimal)
Step 7  phase3-validation-audit.mjs + docs
Step 8  Phase 2 regression audit + handoff-phase3.md (post-commit)
```

**Estimated touch:** ~10 new files, ~8 edits. No broad refactor.

---

## 11. Approval checklist

Before any code or migration is applied:

- [ ] **Export format:** PPTX MVP (3.0) vs PDF required in 3.0
- [ ] **Migration 050** schema approved (`pricing_snapshot_id` unique, categories)
- [ ] **Bucket** `proposal-assets` approved in Supabase
- [ ] **Hook location:** `createPricingSnapshot` vs `onProposalSent` confirmed
- [ ] **Optional stretch** (UI collapse, historical backfill, PDF) explicitly in or out
- [ ] **Phase 4** remains out of scope

---

## 12. Post-Phase 3 handoff (after commit — not now)

When implementation is complete, add:

- `docs/architecture/customer-documents-hub-handoff-phase3.md`
- Tag: `phase3-documents-hub-complete`
- Update Phase 2 handoff §11 prompt stub

---

## 13. Reference

| Doc | Path |
|-----|------|
| Master plan | `customer-documents-hub-implementation-plan.md` §4.3, §5.3, Phase 3 |
| Phase 1 handoff | `customer-documents-hub-handoff-phase1.md` §7 |
| Phase 2 handoff | `customer-documents-hub-handoff-phase2.md` |
| Registry | `lib/document-category-registry.ts` |
| Lifecycle | `app/api/proposals/[id]/route.ts`, `lib/proposal-snapshot-store.ts` |
| PPT engine | `lib/proposal-ppt.ts`, `app/api/proposals/[id]/ppt/route.ts` |

**Base commit for implementation branch:** `a48e1e6dba1f229b00aade41768c8c654c3aec28`

---

*End of plan — awaiting review. Do not implement until checklist §11 is approved.*
