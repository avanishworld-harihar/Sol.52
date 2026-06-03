# Phase 3 Manual E2E Report

**Generated:** 2026-06-03T13:23:16.428Z  
**Proposal:** bharti gupta (`a5c2122e-5fbc-4613-a8bb-d6a15b97cae9`)  
**Customer lead:** `eead2c0a-8f20-4c7a-8128-ce8fff874834`  
**Summary:** PASS

| Check | Result | Note |
|-------|--------|------|
| migration_050_applied | **PASS** | proposal_assets table reachable |
| linked_proposal | **PASS** | bharti gupta (a5c2122e…) |
| has_pricing | **PASS** | proposal_pricing exists |
| proposal_assets_row | **PASS** | proposal_revision v4 |
| hub_owner_proposal | **PASS** | hub proposal items: 4 |
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
    "stdout": "snapshot bfc08e88-3dc7-4a8d-9dc8-a1e32320bd72 4 revised\npersist { ok: true }\n",
    "stderr": ""
  }
}
```
