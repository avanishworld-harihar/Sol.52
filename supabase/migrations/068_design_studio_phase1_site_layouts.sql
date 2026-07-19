-- ============================================================
-- Migration 068: Design Studio Phase 1 — Versioned Site Layouts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_site_layouts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL
                            REFERENCES public.organizations (id) ON DELETE CASCADE,
  project_id            uuid NOT NULL
                            REFERENCES public.projects (id) ON DELETE CASCADE,
  design_id             uuid NULL
                            REFERENCES public.project_designs (id) ON DELETE SET NULL,
  version_number        integer NOT NULL DEFAULT 1,
  is_current            boolean NOT NULL DEFAULT true,
  center_lat            numeric(10, 7),
  center_lng            numeric(10, 7),
  roof_geojson          jsonb NOT NULL,
  roof_azimuth_deg      numeric,
  obstructions_geojson  jsonb NOT NULL DEFAULT '[]'::jsonb,
  roof_area_sqft        numeric NOT NULL DEFAULT 0,
  map_snapshot_path     text,
  created_by_id         uuid NULL
                            REFERENCES public.installer_profiles (id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_site_layouts_version_unique
    UNIQUE (project_id, version_number),
  CONSTRAINT project_site_layouts_roof_polygon
    CHECK (roof_geojson->>'type' = 'Polygon'),
  CONSTRAINT project_site_layouts_center_lat
    CHECK (center_lat IS NULL OR center_lat BETWEEN -90 AND 90),
  CONSTRAINT project_site_layouts_center_lng
    CHECK (center_lng IS NULL OR center_lng BETWEEN -180 AND 180),
  CONSTRAINT project_site_layouts_area_nonnegative
    CHECK (roof_area_sqft >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS project_site_layouts_one_current_per_project_idx
  ON public.project_site_layouts (project_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS project_site_layouts_project_version_idx
  ON public.project_site_layouts (project_id, version_number DESC);

CREATE INDEX IF NOT EXISTS project_site_layouts_org_idx
  ON public.project_site_layouts (organization_id);

ALTER TABLE public.project_site_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_project_site_layouts"
  ON public.project_site_layouts
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.project_site_layouts IS
  'Design Studio Phase 1: immutable, versioned roof polygons and site context per project.';
COMMENT ON COLUMN public.project_site_layouts.roof_geojson IS
  'GeoJSON Polygon in WGS84 longitude/latitude coordinates.';
COMMENT ON COLUMN public.project_site_layouts.obstructions_geojson IS
  'Array of obstruction records with type, point/footprint and height_ft.';

-- Atomic save: retire the old current row and insert the next version.
CREATE OR REPLACE FUNCTION public.save_project_site_layout(
  p_project_id uuid,
  p_design_id uuid,
  p_center_lat numeric,
  p_center_lng numeric,
  p_roof_geojson jsonb,
  p_roof_azimuth_deg numeric,
  p_obstructions_geojson jsonb,
  p_roof_area_sqft numeric,
  p_map_snapshot_path text,
  p_created_by_id uuid
)
RETURNS public.project_site_layouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_next_version integer;
  v_row public.project_site_layouts;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'project_not_found_or_org_missing';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next_version
  FROM public.project_site_layouts
  WHERE project_id = p_project_id;

  UPDATE public.project_site_layouts
  SET is_current = false
  WHERE project_id = p_project_id AND is_current = true;

  INSERT INTO public.project_site_layouts (
    organization_id, project_id, design_id, version_number, is_current,
    center_lat, center_lng, roof_geojson, roof_azimuth_deg,
    obstructions_geojson, roof_area_sqft, map_snapshot_path, created_by_id
  )
  VALUES (
    v_org_id, p_project_id, p_design_id, v_next_version, true,
    p_center_lat, p_center_lng, p_roof_geojson, p_roof_azimuth_deg,
    COALESCE(p_obstructions_geojson, '[]'::jsonb), COALESCE(p_roof_area_sqft, 0),
    p_map_snapshot_path, p_created_by_id
  )
  RETURNING * INTO v_row;

  -- Phase 1 keeps survey area/GPS aligned with the canonical roof geometry.
  UPDATE public.project_site_surveys
  SET roof_area_sqft = COALESCE(p_roof_area_sqft, roof_area_sqft),
      gps_lat = COALESCE(p_center_lat, gps_lat),
      gps_lng = COALESCE(p_center_lng, gps_lng),
      updated_at = now()
  WHERE project_id = p_project_id;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.save_project_site_layout(
  uuid, uuid, numeric, numeric, jsonb, numeric, jsonb, numeric, text, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_project_site_layout(
  uuid, uuid, numeric, numeric, jsonb, numeric, jsonb, numeric, text, uuid
) TO authenticated, service_role;
