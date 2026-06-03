# Phase 4 — Legacy Write Soak Log

**Criterion:** With `DOCUMENTS_HUB_V2_WRITE=true`, **zero** new rows in `customer_files` and `project_documents` over the soak window (14–30 days recommended).

**Baseline captured:** 2026-06-03 (`baseline-counts.json`)

| Table | Baseline count | Date |
|-------|----------------|------|
| customer_files | 3 | 2026-06-03 |
| project_documents | 12 | 2026-06-03 |

---

## Daily / weekly log

| Date | customer_files Δ | project_documents Δ | Notes | Reviewer |
|------|------------------|----------------------|-------|----------|
| | | | | |

---

## Exceptions

Document any intentional legacy write (flag off, hotfix, manual SQL) with ticket ID and restore plan.

---

## 4A sign-off

| Field | Value |
|-------|-------|
| Soak start | |
| Soak end | |
| Result | PASS / FAIL |
| Signed off by | |
