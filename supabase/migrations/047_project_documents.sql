-- ============================================================
-- Migration 047: Project Documents (Phase 3A-5.1)
-- Sol.52 — project-scoped file cabinet + storage metadata
-- ============================================================
-- Idempotent / repair-safe:
--   • Partial runs leave a broken table (IF NOT EXISTS skips CREATE).
--   • Empty broken tables are dropped and recreated.
--   • Non-empty tables get missing columns via ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- Remove indexes that may reference columns not yet added.
DROP INDEX IF EXISTS public.project_documents_project_time_idx;
DROP INDEX IF EXISTS public.project_documents_project_category_idx;
DROP INDEX IF EXISTS public.project_documents_org_idx;

-- Empty shell from a failed partial migration → drop and recreate cleanly.
DO $$
BEGIN
  IF to_regclass('public.project_documents') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'project_documents'
         AND column_name = 'created_at'
     )
     AND NOT EXISTS (SELECT 1 FROM public.project_documents LIMIT 1)
  THEN
    DROP TABLE public.project_documents CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.project_documents (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid        NOT NULL
                                   REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id         uuid        NOT NULL
                                   REFERENCES public.projects (id) ON DELETE CASCADE,
  doc_category       text        NOT NULL,
  stage_at_upload    text        NOT NULL DEFAULT 'survey',
  storage_path       text        NOT NULL,
  filename           text        NOT NULL,
  mime_type          text        NOT NULL,
  size_bytes         integer     NOT NULL DEFAULT 0
                                   CHECK (size_bytes >= 0),
  uploaded_by_id     uuid        NULL
                                   REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  notes              text,
  linked_entity_type text,
  linked_entity_id   uuid,
  archived_at        timestamptz NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Backfill any column missing on a non-empty legacy / partial table.
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS project_id uuid;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS doc_category text;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS stage_at_upload text;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS storage_path text;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS filename text;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS mime_type text;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS size_bytes integer;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS uploaded_by_id uuid;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS linked_entity_type text;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS linked_entity_id uuid;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Defaults for rows/backfill when columns were just added.
UPDATE public.project_documents
SET
  stage_at_upload = COALESCE(stage_at_upload, 'survey'),
  doc_category = COALESCE(doc_category, 'other'),
  storage_path = COALESCE(storage_path, ''),
  filename = COALESCE(filename, 'unknown'),
  mime_type = COALESCE(mime_type, 'application/octet-stream'),
  size_bytes = COALESCE(size_bytes, 0),
  created_at = COALESCE(created_at, now())
WHERE
  stage_at_upload IS NULL
  OR doc_category IS NULL
  OR storage_path IS NULL
  OR filename IS NULL
  OR mime_type IS NULL
  OR size_bytes IS NULL
  OR created_at IS NULL;

ALTER TABLE public.project_documents
  ALTER COLUMN stage_at_upload SET DEFAULT 'survey';

ALTER TABLE public.project_documents
  ALTER COLUMN size_bytes SET DEFAULT 0;

ALTER TABLE public.project_documents
  ALTER COLUMN created_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_documents_uploaded_by_id_fkey'
  ) THEN
    ALTER TABLE public.project_documents
      ADD CONSTRAINT project_documents_uploaded_by_id_fkey
      FOREIGN KEY (uploaded_by_id)
      REFERENCES public.installer_profiles (id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS project_documents_project_time_idx
  ON public.project_documents (project_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS project_documents_project_category_idx
  ON public.project_documents (project_id, doc_category)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS project_documents_org_idx
  ON public.project_documents (organization_id);

COMMENT ON TABLE public.project_documents IS
  'Project file cabinet metadata. Binary files live in Supabase Storage bucket project-files.';
COMMENT ON COLUMN public.project_documents.doc_category IS
  'App-validated category: roof_photo, meter_photo, db_photo, electricity_bill, site_other, sld, layout, nm_*, installation_photo, commissioning, warranty, handover, other.';
COMMENT ON COLUMN public.project_documents.stage_at_upload IS
  'Snapshot of projects.current_stage when the file was uploaded.';

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_all_project_documents" ON public.project_documents;

CREATE POLICY "service_all_project_documents"
  ON public.project_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
