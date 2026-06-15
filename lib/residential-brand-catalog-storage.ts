/**
 * Residential catalog access for proposals — backed by central installer rate card.
 */

import {
  getCachedResidentialBrandCatalog,
  saveInstallerResidentialCatalog,
} from "@/lib/installer-rate-card-client";
import {
  defaultBrandCatalog,
  type ResidentialBrandCatalog,
} from "@/lib/residential-brand-catalog";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

const DRAFT_SESSION_KEY = "ss_residential_proposal_draft_id";

export const RESIDENTIAL_BRAND_CATALOG_UPDATED_EVENT = "ss-installer-rate-card-updated";

export function readResidentialDraftProposalId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = sessionStorage.getItem(DRAFT_SESSION_KEY)?.trim();
    return id || null;
  } catch {
    return null;
  }
}

export function writeResidentialDraftProposalId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) sessionStorage.setItem(DRAFT_SESSION_KEY, id);
    else sessionStorage.removeItem(DRAFT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function readResidentialBrandCatalog(): ResidentialBrandCatalog | null {
  return getCachedResidentialBrandCatalog();
}

export function writeResidentialBrandCatalog(catalog: ResidentialBrandCatalog | undefined | null) {
  if (!catalog?.entries?.length) return;
  void saveInstallerResidentialCatalog(catalog);
}

/** Apply installer rate card onto a builder config (keeps plant kW, subsidy, etc.). */
export function mergeInstallerBrandCatalog(
  config: ResidentialProposalConfig
): ResidentialProposalConfig {
  const saved = getCachedResidentialBrandCatalog();
  const fallback = defaultBrandCatalog(config.solar.brandId ?? "adani");
  const catalog = saved?.entries?.length ? saved : fallback;
  return {
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
    },
    pricing:
      config.pricing?.moduleWattPresets?.length || !catalog.moduleWattPresets?.length
        ? config.pricing
        : {
            ...(config.pricing ?? {}),
            moduleWattPresets: [...catalog.moduleWattPresets],
          },
  };
}
