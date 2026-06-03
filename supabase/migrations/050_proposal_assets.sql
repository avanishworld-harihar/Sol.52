-- ============================================================
-- Migration 050: Customer Documents Hub — Phase 3 (additive only)
-- proposal_assets + storage bucket reference (proposal-assets)
-- No legacy ALTER/DROP. No backfill.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.proposal_assets (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  customer_id         uuid        NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  proposal_id         uuid        NOT NULL REFERENCES public.proposals (id) ON DELETE CASCADE,
  pricing_snapshot_id uuid        NULL REFERENCES public.proposal_pricing_snapshots (id) ON DELETE SET NULL,
  category            text        NOT NULL,
  revision_number     integer     NOT NULL DEFAULT 1 CHECK (revision_number >= 1),
  storage_bucket      text        NOT NULL DEFAULT 'proposal-assets',
  storage_path        text        NOT NULL,
  filename            text        NOT NULL,
  mime_type           text        NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  size_bytes          integer     NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  triggered_by        text        NOT NULL DEFAULT 'sent',
  archived_at         timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_assets_category_chk CHECK (
    category IN ('proposal_pdf', 'proposal_revision')
  ),
  CONSTRAINT proposal_assets_triggered_by_chk CHECK (
    triggered_by IN ('sent', 'revised', 'approved', 'manual')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS proposal_assets_snapshot_uidx
  ON public.proposal_assets (pricing_snapshot_id)
  WHERE pricing_snapshot_id IS NOT NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS proposal_assets_customer_time_idx
  ON public.proposal_assets (organization_id, customer_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS proposal_assets_proposal_idx
  ON public.proposal_assets (proposal_id, revision_number DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS proposal_assets_filename_trgm_idx
  ON public.proposal_assets USING gin (filename gin_trgm_ops);

COMMENT ON TABLE public.proposal_assets IS
  'Frozen proposal exports (PPTX MVP). One row per pricing snapshot on sent/revised.';

ALTER TABLE public.proposal_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_all_proposal_assets" ON public.proposal_assets;
CREATE POLICY "service_all_proposal_assets" ON public.proposal_assets
  FOR ALL USING (true) WITH CHECK (true);
