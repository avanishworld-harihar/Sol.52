-- ============================================================
-- Migration 072: Design Studio Phase 5 — Design pack share token
-- Public URL: /design/[share_token] (installer pack, NOT customer proposal)
-- ============================================================

ALTER TABLE public.project_site_layouts
  ADD COLUMN IF NOT EXISTS share_token uuid;

CREATE UNIQUE INDEX IF NOT EXISTS project_site_layouts_share_token_idx
  ON public.project_site_layouts (share_token)
  WHERE share_token IS NOT NULL;

COMMENT ON COLUMN public.project_site_layouts.share_token IS
  'Unguessable UUID for public Design pack at /design/[token]. Separate from proposal share.';

-- Carry the project pack token forward when a new roof version is saved.
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
  v_share_token uuid;
  v_row public.project_site_layouts;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'project_not_found_or_org_missing';
  END IF;

  SELECT share_token INTO v_share_token
  FROM public.project_site_layouts
  WHERE project_id = p_project_id AND is_current = true
  LIMIT 1;

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
    obstructions_geojson, roof_area_sqft, map_snapshot_path, created_by_id,
    share_token
  )
  VALUES (
    v_org_id, p_project_id, p_design_id, v_next_version, true,
    p_center_lat, p_center_lng, p_roof_geojson, p_roof_azimuth_deg,
    COALESCE(p_obstructions_geojson, '[]'::jsonb), COALESCE(p_roof_area_sqft, 0),
    p_map_snapshot_path, p_created_by_id,
    v_share_token
  )
  RETURNING * INTO v_row;

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
