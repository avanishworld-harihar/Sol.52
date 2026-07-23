/**
 * Design Studio Phase 3 — Engineering Rules (advisory validation).
 * Deterministic checks on roof + panel layout. Does not block save.
 */

import type {
  PanelMountingType,
  PanelOrientation,
  PanelSpec,
  PlacedPanel,
} from "@/lib/panel-layout";
import type { RoofGeometry, SiteObstruction } from "@/lib/site-layout";
import {
  buildBuildablePolygons,
  footprintCentroid,
  footprintInsideBuildable,
  panelPitchMeters,
} from "@/components/site-layout/core/panel-placement";
import {
  moduleLengthForOrientationM,
  recommendedRowPitchM,
} from "@/lib/design-studio-engineering";

export type EngineeringSeverity = "error" | "warn" | "info";

export type EngineeringWarning = {
  id: string;
  severity: EngineeringSeverity;
  title: string;
  detail: string;
  panelIds?: string[];
};

export type EngineeringRulesInput = {
  roof: RoofGeometry | null;
  obstructions: SiteObstruction[];
  panels: PlacedPanel[];
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  setbackFt: number;
  tiltDeg: number;
  mountingType: PanelMountingType;
  latitudeDeg: number;
  /** Live max DC from fill-max estimate (kW). */
  maxDcCapacityKw?: number;
  /** Target plant size when packing to target (kW). */
  targetKw?: number | null;
  packMode?: "target_kw" | "fill_max";
  panelGapMm?: number;
};

function metersBetweenCentroids(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number }
): number {
  const midLat = (a.lat + b.lat) / 2;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = Math.max(1, 111_320 * Math.cos((midLat * Math.PI) / 180));
  const dLatM = (b.lat - a.lat) * metersPerDegLat;
  const dLngM = (b.lng - a.lng) * metersPerDegLng;
  return Math.hypot(dLatM, dLngM);
}

/**
 * Run Phase 3 layout engineering checks. Sorted: error → warn → info.
 */
export function evaluateEngineeringRules(input: EngineeringRulesInput): EngineeringWarning[] {
  const warnings: EngineeringWarning[] = [];
  const {
    roof,
    obstructions,
    panels,
    panelSpec,
    orientation,
    setbackFt,
    tiltDeg,
    mountingType,
    latitudeDeg,
    maxDcCapacityKw,
    targetKw,
    packMode,
    panelGapMm = 20,
  } = input;

  if (!roof) {
    return [
      {
        id: "no-roof",
        severity: "info",
        title: "No roof drawn",
        detail: "Draw a roof section before engineering validation can run.",
      },
    ];
  }

  if (panels.length === 0) {
    warnings.push({
      id: "no-panels",
      severity: "info",
      title: "No panels placed",
      detail: "Run Auto layout or place panels to validate setbacks and stringing.",
    });
  }

  const clearanceFt = 1;
  const buildables = buildBuildablePolygons(roof, obstructions, setbackFt, clearanceFt);
  const outsideIds: string[] = [];

  for (const panel of panels) {
    const sectionIndex = Math.min(
      Math.max(0, panel.section_index),
      Math.max(0, buildables.length - 1)
    );
    const buildable = buildables[sectionIndex] ?? buildables[0];
    if (!buildable) {
      outsideIds.push(panel.id);
      continue;
    }
    if (!footprintInsideBuildable(panel.footprint_geojson, buildable)) {
      outsideIds.push(panel.id);
    }
  }

  if (outsideIds.length > 0) {
    warnings.push({
      id: "panels-outside-buildable",
      severity: "error",
      title: `${outsideIds.length} panel${outsideIds.length === 1 ? "" : "s"} outside buildable area`,
      detail:
        setbackFt > 0
          ? `Outside edge setback (${setbackFt} ft) and/or obstruction keep-outs. Move or re-pack.`
          : "Outside roof / obstruction keep-outs. Move panels fully onto the roof.",
      panelIds: outsideIds,
    });
  }

  if (setbackFt < 0.5 && panels.length > 0) {
    warnings.push({
      id: "low-setback",
      severity: "warn",
      title: "Edge setback is very low",
      detail: `Current setback ${setbackFt} ft. Typical rooftop edge clearance is 1–1.5 ft (local code may require more).`,
    });
  }

  // Elevated / ground: check consecutive rows meet recommended winter pitch.
  if (
    panels.length >= 2 &&
    (mountingType === "elevated" || mountingType === "ground_mount")
  ) {
    const lengthM = moduleLengthForOrientationM(
      panelSpec.width_mm,
      panelSpec.height_mm,
      orientation
    );
    const requiredPitch = recommendedRowPitchM({
      tiltDeg,
      moduleLengthM: lengthM,
      latitudeDeg,
      mounting: mountingType,
    });
    const flushPitch = panelPitchMeters(panelSpec, orientation, panelGapMm).pitchY;
    const minAccept = Math.max(flushPitch, requiredPitch * 0.92);

    const bySection = new Map<number, PlacedPanel[]>();
    for (const panel of panels) {
      const list = bySection.get(panel.section_index) ?? [];
      list.push(panel);
      bySection.set(panel.section_index, list);
    }

    const tightIds = new Set<string>();
    for (const sectionPanels of bySection.values()) {
      const sorted = [...sectionPanels].sort(
        (a, b) => a.row_index - b.row_index || a.col_index - b.col_index
      );
      for (let i = 0; i < sorted.length; i += 1) {
        const a = sorted[i]!;
        for (let j = i + 1; j < sorted.length; j += 1) {
          const b = sorted[j]!;
          if (b.row_index !== a.row_index + 1) continue;
          if (b.col_index !== a.col_index) continue;
          const ca = footprintCentroid(a.footprint_geojson);
          const cb = footprintCentroid(b.footprint_geojson);
          if (!ca || !cb) continue;
          const dist = metersBetweenCentroids(ca, cb);
          if (dist + 0.02 < minAccept) {
            tightIds.add(a.id);
            tightIds.add(b.id);
          }
        }
      }
    }

    if (tightIds.size > 0) {
      warnings.push({
        id: "row-pitch-tight",
        severity: "warn",
        title: "Inter-row spacing may be tight",
        detail: `Recommended front-to-front ≈ ${requiredPitch.toFixed(2)} m for ${tiltDeg}° ${mountingType} at this latitude. Some adjacent rows are closer — expect more winter self-shade.`,
        panelIds: [...tightIds],
      });
    }
  }

  if (
    packMode === "target_kw" &&
    targetKw != null &&
    targetKw > 0 &&
    maxDcCapacityKw != null &&
    maxDcCapacityKw > 0 &&
    targetKw > maxDcCapacityKw + 0.05
  ) {
    warnings.push({
      id: "target-above-max",
      severity: "warn",
      title: "Target exceeds roof max",
      detail: `Target ${targetKw.toFixed(2)} kW is above estimated max ~${maxDcCapacityKw.toFixed(2)} kW after setback/keep-outs.`,
    });
  }

  const dcKw = (panels.length * panelSpec.wattage) / 1000;
  if (panels.length > 0 && dcKw >= 10) {
    warnings.push({
      id: "commercial-scale-hint",
      severity: "info",
      title: "Larger plant — review stringing",
      detail: `${dcKw.toFixed(1)} kW DC. Confirm inverter MPPT limits and cable sizing before install.`,
    });
  }

  const locked = panels.filter((p) => p.is_locked).length;
  if (locked > 0 && locked < panels.length) {
    warnings.push({
      id: "partial-lock",
      severity: "info",
      title: `${locked} locked panel${locked === 1 ? "" : "s"}`,
      detail: "Auto layout preserves locked panels; unlocked panels can still be re-packed.",
    });
  }

  const rank: Record<EngineeringSeverity, number> = { error: 0, warn: 1, info: 2 };
  return warnings.sort((a, b) => rank[a.severity] - rank[b.severity] || a.id.localeCompare(b.id));
}
