/**
 * Design Studio — Engineering SLD sheet model (v1+).
 * Built from panel layout + stringing estimate. Not for customer proposal.
 */

import type { PanelSpec } from "@/lib/panel-layout";
import type { StringingEstimate } from "@/lib/design-studio-stringing";

export type SldStringRow = {
  stringNo: number;
  modules: number;
  inverterNo: number;
  mpptNo: number;
  /** Cold-temp string Voc (planning). */
  stringVocMaxV: number;
  /** Approx string Vmp STC. */
  stringVmpV: number;
  /** Approx string Imp STC. */
  stringImpA: number;
  /** Suggested DC fuse / MCB per string. */
  dcFuseA: number;
  dcKwp: number;
};

export type SldEarthingPoint = {
  id: string;
  duty: string;
  conductor: string;
};

export type SldProtectionItem = {
  location: string;
  device: string;
  rating: string;
};

export type DesignStudioSldModel = {
  title: string;
  projectName: string;
  drawingNo: string;
  drawnDate: string;
  status: "Preliminary" | "Information" | "Approval" | "Good for Construction";
  latitudeDeg: number | null;
  longitudeDeg: number | null;
  azimuthDeg: number | null;
  moduleTiltDeg: number;
  moduleLabel: string;
  moduleWatt: number;
  moduleCount: number;
  moduleVocV: number;
  moduleVmpV: number;
  moduleImpA: number;
  moduleIscA: number;
  dcCapacityKwp: number;
  acCapacityKw: number;
  injectionVoltageV: number;
  phaseLabel: "1φ" | "3φ";
  systemFrequencyHz: number;
  dcAcRatio: number;
  designVocColdV: number;
  inverterMaxVocV: number;
  mpptCount: number;
  stringing: StringingEstimate;
  strings: SldStringRow[];
  dcCableNote: string;
  acCableNote: string;
  earthCableNote: string;
  laNote: string;
  earthingNote: string;
  earthingPoints: SldEarthingPoint[];
  protectionSchedule: SldProtectionItem[];
  equipmentBom: [string, string][];
  designNotes: string[];
  disclaimer: string;
};

/** Balance panels across strings (e.g. 15 @ 8 → [8, 7]). */
export function distributeStringSizes(panelCount: number, modulesPerString: number): number[] {
  const count = Math.max(0, Math.floor(panelCount));
  const mps = Math.max(1, Math.floor(modulesPerString));
  if (count <= 0) return [];
  const stringCount = Math.max(1, Math.ceil(count / mps));
  const base = Math.floor(count / stringCount);
  const rem = count % stringCount;
  return Array.from({ length: stringCount }, (_, i) => base + (i < rem ? 1 : 0));
}

function moduleLabel(spec: PanelSpec): string {
  const brand = spec.manufacturer?.trim() || "Generic";
  const model = spec.model?.trim();
  return model ? `${brand} ${model} ${spec.wattage} Wp` : `${brand} ${spec.wattage} Wp`;
}

/** Typical mono / TOPCon STC Vmp by wattage band (planning). */
export function assumedModuleVmpV(wattage: number): number {
  if (wattage >= 540) return 41.5;
  if (wattage >= 450) return 34.5;
  if (wattage >= 370) return 34;
  return 32.5;
}

export function assumedModuleImpA(wattage: number, vmpV: number): number {
  if (vmpV <= 0) return 0;
  return Math.round((wattage / vmpV) * 100) / 100;
}

export function assumedModuleIscA(impA: number): number {
  return Math.round(impA * 1.08 * 100) / 100;
}

const FUSE_STEPS = [6, 8, 10, 12, 15, 16, 20, 25, 32, 40, 50, 63];
const MCB_STEPS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100];

function nextRating(amps: number, steps: number[]): number {
  const need = Math.max(0, amps);
  return steps.find((s) => s >= need) ?? steps[steps.length - 1]!;
}

function dcCableSqmm(impA: number): number {
  // ~1.5× Imp continuous, Cu PVC rooftop run (planning).
  const design = impA * 1.5;
  if (design <= 10) return 4;
  if (design <= 16) return 6;
  if (design <= 25) return 10;
  return 16;
}

function acCableSqmm(amps: number): number {
  if (amps <= 16) return 4;
  if (amps <= 25) return 6;
  if (amps <= 40) return 10;
  return 16;
}

export function buildDesignStudioSldModel(opts: {
  projectName: string;
  panelSpec: PanelSpec;
  stringing: StringingEstimate;
  panelTiltDeg: number;
  latitudeDeg?: number | null;
  longitudeDeg?: number | null;
  azimuthDeg?: number | null;
  injectionVoltageV?: number;
}): DesignStudioSldModel {
  const { stringing, panelSpec } = opts;
  const moduleVocV = stringing.assumedVocV;
  const moduleVmpV = assumedModuleVmpV(panelSpec.wattage);
  const moduleImpA = assumedModuleImpA(panelSpec.wattage, moduleVmpV);
  const moduleIscA = assumedModuleIscA(moduleImpA);
  const designVocColdV = Math.round(moduleVocV * 1.15 * 10) / 10;

  const sizes = distributeStringSizes(stringing.panelCount, stringing.modulesPerString);
  const mpptCount = Math.min(2, Math.max(1, sizes.length));
  const strings: SldStringRow[] = sizes.map((modules, index) => {
    const stringVocMaxV = Math.round(modules * designVocColdV * 10) / 10;
    const stringVmpV = Math.round(modules * moduleVmpV * 10) / 10;
    const stringImpA = moduleImpA;
    const dcFuseA = nextRating(moduleIscA * 1.25, FUSE_STEPS);
    return {
      stringNo: index + 1,
      modules,
      inverterNo: 1,
      mpptNo: (index % mpptCount) + 1,
      stringVocMaxV,
      stringVmpV,
      stringImpA,
      dcFuseA,
      dcKwp: Math.round(((modules * panelSpec.wattage) / 1000) * 1000) / 1000,
    };
  });

  const threePhase = stringing.suggestedInverterKw > 6;
  const injectionVoltageV = opts.injectionVoltageV ?? (threePhase ? 415 : 230);
  const phaseLabel: "1φ" | "3φ" = threePhase ? "3φ" : "1φ";
  const acLineAmps = threePhase
    ? (stringing.suggestedInverterKw * 1000) / (Math.sqrt(3) * injectionVoltageV * 0.95)
    : (stringing.suggestedInverterKw * 1000) / (injectionVoltageV * 0.95);
  const acMcbA = nextRating(acLineAmps * 1.25, MCB_STEPS);
  const acSfuA = nextRating(acLineAmps * 1.5, MCB_STEPS);
  const dcSqmm = dcCableSqmm(moduleImpA);
  const acSqmm = acCableSqmm(acLineAmps * 1.25);
  const maxStringFuse = Math.max(...strings.map((s) => s.dcFuseA), 10);

  const kwLabel =
    stringing.dcKw >= 10
      ? `${stringing.dcKw.toFixed(1)}kW`
      : `${stringing.dcKw.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}kW`;

  const today = new Date();
  const drawnDate = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const earthingPoints: SldEarthingPoint[] = [
    { id: "EP-1", duty: "Module / structure body", conductor: "6 Sq.mm Cu / 25×3 GI" },
    { id: "EP-2", duty: "Inverter PE / DCDB body", conductor: "6 Sq.mm Cu" },
    { id: "EP-3", duty: "ACDB / meter / SFU body", conductor: "6 Sq.mm Cu" },
    { id: "EP-4", duty: "Lightning arrester (LA)", conductor: "25×3 GI strip" },
  ];

  const protectionSchedule: SldProtectionItem[] = [
    {
      location: "DCDB (per string)",
      device: "gPV fuse / DC MCB",
      rating: `${maxStringFuse} A · 1000 V DC`,
    },
    {
      location: "DCDB",
      device: "Type II DC SPD",
      rating: "1000 V DC · In 20 kA",
    },
    {
      location: "Inverter AC out",
      device: `${phaseLabel} MCB`,
      rating: `${acMcbA} A · 10 kA · ${injectionVoltageV} V`,
    },
    {
      location: "ACDB",
      device: "Type II AC SPD",
      rating: `${injectionVoltageV} V · In 20 kA`,
    },
    {
      location: "Grid isolation",
      device: `${phaseLabel} SFU`,
      rating: `${acSfuA} A`,
    },
  ];

  const equipmentBom: [string, string][] = [
    ["PV modules", `${stringing.panelCount} Nos · ${panelSpec.wattage} Wp`],
    ["Inverter", `INV-1 · ~${stringing.suggestedInverterKw.toFixed(1)} kW · ${mpptCount} MPPT`],
    ["DCDB", `1 Nos · ${stringing.stringCount} string in · SPD + fuse`],
    ["ACDB", `1 Nos · ${acMcbA} A MCB + AC SPD`],
    ["Solar meter", `${phaseLabel} · ${injectionVoltageV} V`],
    ["SFU / isolator", `${phaseLabel} · ${acSfuA} A`],
    ["LA", "1 Nos · roof / parapet — EP-4"],
    ["Earth pits", "4 Nos · EP-1…EP-4"],
  ];

  return {
    title: `SINGLE LINE DIAGRAM OF ${kwLabel} ROOFTOP SPV SYSTEM`,
    projectName: opts.projectName.trim() || "Untitled project",
    drawingNo: `SLD-DS-${stringing.panelCount}P-${Math.round(stringing.dcKw * 1000)}`,
    drawnDate,
    status: "Preliminary",
    latitudeDeg: opts.latitudeDeg ?? null,
    longitudeDeg: opts.longitudeDeg ?? null,
    azimuthDeg: opts.azimuthDeg ?? null,
    moduleTiltDeg: opts.panelTiltDeg,
    moduleLabel: moduleLabel(panelSpec),
    moduleWatt: panelSpec.wattage,
    moduleCount: stringing.panelCount,
    moduleVocV,
    moduleVmpV,
    moduleImpA,
    moduleIscA,
    dcCapacityKwp: stringing.dcKw,
    acCapacityKw: stringing.suggestedInverterKw,
    injectionVoltageV,
    phaseLabel,
    systemFrequencyHz: 50,
    dcAcRatio: stringing.dcAcRatio,
    designVocColdV,
    inverterMaxVocV: stringing.inverterMaxVocV,
    mpptCount,
    stringing,
    strings,
    dcCableNote: `1C × ${dcSqmm} Sq.mm Cu XLPE/PVC · UV · ${stringing.stringCount} run(s) (+/−)`,
    acCableNote: threePhase
      ? `4C × ${acSqmm} Sq.mm Cu PVC · ${injectionVoltageV} V ${phaseLabel}`
      : `2C × ${acSqmm} Sq.mm Cu PVC · ${injectionVoltageV} V ${phaseLabel}`,
    earthCableNote: "6 Sq.mm Cu (equip) · 25×3 GI (LA / pit)",
    laNote: "Early streamer / conventional spike — bond to EP-4",
    earthingNote: "Separate DC / AC / LA earth preferred · ≤1 Ω target (local DISCOM)",
    earthingPoints,
    protectionSchedule,
    equipmentBom,
    designNotes: [
      `Module Voc≈${moduleVocV} V · Vmp≈${moduleVmpV} V · Imp≈${moduleImpA} A · Isc≈${moduleIscA} A (assumed STC).`,
      `Cold Voc factor 1.15 → design string Voc must stay ≤ ${stringing.inverterMaxVocV} V MPPT.`,
      `DC/AC ≈ ${stringing.dcAcRatio} · verify inverter datasheet, ambient derate, and cable length voltage drop.`,
      `All ratings are planning estimates — not a signed GFC. Confirm with OEM datasheets & local electrical code.`,
    ],
    disclaimer:
      "PROVISIONAL — auto-generated from Design Studio panel layout & planning stringing. Not a signed / GFC drawing. Verify with module & inverter datasheets before construction. SLD pack is separate from the customer proposal.",
  };
}
