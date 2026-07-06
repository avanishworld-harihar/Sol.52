-- 055_residential_aurora_preset.sql
-- Extend proposals.preset_id CHECK constraint to include residential_aurora.
--
-- All existing rows are unchanged.
-- residential_aurora is routed to the ProposalWebRenderer block loop
-- (same path as residential_bank_loan).

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
    'residential_aurora'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_smart (legacy) | commercial_executive | residential_sales_premium | residential_bank_loan | residential_executive | residential_aurora';
