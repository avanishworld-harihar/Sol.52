/**
 * Shared plant rate card — one kW-tier catalog for residential AND commercial turnkey quotes.
 */

import {
  getCatalogEntry,
  lookupKwGrossForTrack,
  type ResidentialBrandCatalog,
} from "@/lib/residential-brand-catalog";
import { getCachedResidentialBrandCatalog } from "@/lib/installer-rate-card-client";
import { computeGrossSystemCostInr } from "@/lib/solar-engine";

export type SharedPlantTrack = "dcr" | "non_dcr";

function catalogFromConfigOrCache(
  catalog?: ResidentialBrandCatalog | null
): ResidentialBrandCatalog | null {
  if (catalog?.entries?.length) return catalog;
  return getCachedResidentialBrandCatalog();
}

/** Turnkey plant gross (₹) from shared kW catalog — same table as residential Smart catalog. */
export function plantGrossFromSharedCatalog(
  plantKw: number,
  track: SharedPlantTrack = "dcr",
  catalog?: ResidentialBrandCatalog | null,
  brandId?: string
): number | null {
  const cat = catalogFromConfigOrCache(catalog);
  if (!cat?.entries?.length || plantKw <= 0) return null;

  const activeId = brandId ?? cat.activeBrandId ?? cat.entries[0]?.brandId;
  const entry = getCatalogEntry(cat, activeId);
  const gross = lookupKwGrossForTrack(entry, plantKw, track);
  return gross != null && gross > 0 ? gross : null;
}

export function plantGrossFromSharedCatalogOrFallback(
  plantKw: number,
  track: SharedPlantTrack = "dcr",
  catalog?: ResidentialBrandCatalog | null
): number {
  return plantGrossFromSharedCatalog(plantKw, track, catalog) ?? computeGrossSystemCostInr(plantKw);
}

export function commercialTrackFromPanelType(
  panelType: "DCR" | "NON_DCR" | undefined | null
): SharedPlantTrack {
  return panelType === "NON_DCR" ? "non_dcr" : "dcr";
}
