-- 060_residential_horizon_preset.sql
-- Allow residential_horizon in proposals.preset_id (Horizon 11-page A4 masterplan renderer).

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
    'residential_energy_freedom',
    'residential_horizon'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_smart | commercial_executive | residential_sales_premium | residential_bank_loan | residential_executive | residential_aurora (legacy) | residential_solstice | residential_energy_freedom | residential_horizon';
