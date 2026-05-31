-- ============================================================
-- Migration 045: Project Comments & Notifications
-- Sol.52 — Solar EPC Project Management
-- ============================================================
-- Creates:
--   1. project_comments — internal team notes per project
--   2. notifications    — system-generated and manual alerts
--
-- project_comments:
--   - Simple flat notes in Phase 3 (newest first).
--   - parent_comment_id enables threaded replies in Phase 4 (schema ready).
--   - is_pinned for important notes surfaced at top.
--
-- notifications:
--   - Schema-only with minimal Phase 3 UI (unread count badge).
--   - Full notification center ships in Phase 4.
--   - recipient_id references installer_profiles (not auth.users)
--     because field technicians may not have auth accounts in Phase 3.
--   - recipient_id NULL = broadcast to all active org members.
--   - related_entity_type + related_entity_id = polymorphic deep-link.
--
-- Multi-tenant: organization_id NOT NULL on both tables.
-- RLS: service_role full-access (Phase 3).
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. project_comments
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.project_comments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL
                                  REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id        uuid        NOT NULL
                                  REFERENCES public.projects (id) ON DELETE CASCADE,
  comment           text        NOT NULL,
  parent_comment_id uuid        NULL
                                  REFERENCES public.project_comments (id) ON DELETE SET NULL,
  is_pinned         boolean     NOT NULL DEFAULT false,
  created_by_id     uuid        NULL
                                  REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS project_comments_project_time_idx
  ON public.project_comments (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS project_comments_pinned_idx
  ON public.project_comments (project_id, is_pinned)
  WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS project_comments_thread_idx
  ON public.project_comments (project_id, parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS project_comments_org_idx
  ON public.project_comments (organization_id);

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE  public.project_comments IS
  'Internal team notes per project. Phase 3: flat list, newest first. Phase 4: threaded UI via parent_comment_id.';
COMMENT ON COLUMN public.project_comments.parent_comment_id IS
  'Self-referential FK for threaded replies. NULL = top-level comment. Threading UX ships in Phase 4.';
COMMENT ON COLUMN public.project_comments.is_pinned IS
  'Pinned comments surface at top of list. Useful for key decisions or blockers.';
COMMENT ON COLUMN public.project_comments.created_by_id IS
  'SET NULL on profile deletion — comment content is preserved for audit integrity.';

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_project_comments"
  ON public.project_comments
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- 2. notifications
-- ════════════════════════════════════════════════════════════
-- notification_type valid values:
--   payment_overdue | survey_pending | installation_delayed |
--   approval_stuck  | nm_pending     | project_blocked      |
--   stage_advanced  | task_assigned  | comment_added        |
--   subsidy_update  | custom
--
-- related_entity_type valid values:
--   project | task | payment | document | comment
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid        NOT NULL
                                      REFERENCES public.organizations (id) ON DELETE CASCADE,
  recipient_id          uuid        NULL
                                      REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  notification_type     text        NOT NULL
                                      CHECK (notification_type IN (
                                        'payment_overdue', 'survey_pending',
                                        'installation_delayed', 'approval_stuck',
                                        'nm_pending', 'project_blocked',
                                        'stage_advanced', 'task_assigned',
                                        'comment_added', 'subsidy_update', 'custom'
                                      )),
  title                 text        NOT NULL,
  message               text,
  is_read               boolean     NOT NULL DEFAULT false,
  read_at               timestamptz,
  related_entity_type   text
                          CHECK (related_entity_type IN (
                            'project', 'task', 'payment', 'document', 'comment'
                          ) OR related_entity_type IS NULL),
  related_entity_id     uuid,
  -- Enforce consistency: both must be set, or both must be NULL.
  CONSTRAINT notifications_entity_pair_check
    CHECK (
      (related_entity_type IS NULL AND related_entity_id IS NULL) OR
      (related_entity_type IS NOT NULL AND related_entity_id IS NOT NULL)
    ),
  action_url            text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
-- Primary query: unread notifications for a user/org
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON public.notifications (organization_id, recipient_id, created_at DESC)
  WHERE is_read = false;

-- Org-level unread count (for broadcast notifications where recipient_id IS NULL)
CREATE INDEX IF NOT EXISTS notifications_org_unread_idx
  ON public.notifications (organization_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Polymorphic entity lookup (e.g. "all notifications for project X")
CREATE INDEX IF NOT EXISTS notifications_entity_idx
  ON public.notifications (related_entity_type, related_entity_id)
  WHERE related_entity_id IS NOT NULL;

-- Full history by org
CREATE INDEX IF NOT EXISTS notifications_org_time_idx
  ON public.notifications (organization_id, created_at DESC);

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE  public.notifications IS
  'System-generated and manual operational alerts. Phase 3: schema + unread count badge only. Full notification center in Phase 4.';
COMMENT ON COLUMN public.notifications.recipient_id IS
  'Target installer_profile. NULL = broadcast to all active org members. References installer_profiles (not auth.users) for Phase 3 compatibility where techs may lack auth accounts.';
COMMENT ON COLUMN public.notifications.notification_type IS
  'CHECK-constrained. New types require ALTER TABLE migration. Use custom for one-off manual notifications.';
COMMENT ON COLUMN public.notifications.related_entity_type IS
  'Polymorphic: project|task|payment|document|comment. Paired with related_entity_id for deep-linking.';
COMMENT ON COLUMN public.notifications.action_url IS
  'Deep link URL, e.g. /projects/[id]. Used by frontend to navigate on notification tap.';
COMMENT ON COLUMN public.notifications.read_at IS
  'Timestamp when notification was marked read. Allows both is_read (fast filter) and read_at (audit).';

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_notifications"
  ON public.notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);
