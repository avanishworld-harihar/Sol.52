-- Design Studio: allow one or more independent roof sections.
-- Existing Polygon rows remain valid; new multi-section layouts use MultiPolygon.

ALTER TABLE public.project_site_layouts
  DROP CONSTRAINT IF EXISTS project_site_layouts_roof_polygon;

ALTER TABLE public.project_site_layouts
  ADD CONSTRAINT project_site_layouts_roof_geometry
  CHECK (roof_geojson->>'type' IN ('Polygon', 'MultiPolygon'));

COMMENT ON COLUMN public.project_site_layouts.roof_geojson IS
  'GeoJSON Polygon or MultiPolygon in WGS84 coordinates. Each MultiPolygon member is an independent roof section.';
