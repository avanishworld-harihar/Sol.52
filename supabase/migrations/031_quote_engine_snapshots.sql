-- Phase 1 quotation engine — frozen quote payload on pricing snapshots.

ALTER TABLE public.proposal_pricing_snapshots
  ADD COLUMN IF NOT EXISTS quote_engine jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.proposal_pricing_snapshots.quote_engine IS
  'Frozen QuoteEngineSnapshot (₹/Wp, subsidy, discount, net) at sent/generated/revised. Immutable with snapshot row.';

ALTER TABLE public.installer_rate_cards
  ADD COLUMN IF NOT EXISTS engine_version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.installer_rate_cards.engine_version IS
  'Pricing engine schema version (lib/pricing-engine PRICING_ENGINE_VERSION).';
