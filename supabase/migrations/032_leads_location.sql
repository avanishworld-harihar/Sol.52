-- Customer site / locality (e.g. colony, sector) — separate from city name in CRM.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS location text NULL;

COMMENT ON COLUMN public.leads.location IS 'Site locality / landmark (optional); city remains the district or city name.';
