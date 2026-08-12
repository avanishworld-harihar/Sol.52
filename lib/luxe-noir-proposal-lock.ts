/**
 * Premium Luxe Noir proposal (`residential_luxe_noir`) — development lock.
 *
 * "Locked" means: do not edit these files while working on other presets/themes,
 * unless the user explicitly asks to change the Premium Luxe (noir) proposal.
 *
 * This preset is separate from Atelier (`residential_premium_luxe` / Investment
 * Blueprint). Atelier lock: `lib/atelier-proposal-lock.ts`.
 *
 * Runtime isolation (shared CSS / @page / commercial styles) is documented in
 * `lib/proposal-preset-isolation.ts`.
 *
 * Users can still pick any residential theme in More → Proposal templates.
 */

export const LUXE_NOIR_PROPOSAL_PRESET_ID = "residential_luxe_noir" as const;

/** When true, agents and contributors must not modify Luxe Noir paths without explicit user request. */
export const LUXE_NOIR_PROPOSAL_DEV_LOCKED = true;

/** Canonical Premium Luxe (noir) renderer + assets — frozen unless user says otherwise. */
export const LUXE_NOIR_PROPOSAL_FROZEN_PATH_PREFIXES = [
  "components/proposals/luxe-noir/",
  "components/proposals/_registry/adapters/luxe-noir-adapter.tsx",
] as const;

export function isLuxeNoirProposalFrozenPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return LUXE_NOIR_PROPOSAL_FROZEN_PATH_PREFIXES.some((prefix) =>
    normalized.includes(prefix)
  );
}
