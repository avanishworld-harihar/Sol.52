-- ============================================================
-- Migration 036: Phase 3A Core
-- Sol.52 — Solar EPC Project Management
-- ============================================================
-- Creates:
--   1. installer_profiles   — team member registry with dual role/function model
--   2. project_activity_log — unified project timeline (replaces project_stage_history)
-- Extends:
--   3. projects             — 25 new Phase 3 operational columns
--
-- Multi-tenant: all new tables/columns include organization_id.
-- RLS: service_role full-access policies (Phase 3). JWT-scoped policies added Phase 5.
-- Backward compat: no existing columns modified or dropped.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. installer_profiles
-- ════════════════════════════════════════════════════════════
-- Team members of an installer organization.
-- role     = permission level (what you can do)
-- job_function = operational function (what your job is)
-- user_id is nullable — field technicians may not have Supabase auth accounts in Phase 3.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.installer_profiles (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL
                                 REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id          uuid        NULL
                                 REFERENCES auth.users (id) ON DELETE SET NULL,
  display_name     text        NOT NULL,
  role             text        NOT NULL DEFAULT 'technician'
                                 CHECK (role IN ('owner', 'admin', 'manager', 'technician')),
  job_function     text        NOT NULL DEFAULT 'technician'
                                 CHECK (job_function IN (
                                   'owner', 'project_manager', 'admin_staff',
                                   'surveyor', 'designer', 'electrician',
                                   'technician', 'contractor', 'other'
                                 )),
  phone            text,
  email            text,
  avatar_url       text,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS installer_profiles_org_idx
  ON public.installer_profiles (organization_id);

CREATE INDEX IF NOT EXISTS installer_profiles_org_role_idx
  ON public.installer_profiles (organization_id, role);

CREATE INDEX IF NOT EXISTS installer_profiles_org_func_idx
  ON public.installer_profiles (organization_id, job_function);

CREATE INDEX IF NOT EXISTS installer_profiles_user_id_idx
  ON public.installer_profiles (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS installer_profiles_active_idx
  ON public.installer_profiles (organization_id, is_active)
  WHERE is_active = true;

COMMENT ON TABLE  public.installer_profiles IS
  'Sol.52 team member registry per installer org. role = permission scope; job_function = operational assignment label.';
COMMENT ON COLUMN public.installer_profiles.role IS
  'Permission role: owner | admin | manager | technician. Determines what actions the user may perform.';
COMMENT ON COLUMN public.installer_profiles.job_function IS
  'Operational job function for assignment and reporting. Independent of permission role.';
COMMENT ON COLUMN public.installer_profiles.user_id IS
  'Optional FK to auth.users. Field technicians may operate without a Supabase auth account in Phase 3.';

ALTER TABLE public.installer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_installer_profiles"
  ON public.installer_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- 2. project_activity_log
-- ════════════════════════════════════════════════════════════
-- Unified chronological timeline for all project lifecycle events.
-- Replaces the narrower project_stage_history concept from v1.1.
-- Stage transitions are stored here as event_type = 'stage_changed'
-- with metadata_json = { "from_stage": "...", "to_stage": "..." }.
--
-- event_type is NOT CHECK-constrained to allow future event types
-- without schema migrations. Valid values are documented below.
-- ────────────────────────────────────────────────────────────
-- Valid event_type values (enforced at application layer):
--   project_created | stage_changed | survey_submitted |
--   design_created  | design_revised | task_completed  |
--   installation_substage_done | document_uploaded     |
--   payment_recorded | subsidy_status_changed           |
--   nm_substatus_changed | comment_added | team_assigned |
--   project_completed | project_archived | custom
-- ────────────────────────────────────────────────────────────
-- metadata_json structure per event_type:
--   stage_changed            → { from_stage, to_stage, from_status, to_status }
--   design_created/revised   → { version_number, version_label, design_id }
--   payment_recorded         → { milestone_name, amount_inr, payment_mode, transaction_reference }
--   document_uploaded        → { doc_category, doc_name, stage }
--   installation_substage_done → { substage, substage_label }
--   subsidy_status_changed   → { from_status, to_status, scheme }
--   nm_substatus_changed     → { from_substatus, to_substatus }
--   task_completed           → { task_title, stage }
--   team_assigned            → { role_type, assignee_name }
--   survey_submitted         → { survey_date, surveyed_by }
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_activity_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL
                                  REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id        uuid        NOT NULL
                                  REFERENCES public.projects (id) ON DELETE CASCADE,
  event_type        text        NOT NULL,
  event_title       text        NOT NULL,
  event_description text,
  metadata_json     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_by_id     uuid        NULL
                                  REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_activity_log_project_time_idx
  ON public.project_activity_log (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS project_activity_log_org_time_idx
  ON public.project_activity_log (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS project_activity_log_event_type_idx
  ON public.project_activity_log (organization_id, event_type, created_at DESC);

COMMENT ON TABLE  public.project_activity_log IS
  'Unified project lifecycle timeline. All events logged here. Replaces project_stage_history. event_type not CHECK-constrained — validated at app layer.';
COMMENT ON COLUMN public.project_activity_log.metadata_json IS
  'Structured payload per event_type. See migration comment for per-type structure.';
COMMENT ON COLUMN public.project_activity_log.event_type IS
  'Not CHECK-constrained. Valid values: project_created|stage_changed|survey_submitted|design_created|design_revised|task_completed|installation_substage_done|document_uploaded|payment_recorded|subsidy_status_changed|nm_substatus_changed|comment_added|team_assigned|project_completed|project_archived|custom';

ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_project_activity_log"
  ON public.project_activity_log
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- 3. Extend projects table — Phase 3 operational columns
-- ════════════════════════════════════════════════════════════
-- All columns are additive. No existing columns modified.
-- Legacy columns (status, install_progress, next_action) kept for
-- backward compatibility with existing dashboard and API routes.
-- ────────────────────────────────────────────────────────────

-- ── Stage tracking (replaces inferred heuristics) ────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS current_stage  text NOT NULL DEFAULT 'survey'
    CHECK (current_stage IN (
      'survey', 'design', 'approval', 'installation',
      'net_metering', 'completed'
    ));

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stage_status   text NOT NULL DEFAULT 'not_started'
    CHECK (stage_status IN ('not_started', 'in_progress', 'blocked', 'done'));

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS nm_substatus   text NOT NULL DEFAULT 'not_started'
    CHECK (nm_substatus IN (
      'not_started', 'application_filed', 'documents_submitted',
      'inspection_pending', 'meter_installed', 'export_enabled'
    ));

-- ── Project identity ─────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_code      text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date        date;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS target_completion date;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS actual_completion date;

-- Partial unique index: project_code must be unique when set, but NULLs are allowed
CREATE UNIQUE INDEX IF NOT EXISTS projects_project_code_unique_idx
  ON public.projects (project_code)
  WHERE project_code IS NOT NULL;

-- ── Team assignment ──────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS assigned_manager_id uuid NULL
    REFERENCES public.installer_profiles (id) ON DELETE SET NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS assigned_tech_id    uuid NULL
    REFERENCES public.installer_profiles (id) ON DELETE SET NULL;

-- ── Site basics ──────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS site_address text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS site_lat     numeric(10, 7);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS site_lng     numeric(10, 7);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS roof_type    text
    CHECK (roof_type IN ('rcc', 'tin', 'metal', 'asbestos', 'terrace', 'ground', 'other')
           OR roof_type IS NULL);

-- ── System specification ─────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS system_type    text
    CHECK (system_type IN ('on_grid', 'off_grid', 'hybrid') OR system_type IS NULL);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS panel_brand    text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS inverter_brand text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS panel_count    integer;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS structure_type text
    CHECK (structure_type IN ('elevated', 'flush', 'ground_mount', 'other')
           OR structure_type IS NULL);

-- ── Financial ────────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS contract_amount_inr  numeric;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS amount_received_inr  numeric NOT NULL DEFAULT 0;

-- ── Net metering tracking ────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS discom_application_no text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS nm_application_date   date;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS meter_serial_no       text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS nm_activation_date    date;

-- ── Subsidy pointer ──────────────────────────────────────────
-- Detail lives in project_subsidies (migration 042). This is a fast-query flag.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS has_subsidy boolean NOT NULL DEFAULT false;

-- ── New indexes for projects ─────────────────────────────────
CREATE INDEX IF NOT EXISTS projects_current_stage_idx
  ON public.projects (organization_id, current_stage)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_stage_status_idx
  ON public.projects (organization_id, stage_status)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_target_completion_idx
  ON public.projects (organization_id, target_completion)
  WHERE archived_at IS NULL AND actual_completion IS NULL;

CREATE INDEX IF NOT EXISTS projects_assigned_manager_idx
  ON public.projects (assigned_manager_id)
  WHERE assigned_manager_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS projects_assigned_tech_idx
  ON public.projects (assigned_tech_id)
  WHERE assigned_tech_id IS NOT NULL;

-- ── Column comments ──────────────────────────────────────────
COMMENT ON COLUMN public.projects.current_stage IS
  'Phase 3 explicit stage: survey|design|approval|installation|net_metering|completed. Replaces inferred stage heuristics.';
COMMENT ON COLUMN public.projects.stage_status IS
  'Current stage execution status: not_started|in_progress|blocked|done.';
COMMENT ON COLUMN public.projects.nm_substatus IS
  'Net metering sub-status (active when current_stage = net_metering): not_started→application_filed→documents_submitted→inspection_pending→meter_installed→export_enabled.';
COMMENT ON COLUMN public.projects.project_code IS
  'Human-readable project ID, e.g. SOL-2026-0042. Generated by application. UNIQUE when set (NULLs allowed).';
COMMENT ON COLUMN public.projects.assigned_manager_id IS
  'FK to installer_profiles. Project manager responsible for this project.';
COMMENT ON COLUMN public.projects.assigned_tech_id IS
  'FK to installer_profiles. Primary field technician assigned to this project.';
COMMENT ON COLUMN public.projects.contract_amount_inr IS
  'Total signed contract value. Used for financial summary and pipeline value metrics.';
COMMENT ON COLUMN public.projects.amount_received_inr IS
  'Running total of payments received. Denormalized for fast query; source of truth is project_payment_milestones.';
COMMENT ON COLUMN public.projects.has_subsidy IS
  'Quick filter flag. Subsidy detail stored in project_subsidies (migration 042).';
