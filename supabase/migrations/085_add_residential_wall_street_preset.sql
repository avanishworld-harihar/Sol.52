-- 085_add_residential_wall_street_preset.sql
-- Allow residential_wall_street (Wall Street Ledger newsprint) in proposals.preset_id.

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
    'residential_emerald',
    'residential_field',
    'residential_wall_street',
    'commercial_executive',
    'commercial_ht'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe | residential_luxe_noir | residential_blueprint | residential_quantum | residential_emerald | residential_field | residential_wall_street | commercial_executive | commercial_ht';
