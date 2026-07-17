-- 066_add_residential_blueprint_preset.sql
-- Allow residential_blueprint (Investment Blueprint) in proposals.preset_id.

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_preset_id_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_preset_id_check
  CHECK (preset_id IN (
    'residential_executive',
    'residential_zenith',
    'residential_premium_luxe',
    'residential_blueprint',
    'commercial_executive'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe | residential_blueprint | commercial_executive';
