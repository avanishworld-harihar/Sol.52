/**
 * Atelier proposal (`residential_premium_luxe`) — development lock.
 *
 * "Locked" means: do not edit these files while working on other presets/themes,
 * unless the user explicitly asks to change the Atelier proposal.
 *
 * Runtime isolation (shared CSS / @page / commercial styles) is documented in
 * `lib/proposal-preset-isolation.ts` — follow that so other presets cannot
 * regress Atelier print or layout.
 *
 * Named `@page atelier-sheet` / `atelier-cover` / `atelier-closing` keep A4
 * print stable; do not fold Atelier into another preset's print CSS.
 *
 * Related locks: `lib/golden-proposal-lock.ts`, `lib/residential-bill-path-lock.ts`.
 *
 * Users can still pick any residential theme in More → Proposal templates.
 */

export const ATELIER_PROPOSAL_PRESET_ID = "residential_premium_luxe" as const;

/** When true, agents and contributors must not modify Atelier paths without explicit user request. */
export const ATELIER_PROPOSAL_DEV_LOCKED = true;

/** Canonical Atelier renderer + assets — treat as frozen unless user says otherwise. */
export const ATELIER_PROPOSAL_FROZEN_PATH_PREFIXES = [
  "components/proposals/atelier/",
  "public/assets/proposals/atelier-",
] as const;

export function isAtelierProposalFrozenPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return ATELIER_PROPOSAL_FROZEN_PATH_PREFIXES.some((prefix) =>
    normalized.includes(prefix)
  );
}
