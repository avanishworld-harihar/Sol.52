/**
 * Dynamic preset renderer registry.
 * Active presets: Golden + Zenith + Atelier + Canvas + Quantum + Emerald + Lumina + Sienna + Khadi + Commercial.
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

/** Local / mock aliases that resolve to Lumina. */
export const LUMINA_PRESET_ALIASES = [
  "residential_lumina",
  "lumina",
] as const;

/** Local / mock aliases that resolve to Sienna. */
export const SIENNA_PRESET_ALIASES = [
  "residential_sienna",
  "sienna",
] as const;

/** Local / mock aliases that resolve to Khadi. */
export const KHADI_PRESET_ALIASES = [
  "residential_khadi",
  "khadi",
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

export function isLuminaPresetId(presetId: string): boolean {
  return (LUMINA_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isSiennaPresetId(presetId: string): boolean {
  return (SIENNA_PRESET_ALIASES as readonly string[]).includes(presetId);
}

export function isKhadiPresetId(presetId: string): boolean {
  return (KHADI_PRESET_ALIASES as readonly string[]).includes(presetId);
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
  residential_lumina: () =>
    import("@/components/proposals/_registry/adapters/lumina-adapter"),
  residential_sienna: () =>
    import("@/components/proposals/_registry/adapters/sienna-adapter"),
  residential_khadi: () =>
    import("@/components/proposals/_registry/adapters/khadi-adapter"),
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
  if (isLuminaPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/lumina-adapter");
  }
  if (isSiennaPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/sienna-adapter");
  }
  if (isKhadiPresetId(presetId)) {
    return () => import("@/components/proposals/_registry/adapters/khadi-adapter");
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
