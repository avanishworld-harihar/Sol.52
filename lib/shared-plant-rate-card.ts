/**
 * Shared plant rate card — one kW-tier catalog for residential AND commercial turnkey quotes.
 */

import { resolvePlantPrice } from "@/lib/plant-pricing-resolver";
import type { ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";
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
  const resolved = resolvePlantPrice({
    catalog: cat,
    brandId: activeId,
    kw: plantKw,
    mode: track,
  });
  return resolved.ok ? resolved.plantGrossInr : null;
}

export function plantGrossFromSharedCatalogOrFallback(
  plantKw: number,
  track: SharedPlantTrack = "dcr",
  catalog?: ResidentialBrandCatalog | null,
  brandId?: string
): number {
  return (
    plantGrossFromSharedCatalog(plantKw, track, catalog, brandId) ??
    computeGrossSystemCostInr(plantKw)
  );
}

export function commercialTrackFromPanelType(
  panelType: "DCR" | "NON_DCR" | undefined | null
): SharedPlantTrack {
  return panelType === "NON_DCR" ? "non_dcr" : "dcr";
}
