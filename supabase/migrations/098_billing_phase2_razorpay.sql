-- SOL.52 Billing Phase 2 — Razorpay-ready subscriptions and annual billing.
-- Safe to apply before Razorpay credentials are configured: manual/admin billing
-- continues to work and checkout remains disabled until provider plan IDs exist.

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS provider_plan_id_monthly text NULL,
  ADD COLUMN IF NOT EXISTS provider_plan_id_yearly text NULL;

ALTER TABLE public.organization_subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS provider_latest_payment_id text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organization_subscriptions_billing_interval_check'
  ) THEN
    ALTER TABLE public.organization_subscriptions
      ADD CONSTRAINT organization_subscriptions_billing_interval_check
      CHECK (billing_interval IN ('monthly', 'yearly'));
  END IF;
END $$;

-- Two months free on annual billing. These are catalog prices; Razorpay plan IDs
-- are populated after plans are created in the merchant dashboard/test account.
UPDATE public.subscription_plans
SET price_inr_yearly = CASE code
  WHEN 'starter' THEN 14990
  WHEN 'pro' THEN 34990
  WHEN 'business' THEN 79990
  ELSE price_inr_yearly
END,
updated_at = now()
WHERE code IN ('starter', 'pro', 'business');

DO $$
DECLARE
  plan_pk_type text;
BEGIN
  IF to_regclass('public.billing_checkout_sessions') IS NULL THEN
    SELECT format_type(a.atttypid, a.atttypmod)
      INTO plan_pk_type
    FROM pg_attribute a
    WHERE a.attrelid = 'public.subscription_plans'::regclass
      AND a.attname = 'id'
      AND NOT a.attisdropped;

    IF plan_pk_type IS NULL THEN
      RAISE EXCEPTION 'subscription_plans.id is missing';
    END IF;

    EXECUTE format($create$
      CREATE TABLE public.billing_checkout_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        plan_id %s NOT NULL REFERENCES public.subscription_plans(id),
        billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
        provider text NOT NULL DEFAULT 'razorpay',
        provider_subscription_id text NOT NULL UNIQUE,
        provider_short_url text NULL,
        status text NOT NULL DEFAULT 'created'
          CHECK (status IN ('created', 'authenticated', 'active', 'past_due', 'cancelled', 'failed')),
        created_by_user_id uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    $create$, plan_pk_type);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS billing_checkout_sessions_org_idx
  ON public.billing_checkout_sessions (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  provider_subscription_id text NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_error text NULL,
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS billing_webhook_events_subscription_idx
  ON public.billing_webhook_events (provider_subscription_id, created_at DESC);

ALTER TABLE public.billing_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.billing_checkout_sessions IS
  'Server-created hosted checkout attempts. Provider webhooks are the source of truth for activation.';
COMMENT ON TABLE public.billing_webhook_events IS
  'Idempotency and audit log for signed payment-provider webhook deliveries.';
