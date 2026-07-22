-- Central Design Studio panel module catalog (org extras merged onto built-in list).
-- Same scope_key pattern as installer_rate_cards ('default' for this deployment).

CREATE TABLE IF NOT EXISTS public.design_panel_module_catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key text NOT NULL DEFAULT 'default',
  org_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT design_panel_module_catalogs_scope_key_unique UNIQUE (scope_key)
);

CREATE INDEX IF NOT EXISTS design_panel_module_catalogs_updated_idx
  ON public.design_panel_module_catalogs (updated_at DESC);

COMMENT ON TABLE public.design_panel_module_catalogs IS
  'Admin-editable Design Studio modules. org_modules JSON array of PanelSpec merged onto built-in catalog.';

COMMENT ON COLUMN public.design_panel_module_catalogs.org_modules IS
  'JSON array: [{ catalog_id, manufacturer, model, wattage, width_mm, height_mm }]';

ALTER TABLE public.design_panel_module_catalogs ENABLE ROW LEVEL SECURITY;

INSERT INTO public.design_panel_module_catalogs (scope_key, org_modules)
VALUES ('default', '[]'::jsonb)
ON CONFLICT (scope_key) DO NOTHING;
