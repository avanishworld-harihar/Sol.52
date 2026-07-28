-- 078_add_residential_luxe_noir_preset.sql
-- Allow residential_luxe_noir (Premium Luxe — dark cinematic) in proposals.preset_id.
-- Atelier remains residential_premium_luxe (unchanged).

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
    'commercial_executive',
    'commercial_ht'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe | residential_luxe_noir | residential_blueprint | commercial_executive | commercial_ht';
