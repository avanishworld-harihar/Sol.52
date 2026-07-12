/**
 * Residential catalog access for proposals — backed by central installer rate card.
 * Draft ID helpers live in proposal-builder-draft (re-exported here for compatibility).
 */

import {
  getCachedResidentialBrandCatalog,
  saveInstallerResidentialCatalog,
} from "@/lib/installer-rate-card-client";
import {
  applyEquipmentDefaults,
} from "@/lib/residential-equipment-presets";
import {
  defaultBrandCatalog,
  type ResidentialBrandCatalog,
} from "@/lib/residential-brand-catalog";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export {
  readResidentialDraftProposalId,
  writeResidentialDraftProposalId,
} from "@/lib/proposal-builder-draft";

export const RESIDENTIAL_BRAND_CATALOG_UPDATED_EVENT = "ss-installer-rate-card-updated";

export function readResidentialBrandCatalog(): ResidentialBrandCatalog | null {
  return getCachedResidentialBrandCatalog();
}

export function writeResidentialBrandCatalog(catalog: ResidentialBrandCatalog | undefined | null) {
  if (!catalog?.entries?.length) return;
  void saveInstallerResidentialCatalog(catalog);
}

/** Apply installer rate card onto a builder config (keeps plant kW, subsidy, etc.). */
export function mergeInstallerBrandCatalogWith(
  config: ResidentialProposalConfig,
  saved: ResidentialBrandCatalog | null | undefined
): ResidentialProposalConfig {
  const fallback = defaultBrandCatalog(config.solar.brandId ?? "adani");
  const catalog = saved?.entries?.length ? saved : fallback;
  const merged: ResidentialProposalConfig = {
    ...config,
    brandCatalog: {
      activeBrandId:
        catalog.activeBrandId && catalog.entries?.some((e) => e.brandId === catalog.activeBrandId)
          ? catalog.activeBrandId
          : catalog.entries?.[0]?.brandId,
      entries: catalog.entries?.map((e) => ({
        ...e,
        kwTiers: e.kwTiers?.map((t) => ({ ...t })),
      })),
      inverterPresets: catalog.inverterPresets?.length
        ? [...catalog.inverterPresets]
        : fallback.inverterPresets,
      wirePresets: catalog.wirePresets?.length ? [...catalog.wirePresets] : fallback.wirePresets,
      moduleWattPresets: catalog.moduleWattPresets?.length
        ? [...catalog.moduleWattPresets]
        : config.brandCatalog?.moduleWattPresets,
      equipmentDefaults: catalog.equipmentDefaults
        ? { ...catalog.equipmentDefaults }
        : config.brandCatalog?.equipmentDefaults,
    },
    pricing:
      config.pricing?.moduleWattPresets?.length || !catalog.moduleWattPresets?.length
        ? config.pricing
        : {
            ...(config.pricing ?? {}),
            moduleWattPresets: [...catalog.moduleWattPresets],
          },
  };
  return applyEquipmentDefaults(merged, catalog.equipmentDefaults);
}

export function mergeInstallerBrandCatalog(
  config: ResidentialProposalConfig
): ResidentialProposalConfig {
  return mergeInstallerBrandCatalogWith(config, getCachedResidentialBrandCatalog());
}
