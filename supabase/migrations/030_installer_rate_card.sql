-- Central installer rate card (residential kW catalog + commercial ₹/Wp).
-- Single source of truth for quotations; proposals snapshot at save time.

CREATE TABLE IF NOT EXISTS public.installer_rate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key text NOT NULL DEFAULT 'default',
  residential_catalog jsonb NOT NULL DEFAULT '{}'::jsonb,
  commercial_panel_rates jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installer_rate_cards_scope_key_unique UNIQUE (scope_key)
);

CREATE INDEX IF NOT EXISTS installer_rate_cards_updated_idx
  ON public.installer_rate_cards (updated_at DESC);

COMMENT ON TABLE public.installer_rate_cards IS
  'Installer master rate card. residential_catalog = brand × kW tier gross (DCR); commercial_panel_rates = ₹/Wp overrides.';

COMMENT ON COLUMN public.installer_rate_cards.residential_catalog IS
  'JSON: { activeBrandId, entries: [{ brandId, brand, kwTiers: [{ kw, priceInr }] }] }';

COMMENT ON COLUMN public.installer_rate_cards.commercial_panel_rates IS
  'JSON array of { id, ratePerWpInr } overrides merged onto PANEL_CATALOG defaults.';

ALTER TABLE public.installer_rate_cards ENABLE ROW LEVEL SECURITY;

-- Seed default row (empty catalog — app fills defaults on first read)
INSERT INTO public.installer_rate_cards (scope_key, residential_catalog, commercial_panel_rates)
VALUES ('default', '{}'::jsonb, '[]'::jsonb)
ON CONFLICT (scope_key) DO NOTHING;
