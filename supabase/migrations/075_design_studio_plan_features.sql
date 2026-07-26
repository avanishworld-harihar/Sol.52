-- ============================================================
-- Migration 075: Design Studio / SLD plan feature flags
-- Proposal-only (starter): design_studio + sld false
-- Trial / Pro / Business: both true (Design + SLD packs outside proposal)
-- ============================================================

UPDATE public.subscription_plans
SET features = features || '{"design_studio": true, "sld": true}'::jsonb
WHERE code IN ('trial', 'pro', 'business');

UPDATE public.subscription_plans
SET features = features || '{"design_studio": false, "sld": false}'::jsonb
WHERE code = 'starter';
