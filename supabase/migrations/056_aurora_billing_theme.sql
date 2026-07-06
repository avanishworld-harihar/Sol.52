-- 056_aurora_billing_theme.sql
-- Add "aurora" to the trial plan's residential_theme_keys allow-list.
-- Starter / Pro plans already have all_residential_themes: true — no change needed.
--
-- The trial plan JSON is patched with jsonb_set so existing plan rows are
-- updated in-place without recreating the plans table.

UPDATE public.subscription_plans
SET features = jsonb_set(
  features,
  '{residential_theme_keys}',
  (features -> 'residential_theme_keys') || '["aurora"]'::jsonb
)
WHERE code = 'trial'
  AND NOT (features -> 'residential_theme_keys' @> '["aurora"]'::jsonb);

COMMENT ON TABLE public.subscription_plans IS
  'Sol.52 subscription plan catalog — updated to include aurora theme in trial allow-list (056).';
