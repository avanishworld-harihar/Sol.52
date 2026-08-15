/**
 * Dynamic preset renderer registry.
 * Active presets: Golden + Zenith + Atelier + Canvas + Quantum + Emerald + Field Engineering + Commercial.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { PresetRendererLoader, PresetRendererRegistry } from "@/components/proposals/_registry/types";

/** Local / mock aliases that resolve to Zenith. */
export const ZENITH_PRESET_ALIASES = ["residential_zenith", "zenith"] as const;

/** Local / mock aliases that resolve to Premium Luxe (Atelier cream). */
export const LUXE_PRESET_ALIASES = [
  "residential_premium_luxe",
  "premium_luxe",
  "luxe",
  "atelier",
] as const;

/** Local / mock aliases that resolve to Premium Luxe noir (dark cinematic). */
export const LUXE_NOIR_PRESET_ALIASES = [
  "residential_luxe_noir",
  "luxe_noir",
  "premium_luxe_noir",
  "noir",
] as const;

/** Local / mock aliases that resolve to Blueprint. */
export const BLUEPRINT_PRESET_ALIASES = [
  "residential_blueprint",
  "blueprint",
  "investment_blueprint",
] as const;

/** Local / mock aliases that resolve to Quantum. */
export const QUANTUM_PRESET_ALIASES = [
  "residential_quantum",
  "quantum",
] as const;

/** Local / mock aliases that resolve to Emerald Signature. */
export const EMERALD_PRESET_ALIASES = [
  "residential_emerald",
  "emerald",
  "emerald_signature",
] as const;

/** Local / mock aliases that resolve to Field Engineering. */
export const FIELD_PRESET_ALIASES = [
  "residential_field",
  "field",
  "field_engineering",
] as const;

/** Local / mock aliases that resolve to Wall Street Ledger. */
export const WALL_STREET_PRESET_ALIASES = [
  "residential_wall_street",
  "wall_street",
  "wallstreet",
] as const;

/** Local / mock aliases that resolve to Cyanotype blueprint. */
export const CYANOTYPE_PRESET_ALIASES = [
  "residential_cyanotype",
  "cyanotype",
] as const;

/** Local / mock aliases that resolve to Brutalism spec. */
export const BRUTALISM_PRESET_ALIASES = [
  "residential_brutalism",
  "brutalism",
] as const;

/** Local / mock aliases that resolve to Lumina. */
export const LUMINA_PRESET_ALIASES = [
  "residential_lumina",
  "lumina",
] as const;

export function isZenithPresetId(presetId: string): boolean {
  return (ZENITH_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isLuxePresetId(presetId: string): boolean {
  return (LUXE_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isLuxeNoirPresetId(presetId: string): boolean {
  return (LUXE_NOIR_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isBlueprintPresetId(presetId: string): boolean {
  return (BLUEPRINT_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isQuantumPresetId(presetId: string): boolean {
  return (QUANTUM_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isEmeraldPresetId(presetId: string): boolean {
  return (EMERALD_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isFieldPresetId(presetId: string): boolean {
  return (FIELD_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isWallStreetPresetId(presetId: string): boolean {
  return (WALL_STREET_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isCyanotypePresetId(presetId: string): boolean {
  return (CYANOTYPE_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isBrutalismPresetId(presetId: string): boolean {
  return (BRUTALISM_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isLuminaPresetId(presetId: string): boolean {
  return (LUMINA_PRESET_ALIASES as readonly string[]).includes(presetId);
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
  residential_luxe_noir: () =>
    import("@/components/proposals/_registry/adapters/luxe-noir-adapter"),
  residential_blueprint: () =>
    import("@/components/proposals/_registry/adapters/blueprint-adapter"),
  residential_quantum: () =>
    import("@/components/proposals/_registry/adapters/quantum-adapter"),
  residential_emerald: () =>
    import("@/components/proposals/_registry/adapters/emerald-adapter"),
  residential_field: () =>
    import("@/components/proposals/_registry/adapters/field-engineering-adapter"),
  residential_wall_street: () =>
    import("@/components/proposals/_registry/adapters/wall-street-adapter"),
  residential_cyanotype: () =>
    import("@/components/proposals/_registry/adapters/cyanotype-adapter"),
  residential_brutalism: () =>
    import("@/components/proposals/_registry/adapters/brutalism-adapter"),
  residential_lumina: () =>
    import("@/components/proposals/_registry/adapters/lumina-adapter"),
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
  if (isQuantumPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/quantum-adapter");
  }
  if (isEmeraldPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/emerald-adapter");
  }
  if (isFieldPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/field-engineering-adapter");
  }
  if (isWallStreetPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/wall-street-adapter");
  }
  if (isCyanotypePresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/cyanotype-adapter");
  }
  if (isBrutalismPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/brutalism-adapter");
  }
  if (isLuminaPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/lumina-adapter");
  }
  if (isLuxeNoirPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/luxe-noir-adapter");
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
