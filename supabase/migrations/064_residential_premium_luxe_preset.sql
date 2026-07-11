-- 064_residential_premium_luxe_preset.sql
-- Allow residential_premium_luxe in proposals.preset_id (Premium Luxe masterplan).

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_preset_id_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_preset_id_check
  CHECK (preset_id IN (
    'residential_executive',
    'residential_zenith',
    'residential_premium_luxe'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe';
