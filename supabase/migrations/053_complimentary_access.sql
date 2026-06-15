-- Sol.52 Phase 1 — Super Admin complimentary access (no promo codes / coupons).

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS is_complimentary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS granted_by text NULL,
  ADD COLUMN IF NOT EXISTS granted_reason text NULL;

COMMENT ON COLUMN public.organization_subscriptions.is_complimentary IS
  'True when Super Admin granted free paid-plan access (not a Razorpay subscription).';
COMMENT ON COLUMN public.organization_subscriptions.expires_at IS
  'Complimentary access expiry — org downgrades when past this timestamp.';
COMMENT ON COLUMN public.organization_subscriptions.granted_by IS
  'Super Admin identifier who granted complimentary access.';
COMMENT ON COLUMN public.organization_subscriptions.granted_reason IS
  'Internal note for why complimentary access was granted.';

CREATE INDEX IF NOT EXISTS organization_subscriptions_complimentary_expires_idx
  ON public.organization_subscriptions (expires_at)
  WHERE is_complimentary = true AND expires_at IS NOT NULL;
