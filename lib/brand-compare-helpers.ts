/**
 * Two-brand comparison — pricing from Smart Catalog (brand × kW × DCR/Non-DCR).
 */

import { resolvePlantPrice } from "@/lib/plant-pricing-resolver";
import type { ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";

export type BrandCompareProposalTrack = "dcr" | "non_dcr";

export type BrandCompareSelection = {
  enabled: boolean;
  brandIdA?: string;
  brandIdB?: string;
  /** Which track row is shown on the customer proposal. */
  proposalTrack?: BrandCompareProposalTrack;
};

export type BrandCompareSide = {
  brandId: string;
  brandLabel: string;
  dcrGrossInr: number;
  nonDcrGrossInr: number;
  dcrOk: boolean;
  nonDcrOk: boolean;
};

export type BrandCompareSnapshot = {
  kw: number;
  brandA: BrandCompareSide;
  brandB: BrandCompareSide;
};

export function catalogBrandOptions(catalog: ResidentialBrandCatalog | null | undefined) {
  return (catalog?.entries ?? []).map((e) => ({ brandId: e.brandId, brand: e.brand }));
}

export function defaultBrandCompareIds(
  catalog: ResidentialBrandCatalog | null | undefined
): { brandIdA: string; brandIdB: string } {
  const entries = catalog?.entries ?? [];
  const active = catalog?.activeBrandId ?? entries[0]?.brandId ?? "";
  const brandIdB =
    entries.find((e) => e.brandId !== active)?.brandId ?? entries[1]?.brandId ?? active;
  return { brandIdA: active, brandIdB };
}

export function normalizeBrandCompareTrack(
  raw: BrandCompareSelection["proposalTrack"] | null | undefined
): BrandCompareProposalTrack {
  return raw === "non_dcr" ? "non_dcr" : "dcr";
}

export function normalizeBrandCompareSelection(
  raw: BrandCompareSelection | null | undefined,
  catalog: ResidentialBrandCatalog | null | undefined
): BrandCompareSelection & {
  brandIdA: string;
  brandIdB: string;
  proposalTrack: BrandCompareProposalTrack;
} {
  const defaults = defaultBrandCompareIds(catalog);
  const brandIdA = raw?.brandIdA?.trim() || defaults.brandIdA;
  let brandIdB = raw?.brandIdB?.trim() || defaults.brandIdB;
  if (brandIdB === brandIdA) {
    brandIdB = catalog?.entries?.find((e) => e.brandId !== brandIdA)?.brandId ?? brandIdB;
  }
  return {
    enabled: raw?.enabled === true,
    brandIdA,
    brandIdB,
    proposalTrack: normalizeBrandCompareTrack(raw?.proposalTrack),
  };
}

function sideFromCatalog(
  catalog: ResidentialBrandCatalog | null | undefined,
  brandId: string,
  kw: number
): BrandCompareSide {
  const dcr = resolvePlantPrice({ catalog, brandId, kw, mode: "dcr" });
  const nonDcr = resolvePlantPrice({ catalog, brandId, kw, mode: "non_dcr" });
  return {
    brandId,
    brandLabel: dcr.brandLabel ?? nonDcr.brandLabel ?? brandId,
    dcrGrossInr: dcr.plantGrossInr,
    nonDcrGrossInr: nonDcr.plantGrossInr,
    dcrOk: dcr.ok,
    nonDcrOk: nonDcr.ok,
  };
}

export function resolveBrandCompareSnapshot(
  catalog: ResidentialBrandCatalog | null | undefined,
  brandIdA: string,
  brandIdB: string,
  kw: number
): BrandCompareSnapshot | null {
  if (!catalog?.entries?.length || kw <= 0 || !brandIdA || !brandIdB) return null;
  return {
    kw,
    brandA: sideFromCatalog(catalog, brandIdA, kw),
    brandB: sideFromCatalog(catalog, brandIdB, kw),
  };
}
