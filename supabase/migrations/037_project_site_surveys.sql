-- ============================================================
-- Migration 037: Project Site Surveys
-- Sol.52 — Solar EPC Project Management
-- ============================================================
-- Creates:
--   project_site_surveys — comprehensive field data capture form
--
-- One row per project (1:1 UNIQUE on project_id).
-- Survey updates are in-place (not versioned).
-- Photo attachments (roof, meter, DB) stored in project_documents
-- with doc_category = 'roof_photo' | 'meter_photo' | 'db_photo'.
-- Multi-tenant: organization_id NOT NULL.
-- RLS: service_role full-access (Phase 3).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_site_surveys (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        uuid        NOT NULL
                                       REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id             uuid        NOT NULL UNIQUE
                                       REFERENCES public.projects (id) ON DELETE CASCADE,
  surveyed_by_id         uuid        NULL
                                       REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  survey_date            date,

  -- ── Site Information ─────────────────────────────────────
  site_address           text,
  gps_lat                numeric(10, 7),
  gps_lng                numeric(10, 7),
  roof_type              text
                           CHECK (roof_type IN (
                             'rcc', 'tin', 'metal', 'asbestos',
                             'terrace', 'ground', 'other'
                           ) OR roof_type IS NULL),
  roof_area_sqft         numeric,
  shadow_free_sqft       numeric,
  roof_height_ft         numeric,
  roof_condition         text
                           CHECK (roof_condition IN (
                             'good', 'minor_repair', 'major_repair', 'not_suitable'
                           ) OR roof_condition IS NULL),
  roof_orientation       text
                           CHECK (roof_orientation IN (
                             'south', 'east_west', 'flat', 'north', 'other'
                           ) OR roof_orientation IS NULL),

  -- ── Electrical Information ───────────────────────────────
  consumer_number        text,
  sanction_load_kw       numeric,
  connected_load_kw      numeric,
  meter_type             text
                           CHECK (meter_type IN (
                             'single_phase', 'three_phase', 'ltct', 'htct', 'other'
                           ) OR meter_type IS NULL),
  transformer_distance_m numeric,
  meter_location         text,
  db_location            text,
  existing_earthing      boolean     NOT NULL DEFAULT false,

  -- ── Solar Inputs ─────────────────────────────────────────
  available_area_sqft    numeric,
  proposed_capacity_kw   numeric,
  shadow_analysis_note   text,
  annual_irradiation     numeric,  -- kWh/m²/year; optional for advanced users

  -- ── Special Conditions ───────────────────────────────────
  has_dg                 boolean     NOT NULL DEFAULT false,
  dg_kva                 numeric,
  battery_required       boolean     NOT NULL DEFAULT false,
  battery_capacity_kwh   numeric,
  existing_inverter      boolean     NOT NULL DEFAULT false,
  existing_inverter_kw   numeric,
  project_category       text        NOT NULL DEFAULT 'residential'
                                       CHECK (project_category IN (
                                         'residential', 'commercial', 'industrial',
                                         'agricultural', 'institutional', 'other'
                                       )),
  structure_floor        integer,    -- floor number or count (for multi-storey)
  special_notes          text,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
-- Note: No separate index on project_id — the UNIQUE constraint above
-- already creates a B-tree index on project_id. A duplicate non-unique
-- index would waste storage and slow writes with zero benefit.

CREATE INDEX IF NOT EXISTS project_site_surveys_org_idx
  ON public.project_site_surveys (organization_id);

CREATE INDEX IF NOT EXISTS project_site_surveys_category_idx
  ON public.project_site_surveys (organization_id, project_category);

CREATE INDEX IF NOT EXISTS project_site_surveys_surveyed_by_idx
  ON public.project_site_surveys (surveyed_by_id)
  WHERE surveyed_by_id IS NOT NULL;

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE  public.project_site_surveys IS
  'Comprehensive site survey data captured by field technicians. One row per project (UNIQUE on project_id). Updates are in-place.';
COMMENT ON COLUMN public.project_site_surveys.project_id IS
  'UNIQUE — exactly one survey record per project.';
COMMENT ON COLUMN public.project_site_surveys.gps_lat IS
  'GPS latitude. Captured via browser Geolocation API on mobile field devices.';
COMMENT ON COLUMN public.project_site_surveys.gps_lng IS
  'GPS longitude. Captured via browser Geolocation API on mobile field devices.';
COMMENT ON COLUMN public.project_site_surveys.shadow_free_sqft IS
  'Usable shadow-free roof area. Key input for system sizing.';
COMMENT ON COLUMN public.project_site_surveys.annual_irradiation IS
  'Site-specific solar irradiation in kWh/m²/year. Optional; defaults to DISCOM zone average if not set.';
COMMENT ON COLUMN public.project_site_surveys.project_category IS
  'Determines applicable government schemes, subsidies, and tariff categories.';

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.project_site_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_project_site_surveys"
  ON public.project_site_surveys
  FOR ALL
  USING (true)
  WITH CHECK (true);
