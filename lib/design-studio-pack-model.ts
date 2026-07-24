/**
 * Design Studio Phase 5 — Design pack summary model.
 * Separate from customer proposal (Design / SLD product lock).
 */

import { panelModuleLabel } from "@/lib/panel-module-catalog";
import type { PanelMountingType, PanelOrientation, PanelSpec, PlacedPanel } from "@/lib/panel-layout";
import type { RoofGeometry, SiteObstruction } from "@/lib/site-layout";
import type { ShadowAnalysisResult } from "@/lib/design-studio-shadow";

export type DesignStudioPackModel = {
  projectName: string;
  projectId: string;
  generatedAtIso: string;
  latitudeDeg: number | null;
  longitudeDeg: number | null;
  roofAreaSqft: number | null;
  roofAzimuthDeg: number | null;
  roofType: string | null;
  obstructionCount: number;
  panelCount: number;
  dcCapacityKw: number;
  coveragePct: number;
  remainingAreaSqft: number;
  moduleLabel: string;
  orientation: PanelOrientation;
  tiltDeg: number;
  mountingType: PanelMountingType;
  setbackFt: number;
  plantRoofHeightFt: number;
  shadowSampleLabel: string | null;
  meanShadePct: number | null;
  shadeFreePanelSqft: number | null;
  annualYieldKwh: number | null;
  annualShadeLossKwh: number | null;
  disclaimer: string;
};

export function buildDesignStudioPackModel(opts: {
  projectName: string;
  projectId: string;
  center: [number, number];
  roof: RoofGeometry | null;
  roofAreaSqft: number | null;
  roofAzimuthDeg: number | null;
  roofType: string | null;
  obstructions: SiteObstruction[];
  panels: PlacedPanel[];
  panelSpec: PanelSpec;
  orientation: PanelOrientation;
  tiltDeg: number;
  mountingType: PanelMountingType;
  setbackFt: number;
  coveragePct: number;
  remainingAreaSqft: number;
  plantRoofHeightFt: number;
  shadowAnalysis: ShadowAnalysisResult | null;
  shadowSampleLabel: string | null;
  annualYieldKwh: number | null;
  annualShadeLossKwh: number | null;
}): DesignStudioPackModel {
  const panelCount = opts.panels.length;
  return {
    projectName: opts.projectName || "Project",
    projectId: opts.projectId,
    generatedAtIso: new Date().toISOString(),
    latitudeDeg: Number.isFinite(opts.center[1]) ? opts.center[1] : null,
    longitudeDeg: Number.isFinite(opts.center[0]) ? opts.center[0] : null,
    roofAreaSqft: opts.roofAreaSqft,
    roofAzimuthDeg: opts.roofAzimuthDeg,
    roofType: opts.roofType,
    obstructionCount: opts.obstructions.length,
    panelCount,
    dcCapacityKw: panelCount ? (panelCount * opts.panelSpec.wattage) / 1000 : 0,
    coveragePct: opts.coveragePct,
    remainingAreaSqft: opts.remainingAreaSqft,
    moduleLabel: panelModuleLabel(opts.panelSpec),
    orientation: opts.orientation,
    tiltDeg: opts.tiltDeg,
    mountingType: opts.mountingType,
    setbackFt: opts.setbackFt,
    plantRoofHeightFt: opts.plantRoofHeightFt,
    shadowSampleLabel: opts.shadowSampleLabel,
    meanShadePct:
      opts.shadowAnalysis != null
        ? Math.round(opts.shadowAnalysis.meanShadeFraction * 100)
        : null,
    shadeFreePanelSqft: opts.shadowAnalysis?.shadeFreePanelSqft ?? null,
    annualYieldKwh: opts.annualYieldKwh,
    annualShadeLossKwh: opts.annualShadeLossKwh,
    disclaimer:
      "Design pack — installer planning summary. Not a customer proposal. Shadow figures are planning estimates, not a certified shading report.",
  };
}
