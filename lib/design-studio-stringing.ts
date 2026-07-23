/**
 * Design Studio Phase 3 — basic stringing estimate (planning only).
 * Uses conservative Voc defaults when module electricals are unknown.
 */

import type { PanelSpec } from "@/lib/panel-layout";

export type StringingEstimate = {
  panelCount: number;
  dcKw: number;
  /** Suggested modules per string (STC Voc limited). */
  modulesPerString: number;
  stringCount: number;
  /** Assumed module Voc used for the calc (V). */
  assumedVocV: number;
  /** Assumed inverter MPPT max Voc (V). */
  inverterMaxVocV: number;
  /** Suggested inverter AC size (kW) at ~1.1 DC/AC. */
  suggestedInverterKw: number;
  dcAcRatio: number;
  note: string;
};

/** Typical mono PERC Voc by wattage band when catalog has no Voc. */
export function assumedModuleVocV(wattage: number): number {
  if (wattage >= 540) return 49.5;
  if (wattage >= 450) return 41.5;
  if (wattage >= 370) return 41;
  return 40;
}

/**
 * Single-MPPT residential-style stringing suggestion.
 * Not a bankable electrical design — installer must verify with datasheets.
 */
export function estimateStringing(opts: {
  panelCount: number;
  panelSpec: PanelSpec;
  /** Optional module Voc from datasheet; else assumed. */
  moduleVocV?: number | null;
  /** Inverter max DC input / MPPT Voc ceiling. Default 600 V (common 1φ). */
  inverterMaxVocV?: number;
  /** Target DC/AC ratio. */
  targetDcAc?: number;
}): StringingEstimate | null {
  const panelCount = Math.max(0, Math.floor(opts.panelCount));
  if (panelCount <= 0) return null;

  const wattage = opts.panelSpec.wattage;
  const dcKw = (panelCount * wattage) / 1000;
  const assumedVocV = opts.moduleVocV && opts.moduleVocV > 0 ? opts.moduleVocV : assumedModuleVocV(wattage);
  // Cold-temp Voc derate margin ~15%.
  const designVoc = assumedVocV * 1.15;
  const inverterMaxVocV = opts.inverterMaxVocV ?? 600;
  const modulesPerString = Math.max(1, Math.floor(inverterMaxVocV / designVoc));
  const stringCount = Math.max(1, Math.ceil(panelCount / modulesPerString));
  const targetDcAc = opts.targetDcAc ?? 1.1;
  const suggestedInverterKw = Math.round((dcKw / targetDcAc) * 10) / 10;
  const dcAcRatio = suggestedInverterKw > 0 ? Math.round((dcKw / suggestedInverterKw) * 100) / 100 : 0;

  return {
    panelCount,
    dcKw: Math.round(dcKw * 100) / 100,
    modulesPerString,
    stringCount,
    assumedVocV: Math.round(assumedVocV * 10) / 10,
    inverterMaxVocV,
    suggestedInverterKw,
    dcAcRatio,
    note: `Planning estimate · Voc≈${assumedVocV.toFixed(1)} V × 1.15 cold · max ${inverterMaxVocV} V MPPT. Verify with module & inverter datasheets.`,
  };
}
