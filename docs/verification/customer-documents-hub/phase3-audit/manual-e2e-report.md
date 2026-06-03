# Phase 3 Manual E2E Report

**Generated:** 2026-06-03T11:41:51.036Z  
**Proposal:** bharti gupta (`fd4369ad-d6f4-4396-aead-2ae6c1977635`)  
**Customer lead:** `eead2c0a-8f20-4c7a-8128-ce8fff874834`  
**Summary:** PASS

| Check | Result | Note |
|-------|--------|------|
| migration_050_applied | **PASS** | proposal_assets table reachable |
| linked_proposal | **PASS** | bharti gupta (fd4369ad…) |
| has_pricing | **PASS** | proposal_pricing exists |
| proposal_assets_row | **PASS** | proposal_revision v3 |
| hub_owner_proposal | **PASS** | hub proposal items: 1 |
| download_url | **PASS** | HEAD/GET ok |
| legacy_customer_files_unchanged | **PASS** | delta: 0 |
| legacy_project_documents_unchanged | **PASS** | delta: 0 |

## Lifecycle
```json
{
  "has_pricing": true,
  "patch": {
    "status": 503,
    "ok": false,
    "from": "draft",
    "error": "update_failed"
  },
  "direct_persist": "attempting via createPricingSnapshot",
  "direct_persist_result": {
    "status": 0,
    "stdout": "snapshot 14550952-e6a2-4feb-8575-5084be11833d 3 revised\npersist { ok: true }\n",
    "stderr": ""
  }
}
```
