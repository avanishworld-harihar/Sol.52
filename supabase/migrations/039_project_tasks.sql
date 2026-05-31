-- ============================================================
-- Migration 039: Project Tasks
-- Sol.52 — Solar EPC Project Management
-- ============================================================
-- Creates:
--   project_tasks — per-stage advisory checklists per project
--
-- Task philosophy (Phase 3):
--   - Tasks are ADVISORY, not blocking gates.
--   - Stage advance shows warning if blocking tasks are incomplete
--     but does NOT prevent progression (decided at application layer).
--   - is_blocking is stored for Phase 4 when stricter enforcement
--     may be optionally enabled per organization.
--
-- Task seeding:
--   - When a project enters a new stage, default tasks are seeded
--     by the application (is_template = true).
--   - Teams can add custom tasks (is_template = false).
--
-- stage values: survey | design | approval | installation |
--               net_metering | completed | general
--   'completed' covers handover activities.
--   'general'   for cross-stage or administrative tasks.
--
-- Multi-tenant: organization_id NOT NULL.
-- RLS: service_role full-access (Phase 3).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL
                                 REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id       uuid        NOT NULL
                                 REFERENCES public.projects (id) ON DELETE CASCADE,
  stage            text        NOT NULL
                                 CHECK (stage IN (
                                   'survey', 'design', 'approval', 'installation',
                                   'net_metering', 'completed', 'general'
                                 )),
  title            text        NOT NULL,
  description      text,
  is_blocking      boolean     NOT NULL DEFAULT false,
  status           text        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN (
                                   'pending', 'in_progress', 'done', 'skipped', 'na'
                                 )),
  assigned_to_id   uuid        NULL
                                 REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  due_date         date,
  completed_at     timestamptz,
  completed_by_id  uuid        NULL
                                 REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  sort_order       integer     NOT NULL DEFAULT 0,
  is_template      boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS project_tasks_project_stage_idx
  ON public.project_tasks (project_id, stage);

CREATE INDEX IF NOT EXISTS project_tasks_project_status_idx
  ON public.project_tasks (project_id, status)
  WHERE status IN ('pending', 'in_progress');

CREATE INDEX IF NOT EXISTS project_tasks_assigned_to_idx
  ON public.project_tasks (organization_id, assigned_to_id, status)
  WHERE assigned_to_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS project_tasks_org_stage_status_idx
  ON public.project_tasks (organization_id, stage, status);

CREATE INDEX IF NOT EXISTS project_tasks_template_idx
  ON public.project_tasks (project_id, stage, is_template);

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE  public.project_tasks IS
  'Stage-based advisory checklists per project. Tasks seeded on stage entry (is_template=true). Custom tasks added by team (is_template=false).';
COMMENT ON COLUMN public.project_tasks.stage IS
  'Stage this task belongs to. Matches project current_stage values plus general for cross-stage tasks.';
COMMENT ON COLUMN public.project_tasks.is_blocking IS
  'Advisory flag. Phase 3: stage advance shows warning if true and status != done, but does NOT block. Phase 4: may be made enforceable per org setting.';
COMMENT ON COLUMN public.project_tasks.is_template IS
  'True = system-seeded default task for the stage. False = custom task added by team member.';
COMMENT ON COLUMN public.project_tasks.status IS
  'pending: not started | in_progress: started | done: completed | skipped: intentionally skipped | na: not applicable for this project.';
COMMENT ON COLUMN public.project_tasks.sort_order IS
  'Display order within a stage. Lower numbers appear first.';

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_project_tasks"
  ON public.project_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);
