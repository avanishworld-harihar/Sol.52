-- 088_add_residential_lumina_preset.sql
-- Allow residential_lumina (Lumina clean light app UI) in proposals.preset_id.

UPDATE proposals
SET preset_id = 'residential_executive'
WHERE preset_id IS NULL
   OR preset_id NOT IN (
    'residential_executive',
    'residential_zenith',
    'residential_premium_luxe',
    'residential_luxe_noir',
    'residential_blueprint',
    'residential_quantum',
    'residential_emerald',
    'residential_field',
    'residential_wall_street',
    'residential_cyanotype',
    'residential_brutalism',
    'residential_lumina',
    'commercial_executive',
    'commercial_ht'
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
    'residential_field',
    'residential_wall_street',
    'residential_cyanotype',
    'residential_brutalism',
    'residential_lumina',
    'commercial_executive',
    'commercial_ht'
  ));

COMMENT ON COLUMN proposals.preset_id IS
  'Proposal OS preset: residential_executive | residential_zenith | residential_premium_luxe | residential_luxe_noir | residential_blueprint | residential_quantum | residential_emerald | residential_field | residential_wall_street | residential_cyanotype | residential_brutalism | residential_lumina | commercial_executive | commercial_ht';
