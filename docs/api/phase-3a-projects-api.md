# Phase 3A — Projects API Reference

**Status:** Frozen (implemented)  
**Last updated:** 1 June 2026  
**Base path:** `/api/projects`  
**Parent doc:** [Complete Architecture](../architecture/phase-3a-complete-architecture.md)

---

## 1. Conventions

### 1.1 Response envelope

All endpoints return JSON with a consistent envelope:

**Success:**
```json
{
  "ok": true,
  "data": { }
}
```

**Error:**
```json
{
  "ok": false,
  "error": "error_code_or_message"
}
```

HTTP status codes: `200` success, `400` validation/business error, `404` not found, `500` server error, `503` database unavailable.

All responses include `Cache-Control: no-store`.

### 1.2 Authentication (Phase 3)

Phase 3 routes use Supabase service role or anon client server-side. Organization scope is resolved via `resolveDefaultOrgId()` in `lib/project-store.ts`. JWT-scoped auth is planned for Phase 5.

### 1.3 Client library

Typed fetch wrappers and SWR cache keys: **`lib/project-api-client.ts`**

Cache revalidation after mutations: **`lib/project-hub-cache.ts`**

---

## 2. Project list & dashboard

### GET `/api/projects/list`

Paginated project list with health enrichment and lead/manager joins.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `view` | string | `active` | `active` \| `hidden` \| `archived` |
| `stage` | string | — | Filter by `current_stage` (must be valid stage ID) |
| `limit` | number | `100` | Max 200 |
| `offset` | number | `0` | Pagination offset |

**Side effects:** Calls `syncWonLeadProjects()` to auto-create projects from won leads.

**Response `data`:** `ProjectListItem[]`

```typescript
interface ProjectListItem {
  id: string;
  lead_id: string | null;
  organization_id: string | null;
  official_name: string | null;
  current_stage: string;
  stage_status: string;
  nm_substatus: string;
  project_code: string | null;
  start_date: string | null;
  target_completion: string | null;
  actual_completion: string | null;
  assigned_manager_id: string | null;
  assigned_tech_id: string | null;
  site_address: string | null;
  roof_type: string | null;
  system_type: string | null;
  panel_brand: string | null;
  inverter_brand: string | null;
  panel_count: number | null;
  structure_type: string | null;
  contract_amount_inr: number | null;
  amount_received_inr: number;
  has_subsidy: boolean;
  lead_name: string | null;
  lead_phone: string | null;
  lead_city: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  tech_name: string | null;
  tech_phone: string | null;
  health: "on_track" | "attention_needed" | "delayed" | "blocked";
  status: string | null;
  install_progress: number;
  detail: string | null;
  capacity_kw: string | null;
  next_action: string | null;
  dashboard_visible: boolean;
  archived_at: string | null;
  updated_at: string;
  created_at: string;
}
```

**Errors:** `500` — `{ ok: false, error: "list_failed", data: [] }`

**SWR key:** `projectListKey({ stage?, view? })` → `/api/projects/list?...`

---

### GET `/api/projects/dashboard-stats`

Operations dashboard aggregates for the current organization.

**Response `data`:**

```typescript
interface ProjectDashboardStats {
  total_projects: number;
  stage_counts: Record<string, number>;
  health_counts: Record<string, number>;
  total_pipeline_value_inr: number;
  total_received_inr: number;
  total_pending_inr: number;
  today_installations: number;
  nm_pending: number;
  approval_pending: number;
}
```

**Errors:** `503` — `db_unavailable`; `500` — `dashboard_stats_failed`

**SWR key:** `PROJECT_DASHBOARD_STATS_KEY` → `/api/projects/dashboard-stats`

---

## 3. Project CRUD

### POST `/api/projects`

Create a new Phase 3 project with default stage `survey`, status `in_progress`.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lead_id` | uuid | No | Link to CRM lead |
| `official_name` | string | No | Bill / display name (max 300) |
| `capacity_kw` | string | No | System capacity label |
| `detail` | string | No | Short site/detail note |
| `project_code` | string | No | Human-readable code |
| `start_date` | date | No | ISO date |
| `target_completion` | date | No | ISO date |
| `assigned_manager_id` | uuid | No | FK installer_profiles |
| `assigned_tech_id` | uuid | No | FK installer_profiles |
| `contract_amount_inr` | number | No | Contract value |
| `site_address` | string | No | Site address |

**Side effects:**
- Inserts project with Phase 3 defaults
- Seeds survey-stage task templates
- Logs `project_created` activity event

**Response `data`:** Created project row.

**Errors:** `400` validation, `503` db_unavailable

---

### GET `/api/projects/[id]`

Full project detail with lead/manager/tech joins and computed `health`.

**Path parameters:** `id` — project UUID

**Response `data`:** `ProjectListItem` (same shape as list item)

**Errors:**
- `400` — `missing_id`
- `404` — `project_not_found`
- `500` — `get_failed`

**SWR key:** `projectDetailKey(id)` → `/api/projects/{id}`

---

### PATCH `/api/projects/[id]`

Update project fields. Only defined fields are applied.

**Request body (all optional):**

| Field | Type | Notes |
|-------|------|-------|
| `stage_status` | enum | `not_started` \| `in_progress` \| `blocked` \| `done` |
| `nm_substatus` | enum | 6 NM workflow values |
| `project_code` | string \| null | Max 40 |
| `start_date` | date \| null | |
| `target_completion` | date \| null | |
| `actual_completion` | date \| null | |
| `assigned_manager_id` | uuid \| null | |
| `assigned_tech_id` | uuid \| null | |
| `site_address` | string \| null | Max 500 |
| `site_lat` | number \| null | -90 to 90 |
| `site_lng` | number \| null | -180 to 180 |
| `roof_type` | enum \| null | rcc, tin, metal, asbestos, terrace, ground, other |
| `system_type` | enum \| null | on_grid, off_grid, hybrid |
| `panel_brand` | string \| null | |
| `inverter_brand` | string \| null | |
| `panel_count` | integer \| null | Positive |
| `structure_type` | enum \| null | elevated, flush, ground_mount, other |
| `contract_amount_inr` | number \| null | Non-negative |
| `amount_received_inr` | number | Non-negative |
| `discom_application_no` | string \| null | |
| `nm_application_date` | date \| null | |
| `meter_serial_no` | string \| null | |
| `nm_activation_date` | date \| null | |
| `has_subsidy` | boolean | |
| `official_name` | string \| null | Legacy |
| `capacity_kw` | string \| null | Legacy |
| `detail` | string \| null | Legacy |
| `next_action` | string \| null | Legacy |
| `install_progress` | integer | 0–100 |
| `dashboard_visible` | boolean | Hide from dashboard |
| `archived_at` | ISO datetime \| null \| `true` | Pass `true` to archive now |
| `created_by_id` | uuid \| null | Activity logging context |

**Side effects:**
- `nm_substatus` change → logs `nm_substatus_changed`
- `archived_at` set → logs `project_archived`

**Response `data`:** Updated project row.

**Errors:** `400` validation / no fields, `404` not found

---

## 4. Stage management

### POST `/api/projects/[id]/advance-stage`

Advance project to the next stage in the 6-stage sequence.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `created_by_id` | uuid \| null | No |

**Behavior:**
1. Validates current stage is not `completed`
2. Sets `current_stage` to next stage, `stage_status = in_progress`
3. Auto-stamps `actual_completion` when advancing to `completed`
4. Seeds task templates for new stage
5. Logs `stage_changed` activity event

**Response `data`:** Updated project row.

**Errors:**
- `400` — `project_already_completed`, `invalid_current_stage`
- `404` — `project_not_found`

**Stage sequence:** survey → design → approval → installation → net_metering → completed

---

## 5. Site survey

### GET `/api/projects/[id]/survey`

Returns survey row or `null` if not yet created.

**Response `data`:** `ProjectSurvey | null`

**SWR key:** `projectSurveyKey(id)`

---

### POST `/api/projects/[id]/survey`

Create survey (one per project — UNIQUE on `project_id`).

**Request body:** All survey fields optional except enforced by Zod. See `ProjectSurvey` type in `lib/project-api-client.ts` for full field list.

Key groups: site info, electrical info, solar inputs, special conditions.

**Side effects:** Logs `survey_submitted`

**Errors:** `409` or `400` if survey already exists

---

### PATCH `/api/projects/[id]/survey`

Update existing survey in-place.

**Request body:** Same fields as POST (partial update).

**Side effects:** Logs `survey_submitted`

**Errors:** `404` if no survey exists

---

## 6. Design versions

### GET `/api/projects/[id]/designs`

All design versions for project, **newest first**.

**Response `data`:** `ProjectDesign[]`

**SWR key:** `projectDesignsKey(id)`

---

### POST `/api/projects/[id]/designs`

Create new design version (append-only).

**Request body:**

| Field | Type | Description |
|-------|------|-------------|
| `version_label` | string | e.g. "V2 – Post-survey revision" |
| `revision_notes` | string | Change description |
| `system_kw` | number | System capacity |
| `panel_count` | integer | Panel count |
| `panel_watt` | integer | Per-panel wattage |
| `panel_model` | string | |
| `inverter_kw` | number | |
| `inverter_model` | string | |
| `structure_type` | enum | elevated, flush, ground_mount, other |
| `string_count` | integer | |
| `modules_per_string` | integer | |
| `annual_yield_kwh` | number | |
| `performance_ratio` | number | 0.0–1.0 |
| `created_by_id` | uuid | Activity logging |

**Behavior:**
- Auto-increments `version_number`
- Sets previous rows `is_current = false`
- Inserts new row with `is_current = true`
- Logs `design_created`

**Response `data`:** New `ProjectDesign` row.

---

## 7. Tasks

### GET `/api/projects/[id]/tasks`

List tasks for project.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `stage` | string | Filter by stage or `general` |

**Response `data`:** `ProjectTask[]`

**SWR key:** `projectTasksKey(id, stage?)`

---

### POST `/api/projects/[id]/tasks`

Create custom (non-template) task.

**Request body:**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `stage` | enum | Yes | survey, design, approval, installation, net_metering, completed, general |
| `title` | string | Yes | Max 300 |
| `description` | string | No | |
| `is_blocking` | boolean | No | false |
| `assigned_to_id` | uuid | No | |
| `due_date` | date | No | |
| `sort_order` | integer | No | 0 |

**Response `data`:** Created `ProjectTask`.

---

### PATCH `/api/projects/[id]/tasks/[taskId]`

Update task fields.

**Request body (partial):**

| Field | Type | Notes |
|-------|------|-------|
| `status` | enum | pending, in_progress, done, skipped, na |
| `assigned_to_id` | uuid \| null | |
| `due_date` | date \| null | |
| `title` | string | |
| `description` | string \| null | |
| `is_blocking` | boolean | |
| `sort_order` | integer | |
| `completed_by_id` | uuid | Logging context |

**Side effects:** When `status → done`, stamps `completed_at` and logs `task_completed`.

**Response `data`:** Updated `ProjectTask`.

**Errors:** `404` task not found

---

## 8. Activity timeline

### GET `/api/projects/[id]/activity`

Chronological activity log, **newest first**.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Max 100 |
| `before` | ISO timestamp | — | Cursor for pagination (events older than this) |

**Response `data`:** `ProjectActivityEvent[]`

```typescript
interface ProjectActivityEvent {
  id: string;
  project_id: string;
  event_type: string;
  event_title: string;
  event_description: string | null;
  metadata_json: Record<string, unknown>;
  created_by_id: string | null;
  created_at: string;
}
```

**SWR key:** `projectActivityKey(id, { limit, before })`

**Pagination:** Pass `created_at` of last item as `before` for next page.

---

## 9. Comments

### GET `/api/projects/[id]/comments`

All comments for project. Server returns flat list; client builds threads.

**Response `data`:** `ProjectComment[]`

**SWR key:** `projectCommentsKey(id)`

---

### POST `/api/projects/[id]/comments`

Add comment or reply.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `comment` | string | Yes (1–5000 chars) |
| `parent_comment_id` | uuid | No (for replies) |
| `created_by_id` | uuid | No |

**Side effects:** Logs `comment_added`

**Response `data`:** Created `ProjectComment`.

---

### PATCH `/api/projects/[id]/comments/[commentId]`

Pin or unpin a comment.

**Request body:**

```json
{ "is_pinned": true }
```

**Response `data`:** Updated `ProjectComment`.

**Errors:** `404` comment_not_found

---

## 10. Notifications

### GET `/api/notifications/unread-count`

Org-level unread notification count (Phase 3 — no recipient filtering).

**Response `data`:**

```json
{ "count": 0 }
```

**SWR key:** `NOTIFICATIONS_UNREAD_KEY`

**Note:** Returns `{ count: 0 }` gracefully if table empty or DB unavailable.

---

## 11. Legacy API (backward compatibility)

These routes are **not** under `/api/projects` but remain active:

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/pipeline` | Legacy project list |
| POST | `/api/pipeline` | Create project from lead |
| PATCH | `/api/pipeline/[id]` | Edit project (list modal) |
| DELETE | `/api/pipeline/[id]` | Delete project (list modal) |

Phase 3 Hub uses `/api/projects/*` exclusively. List edit/delete modal continues to use pipeline routes.

---

## 12. Error code reference

| Code | HTTP | Meaning |
|------|------|---------|
| `missing_id` | 400 | Path param missing |
| `project_not_found` | 404 | Project does not exist |
| `project_not_found_or_no_org` | 404 | Project or org missing |
| `project_already_completed` | 400 | Cannot advance past completed |
| `invalid_current_stage` | 400 | Stage value not recognized |
| `comment_not_found` | 404 | Comment ID invalid for project |
| `db_unavailable` | 503 | Supabase client null |
| `network_error` | — | Client-side fetch failure |
| Zod validation messages | 400 | Field-level validation |

---

## 13. SWR cache invalidation map

After hub mutations, `revalidateProjectHubCaches(projectId)` invalidates:

| Key pattern | Trigger |
|-------------|---------|
| `/api/projects/{id}` | Always |
| `/api/projects/{id}/survey` | Stage/survey mutations |
| `/api/projects/{id}/designs` | Design create |
| `/api/projects/{id}/comments` | Comment post/pin |
| `/api/projects/{id}/activity*` | Any logged activity |
| `/api/projects/{id}/tasks*` | Task update, stage advance |
| `/api/projects/list?*` | All list views (active, hidden, archived) |
| `/api/projects/dashboard-stats` | Dashboard aggregates |

---

## 14. Hub UI → API mapping

| Hub tab / action | API calls |
|------------------|-----------|
| Page load | `GET /api/projects/[id]` |
| Overview | Uses root project data only |
| Survey tab | `GET .../survey` |
| Design tab | `GET .../designs` |
| Tasks tab | `GET .../tasks`, `PATCH .../tasks/[taskId]` |
| Timeline tab | `GET .../activity?limit=30&before=` |
| Comments tab | `GET/POST .../comments`, `PATCH .../comments/[id]` |
| Stage status change | `PATCH /api/projects/[id]` |
| NM sub-status change | `PATCH /api/projects/[id]` |
| Advance stage | `POST .../advance-stage` (+ tasks fetch in sheet) |

---

## 15. Example requests

### Advance stage

```http
POST /api/projects/3cfd6369-4d9a-45d3-8c90-008de6c62a46/advance-stage
Content-Type: application/json

{ "created_by_id": null }
```

### Complete a task

```http
PATCH /api/projects/{id}/tasks/{taskId}
Content-Type: application/json

{ "status": "done" }
```

### Paginated activity

```http
GET /api/projects/{id}/activity?limit=30&before=2026-06-01T04:00:00.000Z
```

### List with filters

```http
GET /api/projects/list?view=active&stage=survey&limit=50&offset=0
```
