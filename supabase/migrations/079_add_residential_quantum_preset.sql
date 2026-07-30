-- 079_add_residential_quantum_preset.sql
-- Allow residential_quantum (Cinematic Neo-Glass) in proposals.preset_id.

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_preset_id_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_preset_id_check
  CHECK (preset_id IN (
    'residential_executive',
    'residential_zenith',
    'residential_premium_luxe',
    'residential_luxe_noir',
    'residential_blueprint',
    'residential_quantum',
    'commercial_executive',
    'commercial_ht'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe | residential_luxe_noir | residential_blueprint | residential_quantum | commercial_executive | commercial_ht';
