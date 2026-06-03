-- ============================================================
-- Migration 049: Document backfill audit map (Phase 2)
-- Tracks legacy row → new asset row mapping. No legacy changes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_migration_map (
  legacy_table  text        NOT NULL,
  legacy_id     uuid        NOT NULL,
  new_table     text        NOT NULL,
  new_id        uuid        NOT NULL,
  migrated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (legacy_table, legacy_id)
);

CREATE INDEX IF NOT EXISTS document_migration_map_new_idx
  ON public.document_migration_map (new_table, new_id);

COMMENT ON TABLE public.document_migration_map IS
  'Phase 2 backfill audit: maps customer_files / project_documents rows to customer_assets / project_assets.';

ALTER TABLE public.document_migration_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_all_document_migration_map" ON public.document_migration_map;
CREATE POLICY "service_all_document_migration_map" ON public.document_migration_map
  FOR ALL USING (true) WITH CHECK (true);
