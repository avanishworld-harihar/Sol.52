/**
 * Golden proposal (`residential_executive`) — development lock.
 *
 * "Locked" means: do not edit these files while working on other presets/themes,
 * unless the user explicitly asks to change the Golden proposal.
 *
 * Runtime isolation (shared CSS / @page / commercial styles) is documented in
 * `lib/proposal-preset-isolation.ts` — follow that so other presets cannot
 * regress Golden print or layout.
 *
 * Users can still pick any residential theme in More → Proposal templates.
 */

export const GOLDEN_PROPOSAL_PRESET_ID = "residential_executive" as const;

/** When true, agents and contributors must not modify Golden paths without explicit user request. */
export const GOLDEN_PROPOSAL_DEV_LOCKED = true;

/** Canonical Golden renderer — treat as frozen unless user says otherwise. */
export const GOLDEN_PROPOSAL_FROZEN_PATH_PREFIXES = [
  "components/proposals/executive-premium-editorial/",
  "components/proposals/executive-premium-nextgen/executive-premium-nextgen-renderer.tsx",
  "lib/executive-premium-editorial/",
] as const;

export function isGoldenProposalFrozenPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return GOLDEN_PROPOSAL_FROZEN_PATH_PREFIXES.some((prefix) => normalized.includes(prefix));
}
