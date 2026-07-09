-- 058_solstice_billing_theme.sql
-- Add "solstice" to the trial plan residential_theme_keys allow-list.

UPDATE public.subscription_plans
SET features = jsonb_set(
  features,
  '{residential_theme_keys}',
  (features -> 'residential_theme_keys') || '["solstice"]'::jsonb
)
WHERE code = 'trial'
  AND NOT (features -> 'residential_theme_keys' @> '["solstice"]'::jsonb);

COMMENT ON TABLE public.subscription_plans IS
  'Sol.52 subscription plan catalog — trial allow-list includes solstice (058).';
