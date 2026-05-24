/**
 * Sol.52 canonical pricing engine — all sell prices normalize to ₹/Wp internally.
 * UI may show ₹/kW plant gross (residential/commercial) or ₹/Wp (legacy BOM); conversions live here only.
 */

export const PRICING_ENGINE_VERSION = 1;

export type PanelTrack = "dcr" | "non_dcr";

/** Nominal DC Wp for a tier row (kW × 1000). */
export function nominalWpForKw(plantKw: number): number {
  return Math.max(0, plantKw) * 1000;
}

export function ratePerWpFromPlantGross(plantGrossInr: number, plantKw: number): number {
  const wp = nominalWpForKw(plantKw);
  if (wp <= 0 || plantGrossInr <= 0) return 0;
  return Math.round((plantGrossInr / wp) * 100) / 100;
}

/** @deprecated Use ratePerWpFromPlantGross — kept for call-site compatibility. */
export function ratePerWpFromDcrPlantGross(dcrPlantGrossInr: number, plantKw: number): number {
  return ratePerWpFromPlantGross(dcrPlantGrossInr, plantKw);
}

export function plantGrossFromRatePerWp(ratePerWpInr: number, plantKw: number): number {
  return Math.round(Math.max(0, ratePerWpInr) * nominalWpForKw(plantKw));
}

/** @deprecated Use plantGrossFromRatePerWp */
export function dcrPlantGrossFromRatePerWp(ratePerWpInr: number, plantKw: number): number {
  return plantGrossFromRatePerWp(ratePerWpInr, plantKw);
}

/** Pick manually entered DCR or Non-DCR plant gross for the active track. */
export function plantGrossForTrackValues(
  dcrPlantGrossInr: number,
  nonDcrPlantGrossInr: number,
  track: PanelTrack
): number {
  return track === "dcr" ? Math.max(0, dcrPlantGrossInr) : Math.max(0, nonDcrPlantGrossInr);
}

/** @deprecated Use plantGrossForTrackValues with explicit Non-DCR gross. */
export function plantGrossForTrack(dcrPlantGrossInr: number, track: PanelTrack): number {
  return plantGrossForTrackValues(dcrPlantGrossInr, 0, track);
}

export function ratePerWpForTrackValues(
  dcrRatePerWp: number,
  nonDcrRatePerWp: number,
  track: PanelTrack
): number {
  return track === "dcr" ? dcrRatePerWp : nonDcrRatePerWp;
}

/** @deprecated Use ratePerWpForTrackValues with explicit Non-DCR rate. */
export function ratePerWpForTrack(dcrRatePerWp: number, track: PanelTrack): number {
  return ratePerWpForTrackValues(dcrRatePerWp, 0, track);
}

/** Display helper: ₹/kW plant gross from ₹/Wp. */
export function displayInrPerKwFromRatePerWp(
  ratePerWpInr: number,
  plantKw: number,
  track: PanelTrack = "dcr"
): number {
  if (plantKw <= 0) return 0;
  const gross = plantGrossFromRatePerWp(ratePerWpInr, plantKw);
  return Math.round(gross / plantKw);
}
