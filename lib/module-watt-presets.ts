import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { COMMERCIAL_PANEL_WATT_PRESETS } from "@/lib/commercial-bom-panels";
import { RESIDENTIAL_WATT_PRESETS } from "@/lib/residential-requirements-schema";

const MIN_WATT = 100;
const MAX_WATT = 900;
const MAX_PRESETS = 16;

function clampWatt(w: number): number {
  return Math.max(MIN_WATT, Math.min(MAX_WATT, Math.round(w)));
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.map(clampWatt))].sort((a, b) => a - b).slice(0, MAX_PRESETS);
}

export function defaultModuleWattPresets(isCommercial: boolean): number[] {
  return uniqueSorted(
    isCommercial ? [...COMMERCIAL_PANEL_WATT_PRESETS] : [...RESIDENTIAL_WATT_PRESETS]
  );
}

export function resolveModuleWattPresets(
  config: ResidentialProposalConfig,
  isCommercial: boolean
): number[] {
  const stored = config.pricing?.moduleWattPresets ?? config.brandCatalog?.moduleWattPresets;
  if (stored?.length) return uniqueSorted(stored);
  return defaultModuleWattPresets(isCommercial);
}

export function setModuleWattPresets(
  config: ResidentialProposalConfig,
  presets: number[]
): ResidentialProposalConfig {
  const moduleWattPresets = uniqueSorted(presets);
  return {
    ...config,
    pricing: {
      ...(config.pricing ?? {}),
      moduleWattPresets,
    },
    brandCatalog: config.brandCatalog
      ? { ...config.brandCatalog, moduleWattPresets }
      : config.brandCatalog,
  };
}

export function addModuleWattPreset(
  config: ResidentialProposalConfig,
  watt: number,
  isCommercial: boolean
): ResidentialProposalConfig {
  const w = clampWatt(watt);
  const next = uniqueSorted([...resolveModuleWattPresets(config, isCommercial), w]);
  return setModuleWattPresets(config, next);
}

export function removeModuleWattPreset(
  config: ResidentialProposalConfig,
  watt: number,
  isCommercial: boolean
): ResidentialProposalConfig {
  const current = resolveModuleWattPresets(config, isCommercial);
  if (current.length <= 1) return config;
  const next = current.filter((v) => v !== clampWatt(watt));
  if (next.length === 0) return config;
  return setModuleWattPresets(config, next);
}

export function replaceModuleWattPreset(
  config: ResidentialProposalConfig,
  fromWatt: number,
  toWatt: number,
  isCommercial: boolean
): ResidentialProposalConfig {
  const from = clampWatt(fromWatt);
  const to = clampWatt(toWatt);
  const current = resolveModuleWattPresets(config, isCommercial);
  const next = uniqueSorted(current.map((w) => (w === from ? to : w)));
  return setModuleWattPresets(config, next);
}

export { clampWatt as clampModuleWatt };
