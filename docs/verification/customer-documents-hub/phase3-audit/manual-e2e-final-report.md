# Phase 3 Manual E2E — Final Validation Report

**Date:** 2026-06-03  
**Migration 050:** Applied in Supabase  
**Test proposal:** bharti gupta — `fd4369ad-d6f4-4396-aead-2ae6c1977635`  
**Customer lead:** `eead2c0a-8f20-4c7a-8128-ce8fff874834`  
**Dev server:** `http://localhost:3000`  
**Overall:** **PASS**

---

## Required checks (user scope)

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| 1 | `proposal_assets` row created | **PASS** | Row `8a574ce4-98e7-4b47-bdea-e8368d432155` — `proposal_revision` v3, PPTX ~2.86 MB, bucket `proposal-assets` |
| 2 | Hub `owner=proposal` returns row | **PASS** | `GET /api/customers/{lead}/documents?owner=proposal` → 1 item, `source: proposal_assets` |
| 3 | Signed download URL works | **PASS** | Hub `download_url` HEAD/GET → HTTP 200 |
| 4 | `customer_files` count unchanged | **PASS** | Before **3**, after **3** (delta 0) |
| 5 | `project_documents` count unchanged | **PASS** | Before **12**, after **12** (delta 0) |

---

## Asset detail

| Field | Value |
|-------|--------|
| Filename | `bharti gupta-proposal-v3.pptx` |
| Category | `proposal_revision` |
| Snapshot | `14550952-e6a2-4feb-8575-5084be11833d` |
| Trigger | `revised` (via `createPricingSnapshot` after PATCH sent unavailable) |
| MIME | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |

---

## Notes (non-blocking)

- **`PATCH` sent → 503** (`update_failed`): `proposals.proposal_status` column still missing in DB (migration 021). Persist was triggered via **direct snapshot + persist** (same code path as `createPricingSnapshot` hook).
- **No code changes** in this validation run.

---

## Artifacts

- `manual-e2e-report.json` — machine-readable full run
- `manual-e2e-report.md` — script-generated summary

**Recommendation:** **Approve Phase 3 for commit** after review. Optional: apply migration **021** so UI `PATCH sent` works without direct persist fallback.

---

*Not committed. Not tagged. Awaiting review.*
