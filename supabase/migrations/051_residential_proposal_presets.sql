-- 051_residential_proposal_presets.sql
-- Extend proposals.preset_id CHECK constraint to include the three new
-- residential preset values introduced by the Residential Proposal Presets
-- feature (Phase 1).
--
-- Existing values are preserved unchanged:
--   'residential_smart'   → Residential Legacy (rendered via legacy ProposalView)
--   'commercial_executive'
--
-- New values added:
--   'residential_sales_premium' → Sales Premium (new default for new proposals)
--   'residential_bank_loan'     → Bank Loan Pack (Phase 3, architecture placeholder)
--   'residential_executive'     → Executive Premium (Phase 4, architecture placeholder)
--
-- This migration is additive — all existing rows retain their preset_id.

ALTER TABLE proposals
  DROP CONSTRAINT IF EXISTS proposals_preset_id_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_preset_id_check
  CHECK (preset_id IN (
    'residential_smart',
    'commercial_executive',
    'residential_sales_premium',
    'residential_bank_loan',
    'residential_executive'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_smart (legacy) | commercial_executive | residential_sales_premium | residential_bank_loan | residential_executive';
