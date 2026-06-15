/**
 * Installer-persisted inverter & wire brand lists (More → Rate card / proposal save).
 */

import type { ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import {
  RESIDENTIAL_INVERTER_PRESETS,
  RESIDENTIAL_WIRE_PRESETS,
  type ResidentialProposalConfig,
} from "@/lib/residential-requirements-schema";
import { resolveWireBrandOptions } from "@/lib/residential-deck-helpers";

function uniqNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = raw.trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

export function listInverterPresets(catalog?: ResidentialBrandCatalog | null): string[] {
  return uniqNames([...RESIDENTIAL_INVERTER_PRESETS, ...(catalog?.inverterPresets ?? [])]);
}

export function listWirePresets(catalog?: ResidentialBrandCatalog | null): string[] {
  return uniqNames([
    ...RESIDENTIAL_WIRE_PRESETS.map(wireDisplayName),
    ...(catalog?.wirePresets ?? []).map(wireDisplayName),
  ]);
}

/** Display label for wire preset id or custom name. */
export function wireDisplayName(wire: string): string {
  const w = wire.trim();
  if (!w) return "—";
  if (w.toLowerCase() === "havells") return "Havells";
  if (w.toLowerCase() === "polycab") return "Polycab";
  return w;
}

/** Stable id stored in config.pricing.wireBrandOptions (legacy polycab/havells kept). */
export function wirePresetId(label: string): string {
  const t = label.trim();
  if (!t) return "polycab";
  const low = t.toLowerCase();
  if (low === "polycab" || low === "havells") return low;
  return t;
}

export function mergeEquipmentPresetsIntoCatalog(
  catalog: ResidentialBrandCatalog
): ResidentialBrandCatalog {
  return {
    ...catalog,
    inverterPresets: listInverterPresets(catalog),
    wirePresets: listWirePresets(catalog),
  };
}

export function addInverterPresetToCatalog(
  catalog: ResidentialBrandCatalog,
  name: string
): ResidentialBrandCatalog {
  const brand = name.trim();
  if (!brand) return catalog;
  return mergeEquipmentPresetsIntoCatalog({
    ...catalog,
    inverterPresets: uniqNames([...(catalog.inverterPresets ?? []), brand]),
  });
}

export function addWirePresetToCatalog(
  catalog: ResidentialBrandCatalog,
  name: string
): ResidentialBrandCatalog {
  const label = wireDisplayName(name);
  if (!label || label === "—") return catalog;
  return mergeEquipmentPresetsIntoCatalog({
    ...catalog,
    wirePresets: uniqNames([...(catalog.wirePresets ?? []), label]),
  });
}

/** Push selected inverter/wire names into installer catalog presets before save. */
export function syncEquipmentPresetsFromConfig(
  config: ResidentialProposalConfig
): ResidentialProposalConfig {
  const base = ensureBrandCatalog(config);
  let catalog = mergeEquipmentPresetsIntoCatalog(base.brandCatalog!);

  for (const inv of config.inverterBrandOptions ?? []) {
    if (inv.brand?.trim()) catalog = addInverterPresetToCatalog(catalog, inv.brand);
  }
  for (const w of resolveWireBrandOptions(config.pricing)) {
    catalog = addWirePresetToCatalog(catalog, w);
  }

  const moduleWattPresets = config.pricing?.moduleWattPresets ?? config.brandCatalog?.moduleWattPresets;
  if (moduleWattPresets?.length) {
    catalog = { ...catalog, moduleWattPresets };
  }

  return { ...base, brandCatalog: catalog, pricing: { ...(base.pricing ?? {}), moduleWattPresets } };
}
