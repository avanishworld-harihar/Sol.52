-- 063_keep_golden_and_zenith_presets.sql
-- Keep only Golden (residential_executive) and Zenith (residential_zenith).
-- Remap all other preset_id values, then tighten the check constraint.

UPDATE proposals
SET preset_id = 'residential_executive'
WHERE preset_id IS DISTINCT FROM 'residential_executive'
  AND preset_id IS DISTINCT FROM 'residential_zenith';

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_preset_id_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_preset_id_check
  CHECK (preset_id IN (
    'residential_executive',
    'residential_zenith'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith';
