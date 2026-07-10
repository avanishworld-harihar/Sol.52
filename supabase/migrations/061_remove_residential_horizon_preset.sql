-- 061_remove_residential_horizon_preset.sql
-- Remove residential_horizon preset: migrate existing rows, then tighten check constraint.

UPDATE proposals
SET preset_id = 'residential_sales_premium'
WHERE preset_id = 'residential_horizon';

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_preset_id_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_preset_id_check
  CHECK (preset_id IN (
    'residential_smart',
    'commercial_executive',
    'residential_sales_premium',
    'residential_bank_loan',
    'residential_executive',
    'residential_aurora',
    'residential_solstice',
    'residential_energy_freedom'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_smart | commercial_executive | residential_sales_premium | residential_bank_loan | residential_executive | residential_aurora (legacy) | residential_solstice | residential_energy_freedom';
