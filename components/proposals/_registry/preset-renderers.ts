/**
 * Dynamic preset renderer registry.
 * Active presets: Golden + Zenith + Atelier + Canvas (blueprint id) + Commercial Executive.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { PresetRendererLoader, PresetRendererRegistry } from "@/components/proposals/_registry/types";

/** Local / mock aliases that resolve to Zenith. */
export const ZENITH_PRESET_ALIASES = ["residential_zenith", "zenith"] as const;

/** Local / mock aliases that resolve to Premium Luxe. */
export const LUXE_PRESET_ALIASES = [
  "residential_premium_luxe",
  "premium_luxe",
  "luxe",
] as const;

/** Local / mock aliases that resolve to Blueprint. */
export const BLUEPRINT_PRESET_ALIASES = [
  "residential_blueprint",
  "blueprint",
  "investment_blueprint",
] as const;

export function isZenithPresetId(presetId: string): boolean {
  return (ZENITH_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isLuxePresetId(presetId: string): boolean {
  return (LUXE_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isBlueprintPresetId(presetId: string): boolean {
  return (BLUEPRINT_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isCommercialPresetId(presetId: string): boolean {
  return presetId === "commercial_executive";
}

export function isHtCommercialPresetId(presetId: string): boolean {
  return presetId === "commercial_ht" || presetId === "ht_commercial";
}

export const PRESET_RENDERER_LOADERS: PresetRendererRegistry = {
  residential_executive: () =>
    import("@/components/proposals/_registry/adapters/golden-adapter"),
  residential_zenith: () =>
    import("@/components/proposals/_registry/adapters/zenith-adapter"),
  residential_premium_luxe: () =>
    import("@/components/proposals/_registry/adapters/premium-luxe-adapter"),
  residential_blueprint: () =>
    import("@/components/proposals/_registry/adapters/blueprint-adapter"),
  commercial_executive: () =>
    import("@/components/proposals/_registry/adapters/commercial-adapter"),
  commercial_ht: () =>
    import("@/components/proposals/_registry/adapters/ht-commercial-adapter"),
};

/**
 * Resolve a renderer loader for a preset id.
 * Unknown / removed ids fall back to Golden.
 */
export function getPresetRendererLoader(
  presetId: ProposalPresetId | string
): PresetRendererLoader {
  if (isHtCommercialPresetId(String(presetId))) {
    return () => import("@/components/proposals/_registry/adapters/ht-commercial-adapter");
  }
  if (isCommercialPresetId(String(presetId))) {
    return () => import("@/components/proposals/_registry/adapters/commercial-adapter");
  }
  if (isZenithPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/zenith-adapter");
  }
  if (isLuxePresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/premium-luxe-adapter");
  }
  if (isBlueprintPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/blueprint-adapter");
  }
  const loader = PRESET_RENDERER_LOADERS[presetId as ProposalPresetId];
  if (loader) return loader;
  return () => import("@/components/proposals/_registry/adapters/golden-adapter");
}
