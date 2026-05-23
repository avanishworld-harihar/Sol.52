/**
 * Sol.52 canonical pricing engine — all sell prices normalize to ₹/Wp internally.
 * UI may show ₹/kW plant gross (residential) or ₹/Wp (commercial); conversions live here only.
 */

export const PRICING_ENGINE_VERSION = 1;

/** Non-DCR plant gross = 70% of DCR (30% lower). */
export const PRICING_NON_DCR_FACTOR = 0.7;

export type PanelTrack = "dcr" | "non_dcr";

/** Nominal DC Wp for a tier row (kW × 1000). */
export function nominalWpForKw(plantKw: number): number {
  return Math.max(0, plantKw) * 1000;
}

export function ratePerWpFromDcrPlantGross(dcrPlantGrossInr: number, plantKw: number): number {
  const wp = nominalWpForKw(plantKw);
  if (wp <= 0 || dcrPlantGrossInr <= 0) return 0;
  return Math.round((dcrPlantGrossInr / wp) * 100) / 100;
}

export function dcrPlantGrossFromRatePerWp(ratePerWpInr: number, plantKw: number): number {
  return Math.round(Math.max(0, ratePerWpInr) * nominalWpForKw(plantKw));
}

export function plantGrossForTrack(dcrPlantGrossInr: number, track: PanelTrack): number {
  const dcr = Math.max(0, dcrPlantGrossInr);
  return track === "dcr" ? dcr : Math.round(dcr * PRICING_NON_DCR_FACTOR);
}

export function nonDcrRatePerWpFromDcr(dcrRatePerWp: number): number {
  return Math.round(Math.max(0, dcrRatePerWp) * PRICING_NON_DCR_FACTOR * 100) / 100;
}

export function ratePerWpForTrack(dcrRatePerWp: number, track: PanelTrack): number {
  return track === "dcr" ? dcrRatePerWp : nonDcrRatePerWpFromDcr(dcrRatePerWp);
}

/** Display helper: ₹/kW plant gross from ₹/Wp (DCR). */
export function displayInrPerKwFromRatePerWp(ratePerWpInr: number, plantKw: number, track: PanelTrack = "dcr"): number {
  if (plantKw <= 0) return 0;
  return Math.round(plantGrossForTrack(dcrPlantGrossFromRatePerWp(ratePerWpInr, plantKw), track) / plantKw);
}
