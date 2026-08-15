-- 089_remove_four_residential_presets.sql
-- Remove Field Engineering, Wall Street, Cyanotype, Brutalism.
-- Remap existing rows to Golden, then tighten the check.

UPDATE proposals
SET preset_id = 'residential_executive'
WHERE preset_id IN (
  'residential_field',
  'residential_wall_street',
  'residential_cyanotype',
  'residential_brutalism'
);

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
    'residential_lumina',
    'commercial_executive',
    'commercial_ht'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe | residential_luxe_noir | residential_blueprint | residential_quantum | residential_emerald | residential_lumina | commercial_executive | commercial_ht';
