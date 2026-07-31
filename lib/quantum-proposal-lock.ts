/**
 * Quantum proposal (`residential_quantum`) — development lock.
 *
 * "Locked" means: do not edit these files while working on other presets/themes,
 * unless the user explicitly asks to change the Quantum proposal.
 *
 * Quantum is a separate residential document preset:
 * - Own package folder: `components/QuantumPreset/`
 * - Own CSS module (`Quantum.module.css`) — not shared Golden/Luxe styles
 * - Registry entry: `_registry/adapters/quantum-adapter.tsx` → `QuantumRenderer`
 * - Preset id: `residential_quantum`
 *
 * Shared inputs (ProposalData, branding settings, formatters, public route shell)
 * may still feed Quantum; do not refactor those for another theme in a way that
 * breaks Quantum. Do not edit Quantum files to fix Luxe/Golden/Sales/etc.
 *
 * Runtime isolation notes: `lib/proposal-preset-isolation.ts`.
 *
 * Users can still pick Quantum (or any residential theme) in More → Proposal templates.
 */

export const QUANTUM_PROPOSAL_PRESET_ID = "residential_quantum" as const;

/** When true, agents and contributors must not modify Quantum paths without explicit user request. */
export const QUANTUM_PROPOSAL_DEV_LOCKED = true;

/** Canonical Quantum surfaces — treat as frozen unless user says otherwise. */
export const QUANTUM_PROPOSAL_FROZEN_PATH_PREFIXES = [
  "components/QuantumPreset/",
  "components/proposals/_registry/adapters/quantum-adapter.tsx",
] as const;

export function isQuantumProposalFrozenPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return QUANTUM_PROPOSAL_FROZEN_PATH_PREFIXES.some((prefix) =>
    normalized.includes(prefix)
  );
}
