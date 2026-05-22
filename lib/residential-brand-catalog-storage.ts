/**
 * Installer-wide residential smart catalog (kW tier prices per brand).
 * Shared across bill-based and requirement-based new proposals; survives page refresh.
 */

import {
  defaultBrandCatalog,
  type ResidentialBrandCatalog,
} from "@/lib/residential-brand-catalog";
import { residentialBrandCatalogSchema } from "@/lib/residential-requirements-schema";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

const STORAGE_KEY = "ss_residential_brand_catalog_v1";
const DRAFT_SESSION_KEY = "ss_residential_proposal_draft_id";

export const RESIDENTIAL_BRAND_CATALOG_UPDATED_EVENT = "ss-residential-brand-catalog-updated";

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
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = residentialBrandCatalogSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || !parsed.data.entries?.length) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeResidentialBrandCatalog(catalog: ResidentialBrandCatalog | undefined | null) {
  if (typeof window === "undefined" || !catalog?.entries?.length) return;
  try {
    const parsed = residentialBrandCatalogSchema.safeParse(catalog);
    if (!parsed.success) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
    window.dispatchEvent(new Event(RESIDENTIAL_BRAND_CATALOG_UPDATED_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Apply saved installer catalog onto a builder config (keeps plant kW, subsidy, etc.). */
export function mergeInstallerBrandCatalog(
  config: ResidentialProposalConfig
): ResidentialProposalConfig {
  const saved = readResidentialBrandCatalog();
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
    },
  };
}
