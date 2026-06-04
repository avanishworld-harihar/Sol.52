# Phase 5B — Unified Project Documents Validation

Generated: 2026-06-04T05:05:00.377Z

## Scope
- **Option A:** Project hub reads `project_assets` + linked customer `customer_assets` + `proposal_assets`
- **Option B:** Customer hub uploads auto-link to active projects (asset_links)

## Test subject
| Field | Value |
|-------|-------|
| Customer (Bharti Gupta) | `eead2c0a-8f20-4c7a-8128-ce8fff874834` |
| Project | `3cfd6369-4d9a-45d3-8c90-008de6c62a46` |

## DB snapshot
| Source | Active rows |
|--------|-------------|
| customer_assets | 7 |
| project_assets (this project) | 0 |
| proposal_assets | 0 |
| asset_links (this project) | 7 |

## API results
| Check | Total |
|-------|-------|
| Customer hub items | 7 |
| Project hub items | 7 |
| Summary total | 7 |
| Missing customer assets on project | 0 |

## Pass / fail
- **project_linked_to_bharti_lead:** PASS — lead_id=eead2c0a-8f20-4c7a-8128-ce8fff874834
- **customer_hub_api:** PASS — status=200 items=7
- **project_hub_api:** PASS — status=200 items=7
- **project_summary_api:** PASS — total=7
- **summary_matches_list_total:** PASS — summary=7 list=7
- **unified_includes_all_v2_sources:** PASS — project_items=7 expected_min=7 (ca=7 pa=0 prop=0)
- **customer_uploads_visible_on_project:** PASS — all 7 customer_assets on project hub
- **owner_badges_on_api_rows:** PASS — owners=customer
- **owner_filter_customer:** PASS — count=7
- **owner_filter_project:** PASS — count=0
- **owner_filter_proposal:** PASS — count=0

## Overall
**PASS**
