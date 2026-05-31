# Phase 3A-4 — Project Hub Architecture

**Status:** Approved with architecture notes (implementation not started)  
**Last updated:** 31 May 2026  
**Scope:** Project Hub UI on existing Phase 3A-1 APIs only  
**Frozen out of 3A-4:** Documents module, Financial module (full), Team Assignment module (full)

---

## Summary

Project Hub is the single operating screen for one project at `/projects/[id]`. It uses tabbed navigation (Overview, Survey, Design, Tasks, Timeline, Comments), reuses Phase 3A-1 APIs, and preserves backward compatibility with legacy pipeline, CRM, and proposals.

**Implementation sequence (when coding starts):** Shell + header → Overview → Stage advance → Tasks → Timeline → Survey → Design → Comments → list/dashboard deep links → mobile polish.

---

## 1. Route structure

| Route | Purpose |
|-------|---------|
| `/projects/[id]` | Project Hub (new) |
| `/projects/[id]?tab=overview\|survey\|design\|tasks\|timeline\|comments` | Tab deep links |
| `/projects` | Unchanged — list + Operations Dashboard (3A-2/3A-3) |

**Unchanged:** `/api/pipeline`, `/customers`, `/proposals`, `/`, legacy BOM route.

---

## 2. Page layout (wireframe)

**Desktop:** Sticky header (identity, stage, health, actions) → 6-step stage bar → tab bar → tab content.  
**Mobile:** Compact header, scrollable tabs, single-column content, bottom sheets for advance-stage confirm.

Pattern references: `WorkspacePage`, `WorkspaceDealClient` (proposals/workspace tabs).

---

## 3. Tab structure (3A-4 in scope)

| Tab | Data source |
|-----|-------------|
| Overview | `GET /api/projects/[id]` |
| Survey | `GET/POST/PATCH .../survey` |
| Design | `GET/POST .../designs` |
| Tasks | `GET/POST .../tasks`, `PATCH .../tasks/[taskId]` |
| Timeline | `GET .../activity` |
| Comments | `GET/POST .../comments`, `PATCH .../comments/[commentId]` |

Stage management lives in the header (not a separate tab).

---

## 4. Data flow

- Root SWR: `GET /api/projects/[id]` (always mounted).
- Per-tab lazy SWR on first visit.
- Mutations revalidate: project detail, active tab, activity (when logged server-side), list keys, dashboard stats.

---

## 5. API mapping (3A-4)

| Action | API |
|--------|-----|
| Load hub | `GET /api/projects/[id]` |
| Patch fields | `PATCH /api/projects/[id]` |
| Advance stage | `POST /api/projects/[id]/advance-stage` |
| Survey / Design / Tasks / Activity / Comments | Existing Phase 3A-1 routes |

List edit/delete modal continues to use `/api/pipeline/[id]` — Hub does not replace it.

---

## 6. Component hierarchy (3A-4)

```
ProjectHubPage → ProjectHubClient
  ├── ProjectHubHeader (+ stage bar, advance, NM sub-status, actions menu)
  ├── ProjectHubTabBar
  └── Tab panels: Overview | Survey | Design | Tasks | Timeline | Comments
```

Reuses: `ProjectStageBadge`, `ProjectHealthBadge`, design system from 3A-2/3A-3.

---

## 7–8. Mobile & desktop UX

- **Mobile:** Scroll tabs, bottom sheets, sticky save footers, lazy tab fetch.
- **Desktop:** Full tab bar, two-column survey/overview grids, design version table, timeline pagination.

---

## 9. Activity log integration

Read-only feed from `project_activity_log` via `GET .../activity` with cursor pagination (`?before=`). Mutations that log server-side trigger activity revalidation.

---

## 10–14. Workflows (3A-4)

| Workflow | Key behavior |
|----------|--------------|
| **Stage** | Forward-only via `advance-stage`; advisory blocking-task warning; PATCH for `stage_status` / `nm_substatus` |
| **Survey** | One row per project; POST create / PATCH update; logs `survey_submitted` |
| **Design** | Append-only versions; POST new version; `is_current` on latest |
| **Tasks** | Stage-filtered checklist; PATCH status; POST custom tasks; templates seeded on advance |
| **Comments** | Pinned-first list; POST with optional `parent_comment_id`; PATCH pin |

---

## 15. Risks & backward compatibility

- Preserve legacy pipeline PATCH/DELETE on list modal.
- Adaptive schema (`customer_name`, `solar_kw`) via existing server helpers.
- Hub links to CRM/proposals; does not embed BOM/pricing editors.
- Installer profile dropdown gap: v1 read-only team display from joins unless thin read API added later.
- Financial “next milestone payment” in Overview v1: contract/received/pending + target date only (see Future Financial module).

---

## 16. Future Documents module (placeholder — NOT 3A-4)

**Intent:** Central project file cabinet linked to lifecycle stages.  
**Status:** Architecture placeholder only. No UI, API, storage, or migrations in Phase 3A-4.

### Planned document categories

| Category | Typical use | Stage association |
|----------|-------------|-------------------|
| Survey photos | Roof, meter, DB, shadow shots | Survey |
| Electricity bill | Sizing / consumer verification | Survey / Design |
| Net metering documents | Application, inspection, DISCOM letters | Net Metering |
| Installation photos | Structure, cabling, inverter, signage | Installation |
| Completion & warranty files | Commissioning report, warranty cards, handover checklist | Completed |

### Future UX (not built in 3A-4)

- Optional **Documents** tab or Overview subsection with category filters.
- Upload via Supabase Storage scoped by `organization_id` + `project_id`.
- Activity log events: `document_uploaded` (metadata: category, filename, stage).
- CRM `/customers/[id]/files` may remain parallel for lead-level docs; Hub docs are project-scoped.

### 3A-4 behavior today

- Survey tab may link out to CRM files when `lead_id` exists (text link only).
- No new document upload surfaces in Hub.

---

## 17. Future Financial module (placeholder — NOT 3A-4)

**Intent:** Full commercial and cash-flow view beyond simple contract fields on `projects`.  
**Status:** Architecture placeholder only. No new tables, APIs, or Hub financial UI in Phase 3A-4.

### Planned fields / capabilities

| Capability | Description |
|------------|-------------|
| Proposal value | Authoritative amount from linked proposal/pricing |
| Advance received | Milestone-based collections (not just `amount_received_inr` rollup) |
| Outstanding balance | Computed from milestone schedule vs receipts |
| Material cost tracking | BOM / procurement actuals vs estimate |
| Installation cost tracking | Labour, contractor, overhead lines |
| Subsidy status | Workflow beyond `has_subsidy` boolean (applied / approved / disbursed) |

### Future UX (not built in 3A-4)

- **Financial** tab or expanded Overview panel with milestone timeline.
- `payment_recorded` activity events with structured metadata.
- Optional sync from `/proposals/[id]` pricing snapshots (read-only hand-off).

### 3A-4 behavior today (in scope)

Overview **Financial Summary (v1)** only:

- Project value → `contract_amount_inr`
- Received → `amount_received_inr`
- Pending → computed `contract − received`
- Next due date → `target_completion` (proxy until milestones exist)
- Subsidy → read-only `has_subsidy` flag
- Link to proposal when available via lead/proposal lookup

No material/install cost entry, no milestone CRUD, no payment recording.

---

## 18. Future Team Assignment module (placeholder — NOT 3A-4)

**Intent:** Role-based operational assignments beyond single manager/tech UUIDs on `projects`.  
**Status:** Architecture placeholder only. No new assignment UI or APIs in Phase 3A-4.

### Planned roles

| Role | Function |
|------|----------|
| Survey engineer | Site survey owner |
| Design engineer | Layout / BOQ / design versions |
| Installation manager | Site execution lead |
| Installer team | Field crew (multiple members) |

### Future UX (not built in 3A-4)

- Assignment matrix on Overview or dedicated **Team** section.
- Uses `installer_profiles` (+ optional `project_assignments` join table in a later phase).
- Notifications on assignment change (`team_assigned` activity).
- Phase 5 JWT RBAC may restrict who can assign whom.

### 3A-4 behavior today (in scope)

- Read-only display of `assigned_manager_id` / `assigned_tech_id` joined names on Overview.
- PATCH may set manager/tech UUIDs if operator has IDs (no profile picker until profiles read API exists).
- Survey `surveyed_by_id` set via survey form when UUID known.

No survey/design/install role matrix, no crew list, no assignment notifications.

---

## Scope boundary sign-off

| Item | 3A-4 |
|------|------|
| Hub route + 6 tabs (Overview, Survey, Design, Tasks, Timeline, Comments) | ✅ In scope |
| Stage advance + NM sub-status + activity integration | ✅ In scope |
| Documents module (§16) | ❌ Placeholder only |
| Financial module full (§17) | ❌ Placeholder only — v1 summary fields only |
| Team Assignment module (§18) | ❌ Placeholder only — read-only manager/tech |
| Database migrations | ❌ None |
| Notifications center UI | ❌ Later phase |
| Kanban / list replacement | ❌ Out of scope |

---

## Final sign-off

**Phase 3A-4 architecture is approved** including future-module placeholders (Documents, Financial, Team Assignment) documented in §16–§18. Those modules are explicitly deferred and must not expand 3A-4 implementation scope.

**Next step:** Begin coding only after explicit implementation kickoff. No code or migrations until then.
