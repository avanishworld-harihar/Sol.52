-- ============================================================
-- Migration 074: Design Studio — SLD pack share token
-- Public URL: /sld/[share_token] (engineering SLD, NOT customer proposal)
-- ============================================================

ALTER TABLE public.project_panel_layouts
  ADD COLUMN IF NOT EXISTS share_token uuid;

CREATE UNIQUE INDEX IF NOT EXISTS project_panel_layouts_share_token_idx
  ON public.project_panel_layouts (share_token)
  WHERE share_token IS NOT NULL;

COMMENT ON COLUMN public.project_panel_layouts.share_token IS
  'Unguessable UUID for public SLD pack at /sld/[token]. Separate from proposal and Design pack share.';

-- Carry the SLD pack token forward when a new panel layout version is saved.
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
  v_share_token uuid;
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

  SELECT share_token INTO v_share_token
  FROM public.project_panel_layouts
  WHERE project_id = p_project_id AND is_current = true
  LIMIT 1;

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
    coverage_pct, created_by_id, share_token
  )
  VALUES (
    v_org_id, p_project_id, p_site_layout_id, p_design_id,
    v_next_version, true, p_panel_spec, p_orientation,
    COALESCE(p_tilt_deg, 0), COALESCE(p_mounting_type, 'flush'),
    COALESCE(p_setback_ft, 1.5), COALESCE(p_walkway_ft, 0),
    COALESCE(p_panel_gap_mm, 20), COALESCE(p_panels_geojson, '[]'::jsonb),
    COALESCE(p_panel_count, 0), COALESCE(p_dc_capacity_kw, 0),
    COALESCE(p_remaining_area_sqft, 0), COALESCE(p_coverage_pct, 0),
    p_created_by_id, v_share_token
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
