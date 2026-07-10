/**
 * Dynamic preset renderer registry.
 * Golden / existing presets are thin adapters — do not move their source trees.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { PresetRendererLoader, PresetRendererRegistry } from "@/components/proposals/_registry/types";

/** Local / mock aliases that resolve to Zenith without a DB migration. */
export const ZENITH_PRESET_ALIASES = ["residential_zenith", "zenith"] as const;

export function isZenithPresetId(presetId: string): boolean {
  return (ZENITH_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export const PRESET_RENDERER_LOADERS: PresetRendererRegistry = {
  residential_executive: () =>
    import("@/components/proposals/_registry/adapters/golden-adapter"),
  residential_solstice: () =>
    import("@/components/proposals/_registry/adapters/solstice-adapter"),
  residential_energy_freedom: () =>
    import("@/components/proposals/_registry/adapters/freedom-adapter"),
  residential_sales_premium: () =>
    import("@/components/proposals/_registry/adapters/sales-premium-adapter"),
  residential_bank_loan: () =>
    import("@/components/proposals/_registry/adapters/bank-loan-adapter"),
  residential_smart: () =>
    import("@/components/proposals/_registry/adapters/smart-adapter"),
  commercial_executive: () =>
    import("@/components/proposals/_registry/adapters/commercial-adapter"),
  residential_zenith: () =>
    import("@/components/proposals/_registry/adapters/zenith-adapter"),
};

/**
 * Resolve a renderer loader for a preset id.
 * Accepts official ProposalPresetId or local mock aliases (`zenith`, `residential_zenith`).
 * Unknown ids fall back to Sales Premium.
 */
export function getPresetRendererLoader(
  presetId: ProposalPresetId | string
): PresetRendererLoader {
  if (isZenithPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/zenith-adapter");
  }
  const loader = PRESET_RENDERER_LOADERS[presetId as ProposalPresetId];
  if (loader) return loader;
  return () => import("@/components/proposals/_registry/adapters/sales-premium-adapter");
}
