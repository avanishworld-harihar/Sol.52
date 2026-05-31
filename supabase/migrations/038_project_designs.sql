-- ============================================================
-- Migration 038: Project Designs (Versioned)
-- Sol.52 — Solar EPC Project Management
-- ============================================================
-- Creates:
--   project_designs — versioned system design records per project
--
-- Versioning rules (enforced at application layer):
--   - New design = new row (previous rows never deleted or overwritten)
--   - version_number is monotonically increasing per project
--   - On insert of new version: set all previous rows is_current = false
--   - Current design = WHERE project_id = ? AND is_current = true
--     ORDER BY version_number DESC LIMIT 1
--
-- Design documents (SLD, layout, structural) are stored in
-- project_documents with doc_category = 'sld' | 'layout' | 'structural_drawing'
-- and linked via the design's project + stage context.
--
-- Multi-tenant: organization_id NOT NULL.
-- RLS: service_role full-access (Phase 3).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_designs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NOT NULL
                                    REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id          uuid        NOT NULL
                                    REFERENCES public.projects (id) ON DELETE CASCADE,
  version_number      integer     NOT NULL DEFAULT 1,
  version_label       text,         -- e.g. "V1 – Initial", "V2 – Post-survey revision"
  is_current          boolean     NOT NULL DEFAULT true,
  created_by_id       uuid        NULL
                                    REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  revision_notes      text,

  -- ── System Specifications ────────────────────────────────
  system_kw           numeric,
  panel_count         integer,
  panel_watt          integer,      -- individual panel wattage, e.g. 550
  panel_model         text,
  inverter_kw         numeric,
  inverter_model      text,
  structure_type      text
                        CHECK (structure_type IN (
                          'elevated', 'flush', 'ground_mount', 'other'
                        ) OR structure_type IS NULL),
  string_count        integer,
  modules_per_string  integer,
  annual_yield_kwh    numeric,      -- estimated annual generation
  performance_ratio   numeric,      -- 0.0–1.0; typically 0.75–0.85

  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_designs_version_unique UNIQUE (project_id, version_number)
);

-- ── Indexes ──────────────────────────────────────────────────

-- CRITICAL: enforces the is_current invariant at DB level.
-- Prevents race condition where two concurrent inserts both set is_current = true
-- for the same project. The application UPDATE-then-INSERT pattern is safe
-- only within a transaction when this index exists.
-- Application step for new version:
--   BEGIN;
--   UPDATE project_designs SET is_current = false WHERE project_id = ? AND is_current = true;
--   INSERT INTO project_designs (..., is_current = true) VALUES (...);
--   COMMIT;
CREATE UNIQUE INDEX IF NOT EXISTS project_designs_one_current_per_project_idx
  ON public.project_designs (project_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS project_designs_project_version_idx
  ON public.project_designs (project_id, version_number DESC);

CREATE INDEX IF NOT EXISTS project_designs_org_idx
  ON public.project_designs (organization_id);

CREATE INDEX IF NOT EXISTS project_designs_created_by_idx
  ON public.project_designs (created_by_id)
  WHERE created_by_id IS NOT NULL;

-- ── Comments ─────────────────────────────────────────────────
COMMENT ON TABLE  public.project_designs IS
  'Versioned system designs per project. Each version is an immutable row. New revisions set previous is_current = false. Previous versions are never deleted.';
COMMENT ON COLUMN public.project_designs.version_number IS
  'Monotonically increasing per project. Unique constraint: (project_id, version_number).';
COMMENT ON COLUMN public.project_designs.is_current IS
  'Exactly one row per project has is_current = true at any time. Application maintains this invariant on new version creation.';
COMMENT ON COLUMN public.project_designs.version_label IS
  'Human-readable label, e.g. "V2 – Revised after DISCOM feedback". Auto-generated as "V{n}" if not provided.';
COMMENT ON COLUMN public.project_designs.panel_watt IS
  'Individual panel wattage in watts, e.g. 550 for a 550W panel. Total capacity = panel_count * panel_watt / 1000 kW.';
COMMENT ON COLUMN public.project_designs.performance_ratio IS
  'System performance ratio (0.0–1.0). Used for yield estimation. Typical range: 0.75–0.85.';
COMMENT ON COLUMN public.project_designs.annual_yield_kwh IS
  'Estimated annual energy generation in kWh. Key metric for ROI calculations.';

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.project_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_project_designs"
  ON public.project_designs
  FOR ALL
  USING (true)
  WITH CHECK (true);
