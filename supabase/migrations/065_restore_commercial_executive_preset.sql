-- 065_restore_commercial_executive_preset.sql
-- Re-allow commercial_executive after 063/064 narrowed the CHECK to residential-only.

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_preset_id_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_preset_id_check
  CHECK (preset_id IN (
    'residential_executive',
    'residential_zenith',
    'residential_premium_luxe',
    'commercial_executive'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe | commercial_executive';
