-- Sol.52 Phase 1 — Subscriptions, usage, trial abuse prevention (no payment gateway).

-- ── Organizations: trial flag ───────────────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_consumed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_email text NULL;

COMMENT ON COLUMN public.organizations.trial_consumed IS
  'True once this org has ever started a trial — prevents re-trial on same org.';

-- ── Plan catalog ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text        NOT NULL UNIQUE,
  name              text        NOT NULL,
  price_inr_monthly integer     NOT NULL DEFAULT 0,
  price_inr_yearly  integer     NULL,
  max_users         integer     NOT NULL DEFAULT 1,
  max_proposals_per_month integer NULL,
  features          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  is_active         boolean     NOT NULL DEFAULT true,
  sort_order        integer     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscription_plans IS
  'Billing plan catalog — Trial, Starter, Pro, Business. Payment gateway links in Phase 2.';

-- ── Active subscription per org (one row per org; history in billing_events) ─
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid        NOT NULL UNIQUE
                                      REFERENCES public.organizations (id) ON DELETE CASCADE,
  plan_id               uuid        NOT NULL
                                      REFERENCES public.subscription_plans (id),
  status                text        NOT NULL DEFAULT 'trialing'
                                      CHECK (status IN (
                                        'trialing', 'active', 'past_due',
                                        'cancelled'
                                      )),
  trial_ends_at         timestamptz NULL,
  trial_proposals_used  integer     NOT NULL DEFAULT 0,
  current_period_start  timestamptz NULL,
  current_period_end    timestamptz NULL,
  provider              text        NULL,
  provider_subscription_id text     NULL,
  provider_customer_id  text        NULL,
  cancel_at_period_end  boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_subscriptions_org_idx
  ON public.organization_subscriptions (organization_id);

CREATE INDEX IF NOT EXISTS organization_subscriptions_status_idx
  ON public.organization_subscriptions (status);

-- ── Monthly usage counters ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_usage (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NOT NULL
                                    REFERENCES public.organizations (id) ON DELETE CASCADE,
  period_yyyy_mm      text        NOT NULL,
  proposals_created   integer     NOT NULL DEFAULT 0,
  users_active        integer     NOT NULL DEFAULT 0,
  api_calls           integer     NOT NULL DEFAULT 0,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_usage_org_period_unique
    UNIQUE (organization_id, period_yyyy_mm)
);

CREATE INDEX IF NOT EXISTS organization_usage_org_period_idx
  ON public.organization_usage (organization_id, period_yyyy_mm DESC);

-- ── Billing audit log ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NULL
                                  REFERENCES public.organizations (id) ON DELETE SET NULL,
  event_type        text        NOT NULL,
  payload           jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_org_idx
  ON public.billing_events (organization_id, created_at DESC);

-- ── Trial abuse prevention ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trial_identities (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NULL
                                    REFERENCES public.organizations (id) ON DELETE SET NULL,
  verified_phone      text        NULL,
  verified_email      text        NULL,
  device_fingerprint  text        NULL,
  signup_ip           inet        NULL,
  trial_used_at       timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trial_identities_phone_unique
  ON public.trial_identities (verified_phone)
  WHERE verified_phone IS NOT NULL AND verified_phone <> '';

CREATE UNIQUE INDEX IF NOT EXISTS trial_identities_email_unique
  ON public.trial_identities (verified_email)
  WHERE verified_email IS NOT NULL AND verified_email <> '';

CREATE INDEX IF NOT EXISTS trial_identities_fingerprint_idx
  ON public.trial_identities (device_fingerprint)
  WHERE device_fingerprint IS NOT NULL AND device_fingerprint <> '';

CREATE INDEX IF NOT EXISTS trial_identities_ip_idx
  ON public.trial_identities (signup_ip);

COMMENT ON TABLE public.trial_identities IS
  'Tracks verified phone/email/device that consumed a trial (blocks repeat abuse). signup_ip is analytics-only.';

-- ── Seed plans ────────────────────────────────────────────────────────────────
INSERT INTO public.subscription_plans (code, name, price_inr_monthly, price_inr_yearly, max_users, max_proposals_per_month, features, sort_order)
VALUES
  (
    'trial',
    'Trial',
    0,
    NULL,
    1,
    NULL,
    '{
      "residential_theme_keys": ["classic", "ledger", "pearl", "golden"],
      "all_residential_themes": false,
      "commercial_proposals": true,
      "pdf_export": true,
      "watermark": true,
      "max_proposals_total": 10,
      "trial_days": 14,
      "max_users": 1,
      "team_members_enabled": false,
      "api_webhooks": false,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    0
  ),
  (
    'starter',
    'Starter',
    1499,
    NULL,
    1,
    50,
    '{
      "all_residential_themes": true,
      "commercial_proposals": true,
      "pdf_export": true,
      "watermark": false,
      "max_proposals_total": null,
      "trial_days": null,
      "max_users": 1,
      "team_members_enabled": false,
      "api_webhooks": false,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    1
  ),
  (
    'pro',
    'Pro',
    3499,
    NULL,
    5,
    NULL,
    '{
      "all_residential_themes": true,
      "commercial_proposals": true,
      "pdf_export": true,
      "watermark": false,
      "max_proposals_total": null,
      "trial_days": null,
      "max_users": 5,
      "team_members_enabled": true,
      "api_webhooks": false,
      "white_label": false,
      "priority_support": false
    }'::jsonb,
    2
  ),
  (
    'business',
    'Business',
    7999,
    NULL,
    15,
    NULL,
    '{
      "all_residential_themes": true,
      "commercial_proposals": true,
      "pdf_export": true,
      "watermark": false,
      "max_proposals_total": null,
      "trial_days": null,
      "max_users": 15,
      "team_members_enabled": true,
      "api_webhooks": true,
      "white_label": false,
      "priority_support": true
    }'::jsonb,
    3
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_inr_monthly = EXCLUDED.price_inr_monthly,
  max_users = EXCLUDED.max_users,
  max_proposals_per_month = EXCLUDED.max_proposals_per_month,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ── RLS (service role until JWT policies) ───────────────────────────────────
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_identities ENABLE ROW LEVEL SECURITY;
