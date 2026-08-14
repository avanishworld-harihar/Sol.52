import {
  LEGACY_RESIDENTIAL_PRESET_FALLBACKS,
  resolvePresetId,
} from "@/lib/proposal-preset-engine";
import { getPresetRendererLoader } from "@/components/proposals/_registry/preset-renderers";

const ACTIVE_RESIDENTIAL = [
  "residential_executive",
  "residential_zenith",
  "residential_premium_luxe",
  "residential_luxe_noir",
  "residential_blueprint",
  "residential_quantum",
  "residential_emerald",
  "residential_obsidian",
  "residential_field",
] as const;

/** Structural guard: route resolution must never cross from Atelier to Canvas. */
export function validateResidentialPresetGuards(): string[] {
  const errors: string[] = [];
  for (const id of ACTIVE_RESIDENTIAL) {
    const resolved = resolvePresetId(id);
    if (resolved.presetId !== id || resolved.status !== "active") {
      errors.push(`${id} did not resolve as its active preset`);
    }
    if (typeof getPresetRendererLoader(id) !== "function") {
      errors.push(`${id} has no renderer loader`);
    }
  }

  const atelier = resolvePresetId("residential_premium_luxe");
  const canvas = resolvePresetId("residential_blueprint");
  if (atelier.presetId === canvas.presetId) {
    errors.push("Atelier and Canvas resolve to the same preset");
  }

  for (const [legacyId, expected] of Object.entries(
    LEGACY_RESIDENTIAL_PRESET_FALLBACKS
  )) {
    const resolved = resolvePresetId(legacyId);
    if (resolved.status !== "legacy" || resolved.presetId !== expected) {
      errors.push(`${legacyId} legacy fallback changed unexpectedly`);
    }
  }
  return errors;
}
