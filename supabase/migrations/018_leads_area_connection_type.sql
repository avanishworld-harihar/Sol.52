-- Optional CRM fields: tariff area (urban/rural) and connection category.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS area text NULL,
  ADD COLUMN IF NOT EXISTS connection_type text NULL;

COMMENT ON COLUMN public.leads.area IS 'Tariff area: urban | rural (optional)';
COMMENT ON COLUMN public.leads.connection_type IS 'Connection category: domestic | commercial | industrial | agricultural | ht (optional)';
