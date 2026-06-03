-- ============================================================
-- Migration 048: Customer Documents Hub — Phase 1 (additive only)
-- customer_assets, project_assets, asset_links
-- No proposal_assets (deferred). No drops. No legacy redirects.
-- ============================================================

-- ── customer_assets ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_assets (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  customer_id       uuid        NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  category          text        NOT NULL,
  storage_bucket    text        NOT NULL DEFAULT 'customer-files',
  storage_path      text        NOT NULL,
  filename          text        NOT NULL,
  mime_type         text        NOT NULL DEFAULT 'application/octet-stream',
  size_bytes        integer     NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  sha256            text        NULL,
  version           integer     NOT NULL DEFAULT 1,
  supersedes_id     uuid        NULL REFERENCES public.customer_assets (id) ON DELETE SET NULL,
  source_channel    text        NOT NULL DEFAULT 'crm_ui',
  uploaded_by_id    uuid        NULL REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  notes             text        NULL,
  archived_at       timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_assets_category_chk CHECK (
    category IN ('bill', 'roof_photo', 'meter_photo', 'db_photo', 'survey_media')
  )
);

CREATE INDEX IF NOT EXISTS customer_assets_customer_time_idx
  ON public.customer_assets (organization_id, customer_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS customer_assets_customer_category_idx
  ON public.customer_assets (organization_id, customer_id, category)
  WHERE archived_at IS NULL;

COMMENT ON TABLE public.customer_assets IS
  'Customer-owned file vault (bills, survey media). Phase 1: table only; writes still use customer_files.';

-- ── project_assets ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_assets (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  customer_id       uuid        NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  project_id        uuid        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  category          text        NOT NULL,
  storage_bucket    text        NOT NULL DEFAULT 'project-files',
  storage_path      text        NOT NULL,
  filename          text        NOT NULL,
  mime_type         text        NOT NULL DEFAULT 'application/octet-stream',
  size_bytes        integer     NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  uploaded_by_id    uuid        NULL REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  notes             text        NULL,
  archived_at       timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_assets_category_chk CHECK (
    category IN (
      'aadhaar', 'pan', 'agreement', 'advance_receipt',
      'sld', 'net_metering', 'installation_photo'
    )
  )
);

CREATE INDEX IF NOT EXISTS project_assets_customer_time_idx
  ON public.project_assets (organization_id, customer_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS project_assets_project_idx
  ON public.project_assets (project_id, category)
  WHERE archived_at IS NULL;

COMMENT ON TABLE public.project_assets IS
  'Project-scoped deliverables (KYC, SLD, NM, install). Phase 1: table only; writes still use project_documents.';

-- ── asset_links (customer asset ↔ project, no duplicate blobs) ──
CREATE TABLE IF NOT EXISTS public.asset_links (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  asset_id        uuid        NOT NULL REFERENCES public.customer_assets (id) ON DELETE CASCADE,
  customer_id     uuid        NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  project_id      uuid        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  link_role       text        NOT NULL,
  pinned          boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS asset_links_project_idx
  ON public.asset_links (project_id, link_role);

CREATE INDEX IF NOT EXISTS asset_links_asset_idx
  ON public.asset_links (asset_id);

CREATE UNIQUE INDEX IF NOT EXISTS asset_links_project_role_unique
  ON public.asset_links (project_id, link_role);

COMMENT ON TABLE public.asset_links IS
  'Links customer-owned assets into a project workspace without duplicating storage.';

-- RLS: service role via API (match Phase 3 pattern)
ALTER TABLE public.customer_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_all_customer_assets" ON public.customer_assets;
CREATE POLICY "service_all_customer_assets" ON public.customer_assets
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_project_assets" ON public.project_assets;
CREATE POLICY "service_all_project_assets" ON public.project_assets
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_asset_links" ON public.asset_links;
CREATE POLICY "service_all_asset_links" ON public.asset_links
  FOR ALL USING (true) WITH CHECK (true);

-- Filename search (Phase 1 hub)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS customer_assets_filename_trgm_idx
  ON public.customer_assets USING gin (filename gin_trgm_ops);

CREATE INDEX IF NOT EXISTS project_assets_filename_trgm_idx
  ON public.project_assets USING gin (filename gin_trgm_ops);
