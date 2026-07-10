/**
 * Dynamic preset renderer registry.
 * Active presets: Golden + Zenith only.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { PresetRendererLoader, PresetRendererRegistry } from "@/components/proposals/_registry/types";

/** Local / mock aliases that resolve to Zenith. */
export const ZENITH_PRESET_ALIASES = ["residential_zenith", "zenith"] as const;

export function isZenithPresetId(presetId: string): boolean {
  return (ZENITH_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export const PRESET_RENDERER_LOADERS: PresetRendererRegistry = {
  residential_executive: () =>
    import("@/components/proposals/_registry/adapters/golden-adapter"),
  residential_zenith: () =>
    import("@/components/proposals/_registry/adapters/zenith-adapter"),
};

/**
 * Resolve a renderer loader for a preset id.
 * Unknown / removed ids fall back to Golden.
 */
export function getPresetRendererLoader(
  presetId: ProposalPresetId | string
): PresetRendererLoader {
  if (isZenithPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/zenith-adapter");
  }
  const loader = PRESET_RENDERER_LOADERS[presetId as ProposalPresetId];
  if (loader) return loader;
  return () => import("@/components/proposals/_registry/adapters/golden-adapter");
}
