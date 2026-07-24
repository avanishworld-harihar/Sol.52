/**
 * Design Studio — Engineering SLD sheet model (v1).
 * Built from panel layout + stringing estimate. Not for customer proposal.
 */

import type { PanelSpec } from "@/lib/panel-layout";
import type { StringingEstimate } from "@/lib/design-studio-stringing";

export type SldStringRow = {
  stringNo: number;
  modules: number;
  inverterNo: number;
  mpptNo: number;
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
  dcCapacityKwp: number;
  acCapacityKw: number;
  injectionVoltageV: number;
  stringing: StringingEstimate;
  strings: SldStringRow[];
  /** Suggested DC cable note (planning). */
  dcCableNote: string;
  acCableNote: string;
  earthingNote: string;
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
  const sizes = distributeStringSizes(stringing.panelCount, stringing.modulesPerString);
  const strings: SldStringRow[] = sizes.map((modules, index) => ({
    stringNo: index + 1,
    modules,
    inverterNo: 1,
    mpptNo: index % 2 === 0 ? 1 : 2,
  }));

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
    dcCapacityKwp: stringing.dcKw,
    acCapacityKw: stringing.suggestedInverterKw,
    injectionVoltageV: opts.injectionVoltageV ?? 230,
    stringing,
    strings,
    dcCableNote: "1R · 1C × 6 Sq.mm Cu PVC flexible (planning)",
    acCableNote: "1R · 2C × 6 Sq.mm Cu PVC flexible (planning)",
    earthingNote: "EP-1..4 · GI strip / Cu earth — verify local code",
    disclaimer:
      "PROVISIONAL — auto-generated from Design Studio panel layout & planning stringing. Not a signed / GFC drawing. Verify with module & inverter datasheets before construction. SLD pack is separate from the customer proposal.",
  };
}
