# Phase 3 Manual E2E Report

**Generated:** 2026-06-04T07:14:03.833Z  
**Proposal:** bharti gupta (`a5c2122e-5fbc-4613-a8bb-d6a15b97cae9`)  
**Customer lead:** `eead2c0a-8f20-4c7a-8128-ce8fff874834`  
**Summary:** PASS

| Check | Result | Note |
|-------|--------|------|
| migration_050_applied | **PASS** | proposal_assets table reachable |
| linked_proposal | **PASS** | bharti gupta (a5c2122e…) |
| has_pricing | **PASS** | proposal_pricing exists |
| proposal_assets_row | **PASS** | proposal_revision v7 |
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
    "stdout": "snapshot d76b720e-7020-4100-a808-104261cc61ae 7 revised\npersist { ok: true }\n",
    "stderr": ""
  }
}
```
