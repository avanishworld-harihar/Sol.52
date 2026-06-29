/**
 * Installer-persisted inverter & wire brand lists (More → Rate card / proposal save).
 */

import type { ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import { saveInstallerResidentialCatalog } from "@/lib/installer-rate-card-client";
import { DEFAULT_THREE_PHASE_SURCHARGE_INR, resolvePhaseSurchargeInr } from "@/lib/connection-phase-pricing";
import { resolveWireBrandOptions } from "@/lib/residential-deck-helpers";
import {
  RESIDENTIAL_INVERTER_PRESETS,
  RESIDENTIAL_WIRE_PRESETS,
  type InstallerEquipmentDefaults,
  type ResidentialProposalConfig,
  type ResidentialWireBrand,
} from "@/lib/residential-requirements-schema";

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

export function extractEquipmentDefaults(config: ResidentialProposalConfig): InstallerEquipmentDefaults {
  const base = ensureBrandCatalog(config);
  const pricing = base.pricing ?? {};
  const wireBrandOptions = resolveWireBrandOptions(pricing) as ResidentialWireBrand[];
  const panelBrandOptions = base.panelBrandOptions?.filter((p) => p.brand?.trim()).map((p) => ({ ...p }));
  const inverterBrandOptions = base.inverterBrandOptions
    ?.filter((p) => p.brand?.trim())
    .map((p) => ({ ...p }));

  return {
    ...(panelBrandOptions?.length ? { panelBrandOptions } : {}),
    ...(inverterBrandOptions?.length ? { inverterBrandOptions } : {}),
    ...(wireBrandOptions.length ? { wireBrandOptions } : {}),
    moduleWatt: base.solar.watt,
    panelTechnology: pricing.panelTechnology ?? base.solar.technology,
    panelTrack: base.solar.panelTrack,
    primaryBrandId: base.solar.brandId,
    primaryBrand: base.solar.brand,
    ...(pricing.connectionPhase ? { connectionPhase: pricing.connectionPhase } : {}),
    ...(pricing.connectionPhase === "three_phase" && resolvePhaseSurchargeInr(pricing) > 0
      ? { threePhaseSurchargeInr: resolvePhaseSurchargeInr(pricing) }
      : {}),
  };
}

/** Apply installer’s last equipment picks onto a new proposal config. */
export function applyEquipmentDefaults(
  config: ResidentialProposalConfig,
  defaults?: InstallerEquipmentDefaults | null
): ResidentialProposalConfig {
  if (!defaults) return config;

  let next: ResidentialProposalConfig = { ...config };
  const pricing = { ...(next.pricing ?? {}) };

  if (defaults.panelBrandOptions?.length) {
    next.panelBrandOptions = defaults.panelBrandOptions.map((p) => ({ ...p }));
  }
  if (defaults.inverterBrandOptions?.length) {
    next.inverterBrandOptions = defaults.inverterBrandOptions.map((p) => ({ ...p }));
  }
  if (defaults.wireBrandOptions?.length) {
    const wireBrandOptions = [...defaults.wireBrandOptions] as ResidentialWireBrand[];
    pricing.wireBrandOptions = wireBrandOptions;
    pricing.wireBrand = wireBrandOptions[0] ?? pricing.wireBrand;
  }
  if (defaults.panelTechnology?.trim()) {
    pricing.panelTechnology = defaults.panelTechnology;
    next.solar = { ...next.solar, technology: defaults.panelTechnology };
  }
  if (defaults.connectionPhase) {
    pricing.connectionPhase = defaults.connectionPhase;
  }
  if (defaults.connectionPhase === "three_phase") {
    const amt =
      defaults.threePhaseSurchargeInr != null && defaults.threePhaseSurchargeInr > 0
        ? defaults.threePhaseSurchargeInr
        : DEFAULT_THREE_PHASE_SURCHARGE_INR;
    pricing.phaseSurcharge = { enabled: true, amountInr: amt };
  }
  if (defaults.moduleWatt) {
    next.solar = { ...next.solar, watt: defaults.moduleWatt };
  }
  if (defaults.panelTrack) {
    next.solar = { ...next.solar, panelTrack: defaults.panelTrack };
  }
  if (defaults.primaryBrandId && defaults.primaryBrand) {
    next.solar = {
      ...next.solar,
      brandId: defaults.primaryBrandId,
      brand: defaults.primaryBrand,
    };
    if (next.trackCompare) {
      next.trackCompare = { ...next.trackCompare, compareBrandId: defaults.primaryBrandId };
    }
    if (next.brandCompare?.brandIdA) {
      next.brandCompare = { ...next.brandCompare, brandIdA: defaults.primaryBrandId };
    }
  }

  next.pricing = pricing;
  if (next.brandCatalog && defaults.primaryBrandId) {
    next.brandCatalog = { ...next.brandCatalog, activeBrandId: defaults.primaryBrandId };
  }

  const wireOpts = resolveWireBrandOptions(next.pricing);
  next.pricing = {
    ...(next.pricing ?? {}),
    wireBrandOptions: wireOpts,
    wireBrand: wireOpts[0] ?? next.pricing?.wireBrand ?? "polycab",
  };

  return ensureBrandCatalog(next);
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

  const equipmentDefaults = extractEquipmentDefaults(config);
  catalog = {
    ...catalog,
    equipmentDefaults,
    activeBrandId: equipmentDefaults.primaryBrandId ?? catalog.activeBrandId,
  };

  return {
    ...base,
    brandCatalog: catalog,
    pricing: { ...(base.pricing ?? {}), moduleWattPresets },
  };
}

/** Save presets + last selections to installer rate card (local + API). */
export function commitInstallerEquipmentSelections(
  config: ResidentialProposalConfig
): ResidentialProposalConfig {
  const synced = syncEquipmentPresetsFromConfig(config);
  persistEquipmentCatalog(synced.brandCatalog!);
  return synced;
}

/** Persist installer inverter/wire presets to rate card (local + API). */
export function persistEquipmentCatalog(catalog: ResidentialBrandCatalog): void {
  if (typeof window === "undefined") return;
  void saveInstallerResidentialCatalog(mergeEquipmentPresetsIntoCatalog(catalog));
}

/** Fire-and-forget persist after inline equipment edits. */
export function persistEquipmentSelectionsFromConfig(config: ResidentialProposalConfig): void {
  if (typeof window === "undefined") return;
  const synced = syncEquipmentPresetsFromConfig(ensureBrandCatalog(config));
  persistEquipmentCatalog(synced.brandCatalog!);
}
