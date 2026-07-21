-- =============================================================
-- Migration 070: Design Studio Phase 2 — Panel Layout Versions
-- =============================================================

CREATE TABLE IF NOT EXISTS public.project_panel_layouts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL
                            REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id            uuid NOT NULL
                            REFERENCES public.projects (id) ON DELETE CASCADE,
  site_layout_id        uuid NOT NULL
                            REFERENCES public.project_site_layouts (id) ON DELETE CASCADE,
  design_id             uuid NULL
                            REFERENCES public.project_designs (id) ON DELETE SET NULL,
  version_number        integer NOT NULL DEFAULT 1,
  is_current            boolean NOT NULL DEFAULT true,
  panel_spec            jsonb NOT NULL,
  orientation           text NOT NULL,
  tilt_deg              numeric NOT NULL DEFAULT 0,
  mounting_type         text NOT NULL DEFAULT 'flush',
  setback_ft            numeric NOT NULL DEFAULT 1.5,
  walkway_ft            numeric NOT NULL DEFAULT 0,
  panel_gap_mm          numeric NOT NULL DEFAULT 20,
  panels_geojson        jsonb NOT NULL DEFAULT '[]'::jsonb,
  panel_count           integer NOT NULL DEFAULT 0,
  dc_capacity_kw        numeric NOT NULL DEFAULT 0,
  remaining_area_sqft   numeric NOT NULL DEFAULT 0,
  coverage_pct          numeric NOT NULL DEFAULT 0,
  created_by_id         uuid NULL
                            REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  generated_at          timestamptz NOT NULL DEFAULT now(),
  edited_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_panel_layouts_version_unique
    UNIQUE (project_id, version_number),
  CONSTRAINT project_panel_layouts_orientation
    CHECK (orientation IN ('portrait', 'landscape', 'east_west')),
  CONSTRAINT project_panel_layouts_mounting
    CHECK (mounting_type IN ('flush', 'elevated', 'ground_mount')),
  CONSTRAINT project_panel_layouts_panel_spec_object
    CHECK (jsonb_typeof(panel_spec) = 'object'),
  CONSTRAINT project_panel_layouts_panels_array
    CHECK (jsonb_typeof(panels_geojson) = 'array'),
  CONSTRAINT project_panel_layouts_panel_count_matches
    CHECK (panel_count = jsonb_array_length(panels_geojson)),
  CONSTRAINT project_panel_layouts_nonnegative
    CHECK (
      tilt_deg BETWEEN 0 AND 90
      AND setback_ft >= 0
      AND walkway_ft >= 0
      AND panel_gap_mm >= 0
      AND panel_count >= 0
      AND dc_capacity_kw >= 0
      AND remaining_area_sqft >= 0
      AND coverage_pct BETWEEN 0 AND 100
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS project_panel_layouts_one_current_per_project_idx
  ON public.project_panel_layouts (project_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS project_panel_layouts_project_version_idx
  ON public.project_panel_layouts (project_id, version_number DESC);

CREATE INDEX IF NOT EXISTS project_panel_layouts_site_layout_idx
  ON public.project_panel_layouts (site_layout_id);

CREATE INDEX IF NOT EXISTS project_panel_layouts_org_idx
  ON public.project_panel_layouts (organization_id);

ALTER TABLE public.project_panel_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_all_project_panel_layouts"
  ON public.project_panel_layouts;
CREATE POLICY "service_all_project_panel_layouts"
  ON public.project_panel_layouts
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.project_panel_layouts IS
  'Design Studio Phase 2: immutable, versioned per-panel layouts linked to a site-layout version.';
COMMENT ON COLUMN public.project_panel_layouts.panel_spec IS
  'Frozen module model, wattage, width_mm and height_mm used for this layout.';
COMMENT ON COLUMN public.project_panel_layouts.panels_geojson IS
  'Array of panel records with Polygon footprint, section/row/column and lock/manual flags.';

CREATE OR REPLACE FUNCTION public.save_project_panel_layout(
  p_project_id uuid,
  p_site_layout_id uuid,
  p_design_id uuid,
  p_panel_spec jsonb,
  p_orientation text,
  p_tilt_deg numeric,
  p_mounting_type text,
  p_setback_ft numeric,
  p_walkway_ft numeric,
  p_panel_gap_mm numeric,
  p_panels_geojson jsonb,
  p_panel_count integer,
  p_dc_capacity_kw numeric,
  p_remaining_area_sqft numeric,
  p_coverage_pct numeric,
  p_created_by_id uuid
)
RETURNS public.project_panel_layouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_next_version integer;
  v_row public.project_panel_layouts;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'project_not_found_or_org_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.project_site_layouts
    WHERE id = p_site_layout_id
      AND project_id = p_project_id
  ) THEN
    RAISE EXCEPTION 'site_layout_not_found_for_project';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next_version
  FROM public.project_panel_layouts
  WHERE project_id = p_project_id;

  UPDATE public.project_panel_layouts
  SET is_current = false
  WHERE project_id = p_project_id
    AND is_current = true;

  INSERT INTO public.project_panel_layouts (
    organization_id, project_id, site_layout_id, design_id,
    version_number, is_current, panel_spec, orientation,
    tilt_deg, mounting_type, setback_ft, walkway_ft, panel_gap_mm,
    panels_geojson, panel_count, dc_capacity_kw, remaining_area_sqft,
    coverage_pct, created_by_id
  )
  VALUES (
    v_org_id, p_project_id, p_site_layout_id, p_design_id,
    v_next_version, true, p_panel_spec, p_orientation,
    COALESCE(p_tilt_deg, 0), COALESCE(p_mounting_type, 'flush'),
    COALESCE(p_setback_ft, 1.5), COALESCE(p_walkway_ft, 0),
    COALESCE(p_panel_gap_mm, 20), COALESCE(p_panels_geojson, '[]'::jsonb),
    COALESCE(p_panel_count, 0), COALESCE(p_dc_capacity_kw, 0),
    COALESCE(p_remaining_area_sqft, 0), COALESCE(p_coverage_pct, 0),
    p_created_by_id
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.save_project_panel_layout(
  uuid, uuid, uuid, jsonb, text, numeric, text, numeric, numeric,
  numeric, jsonb, integer, numeric, numeric, numeric, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_project_panel_layout(
  uuid, uuid, uuid, jsonb, text, numeric, text, numeric, numeric,
  numeric, jsonb, integer, numeric, numeric, numeric, uuid
) TO authenticated, service_role;
