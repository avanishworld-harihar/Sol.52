# Phase 3A — Database Entity-Relationship Diagram

**Status:** Frozen (migrations 036–045 deployed)  
**Last updated:** 1 June 2026  
**Parent doc:** [Complete Architecture](./phase-3a-complete-architecture.md)

---

## 1. Overview

Phase 3A extends the legacy `projects` pipeline table with operational columns and adds seven new tables for surveys, designs, tasks, activity, comments, team profiles, and notifications.

All new tables include `organization_id` for multi-tenant isolation. Foreign keys to `installer_profiles` use `ON DELETE SET NULL` to preserve audit history.

---

## 2. Full ERD (Phase 3A scope)

```mermaid
erDiagram
  organizations ||--o{ projects : "owns"
  organizations ||--o{ installer_profiles : "employs"
  organizations ||--o{ project_activity_log : "scopes"
  organizations ||--o{ project_site_surveys : "scopes"
  organizations ||--o{ project_designs : "scopes"
  organizations ||--o{ project_tasks : "scopes"
  organizations ||--o{ project_comments : "scopes"
  organizations ||--o{ notifications : "scopes"

  leads ||--o| projects : "may link (lead_id)"
  leads ||--o{ proposals : "has"

  projects ||--o| project_site_surveys : "1:1 survey"
  projects ||--o{ project_designs : "1:N versions"
  projects ||--o{ project_tasks : "1:N tasks"
  projects ||--o{ project_activity_log : "1:N events"
  projects ||--o{ project_comments : "1:N comments"

  installer_profiles ||--o{ projects : "assigned_manager"
  installer_profiles ||--o{ projects : "assigned_tech"
  installer_profiles ||--o{ project_site_surveys : "surveyed_by"
  installer_profiles ||--o{ project_designs : "created_by"
  installer_profiles ||--o{ project_tasks : "assigned_to"
  installer_profiles ||--o{ project_tasks : "completed_by"
  installer_profiles ||--o{ project_activity_log : "created_by"
  installer_profiles ||--o{ project_comments : "created_by"
  installer_profiles ||--o{ notifications : "recipient"

  project_comments ||--o{ project_comments : "parent_comment_id"

  auth_users ||--o| installer_profiles : "optional user_id"

  organizations {
    uuid id PK
    text name
    timestamptz created_at
  }

  leads {
    uuid id PK
    uuid organization_id FK
    text name
    text phone
    text city
    text status
    timestamptz created_at
  }

  projects {
    uuid id PK
    uuid organization_id FK
    uuid lead_id FK "nullable, SET NULL"
    text official_name
    text customer_name "legacy/adaptive"
    text capacity_kw "legacy"
    text detail "legacy"
    text status "legacy default pending"
    int install_progress "legacy 0-100"
    text next_action "legacy"
    boolean dashboard_visible
    timestamptz archived_at
    text current_stage "survey|design|approval|installation|net_metering|completed"
    text stage_status "not_started|in_progress|blocked|done"
    text nm_substatus
    text project_code "unique when set"
    date start_date
    date target_completion
    date actual_completion
    uuid assigned_manager_id FK
    uuid assigned_tech_id FK
    text site_address
    numeric site_lat
    numeric site_lng
    text roof_type
    text system_type
    text panel_brand
    text inverter_brand
    int panel_count
    text structure_type
    numeric contract_amount_inr
    numeric amount_received_inr
    text discom_application_no
    date nm_application_date
    text meter_serial_no
    date nm_activation_date
    boolean has_subsidy
    jsonb bom_overrides "legacy"
    timestamptz created_at
    timestamptz updated_at
  }

  installer_profiles {
    uuid id PK
    uuid organization_id FK
    uuid user_id FK "nullable auth.users"
    text display_name
    text role "owner|admin|manager|technician"
    text job_function "surveyor|designer|electrician|..."
    text phone
    text email
    text avatar_url
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
  }

  project_site_surveys {
    uuid id PK
    uuid organization_id FK
    uuid project_id FK "UNIQUE"
    uuid surveyed_by_id FK
    date survey_date
    text site_address
    numeric gps_lat
    numeric gps_lng
    text roof_type
    numeric roof_area_sqft
    numeric shadow_free_sqft
    numeric roof_height_ft
    text roof_condition
    text roof_orientation
    text consumer_number
    numeric sanction_load_kw
    numeric connected_load_kw
    text meter_type
    numeric transformer_distance_m
    text meter_location
    text db_location
    boolean existing_earthing
    numeric available_area_sqft
    numeric proposed_capacity_kw
    text shadow_analysis_note
    numeric annual_irradiation
    boolean has_dg
    numeric dg_kva
    boolean battery_required
    numeric battery_capacity_kwh
    boolean existing_inverter
    numeric existing_inverter_kw
    text project_category
    int structure_floor
    text special_notes
    timestamptz created_at
    timestamptz updated_at
  }

  project_designs {
    uuid id PK
    uuid organization_id FK
    uuid project_id FK
    int version_number "UNIQUE per project"
    text version_label
    boolean is_current "one true per project"
    uuid created_by_id FK
    text revision_notes
    numeric system_kw
    int panel_count
    int panel_watt
    text panel_model
    numeric inverter_kw
    text inverter_model
    text structure_type
    int string_count
    int modules_per_string
    numeric annual_yield_kwh
    numeric performance_ratio
    timestamptz created_at
  }

  project_tasks {
    uuid id PK
    uuid organization_id FK
    uuid project_id FK
    text stage
    text title
    text description
    boolean is_blocking
    text status "pending|in_progress|done|skipped|na"
    uuid assigned_to_id FK
    date due_date
    timestamptz completed_at
    uuid completed_by_id FK
    int sort_order
    boolean is_template
    timestamptz created_at
    timestamptz updated_at
  }

  project_activity_log {
    uuid id PK
    uuid organization_id FK
    uuid project_id FK
    text event_type
    text event_title
    text event_description
    jsonb metadata_json
    uuid created_by_id FK
    timestamptz created_at
  }

  project_comments {
    uuid id PK
    uuid organization_id FK
    uuid project_id FK
    text comment
    uuid parent_comment_id FK "self-ref, nullable"
    boolean is_pinned
    uuid created_by_id FK
    timestamptz created_at
    timestamptz updated_at
  }

  notifications {
    uuid id PK
    uuid organization_id FK
    uuid recipient_id FK "nullable = broadcast"
    text notification_type
    text title
    text message
    boolean is_read
    timestamptz read_at
    text related_entity_type
    uuid related_entity_id
    text action_url
    timestamptz created_at
  }
```

---

## 3. Relationship summary

| From | To | Cardinality | On delete |
|------|-----|-------------|-----------|
| `projects` | `organizations` | N:1 | CASCADE (via org) |
| `projects` | `leads` | N:0..1 | SET NULL |
| `projects` | `installer_profiles` (manager) | N:0..1 | SET NULL |
| `projects` | `installer_profiles` (tech) | N:0..1 | SET NULL |
| `project_site_surveys` | `projects` | 1:1 | CASCADE |
| `project_designs` | `projects` | N:1 | CASCADE |
| `project_tasks` | `projects` | N:1 | CASCADE |
| `project_activity_log` | `projects` | N:1 | CASCADE |
| `project_comments` | `projects` | N:1 | CASCADE |
| `project_comments` | `project_comments` | N:0..1 (thread) | SET NULL |
| `notifications` | `installer_profiles` | N:0..1 | SET NULL |

---

## 4. Key constraints & invariants

### 4.1 Projects

| Constraint | Detail |
|------------|--------|
| `projects_lead_id_key` | Unique index on `lead_id` (one project per lead when linked) |
| `projects_project_code_unique_idx` | Partial unique on `project_code WHERE NOT NULL` |
| Stage CHECK | `current_stage IN (survey, design, approval, installation, net_metering, completed)` |
| Status CHECK | `stage_status IN (not_started, in_progress, blocked, done)` |
| NM CHECK | `nm_substatus IN (6 values)` |

### 4.2 Surveys

| Constraint | Detail |
|------------|--------|
| `project_id UNIQUE` | Exactly one survey row per project |

### 4.3 Designs

| Constraint | Detail |
|------------|--------|
| `(project_id, version_number) UNIQUE` | Monotonic versioning |
| Partial unique on `(project_id) WHERE is_current` | At most one current version |

**Application transaction for new version:**
```sql
BEGIN;
UPDATE project_designs SET is_current = false WHERE project_id = ? AND is_current = true;
INSERT INTO project_designs (..., is_current = true) VALUES (...);
COMMIT;
```

### 4.4 Tasks

| Constraint | Detail |
|------------|--------|
| Stage CHECK | Includes `general` in addition to project stages |
| Status CHECK | `pending | in_progress | done | skipped | na` |

### 4.5 Notifications

| Constraint | Detail |
|------------|--------|
| `notifications_entity_pair_check` | `related_entity_type` and `related_entity_id` both NULL or both set |
| Type CHECK | 11 notification types |

---

## 5. Indexes (performance-critical)

| Index | Table | Purpose |
|-------|-------|---------|
| `projects_current_stage_idx` | projects | List filter by stage (active only) |
| `projects_dashboard_visible_idx` | projects | Active dashboard view |
| `project_activity_log_project_time_idx` | activity | Timeline DESC |
| `project_tasks_project_stage_idx` | tasks | Stage-filtered task list |
| `project_designs_one_current_per_project_idx` | designs | Current version lookup |
| `project_comments_project_time_idx` | comments | Comment feed |
| `notifications_recipient_unread_idx` | notifications | Unread badge |

---

## 6. Activity event types

`project_activity_log.event_type` is **not** CHECK-constrained (extensible without migration).

| event_type | metadata_json keys |
|------------|-------------------|
| `project_created` | — |
| `stage_changed` | `from_stage`, `to_stage`, `from_status`, `to_status` |
| `nm_substatus_changed` | `from_substatus`, `to_substatus` |
| `survey_submitted` | `survey_date`, `surveyed_by` |
| `design_created` / `design_revised` | `version_number`, `version_label`, `design_id` |
| `task_completed` | `task_title`, `stage` |
| `comment_added` | — |
| `project_archived` | — |
| `payment_recorded` | `milestone_name`, `amount_inr`, ... (future) |
| `document_uploaded` | `doc_category`, `doc_name`, `stage` (future) |
| `team_assigned` | `role_type`, `assignee_name` (future) |

---

## 7. Planned tables (future — not in database yet)

These are referenced in migration comments and architecture placeholders:

```mermaid
erDiagram
  projects ||--o{ project_documents : "future"
  projects ||--o{ project_payment_milestones : "future"
  projects ||--o| project_subsidies : "future"

  project_documents {
    uuid id PK
    uuid project_id FK
    text doc_category "roof_photo|sld|bill|..."
    text storage_path
    text filename
  }

  project_payment_milestones {
    uuid id PK
    uuid project_id FK
    text milestone_name
    numeric amount_inr
    date due_date
    timestamptz paid_at
  }

  project_subsidies {
    uuid id PK
    uuid project_id FK
    text scheme
    text status "applied|approved|disbursed"
    numeric amount_inr
  }
```

---

## 8. RLS policy summary (Phase 3)

All Phase 3A tables use **service-role full access** policies (`USING (true) WITH CHECK (true)`). This supports the current anon/service-key API pattern.

**Phase 5 plan:** Replace with JWT-scoped policies filtering by `organization_id` and `installer_profiles.user_id`.

Legacy `projects` table retains anon read/insert/update policies from migration 004 for backward compatibility.

---

## 9. Adaptive schema notes

Some production deployments have extended legacy columns on `projects` (e.g. `customer_name NOT NULL`, `solar_kw`). The application layer in `lib/project-store.ts` uses adaptive insert/update helpers to populate both legacy and Phase 3 column names without requiring schema normalization migrations.
