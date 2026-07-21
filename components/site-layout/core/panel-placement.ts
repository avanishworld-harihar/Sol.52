import area from "@turf/area";
import bbox from "@turf/bbox";
import bearing from "@turf/bearing";
import booleanContains from "@turf/boolean-contains";
import booleanDisjoint from "@turf/boolean-disjoint";
import buffer from "@turf/buffer";
import circle from "@turf/circle";
import destination from "@turf/destination";
import difference from "@turf/difference";
import { featureCollection, point, polygon } from "@turf/helpers";
import type {
  Feature,
  MultiPolygon,
  Polygon as GeoPolygon,
} from "geojson";
import type {
  PanelMountingType,
  PanelOrientation,
  PanelSpec,
  PlacedPanel,
} from "@/lib/panel-layout";
import type { RoofGeometry, RoofPolygon, SiteObstruction } from "@/lib/site-layout";
import { calculateRoofMetrics, roofGeometryToPolygons } from "./geometry";

const FT_TO_M = 0.3048;
const SQM_TO_SQFT = 10.7639104167;
const MM_TO_M = 0.001;

export type AutoPackInput = {
  roof: RoofGeometry;
  obstructions: SiteObstruction[];
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  tiltDeg?: number;
  mountingType?: PanelMountingType;
  setbackFt?: number;
  walkwayFt?: number;
  panelGapMm?: number;
  obstructionClearanceFt?: number;
  /** Locked / manually kept panels are preserved and blocked during re-pack. */
  preservePanels?: PlacedPanel[];
};

export type AutoPackResult = {
  panels: PlacedPanel[];
  panelCount: number;
  dcCapacityKw: number;
  remainingAreaSqft: number;
  coveragePct: number;
  buildableAreaSqft: number;
};

type Buildable = Feature<GeoPolygon | MultiPolygon>;

function newPanelId(sectionIndex: number, row: number, col: number): string {
  return `p-${sectionIndex}-${row}-${col}-${Math.random().toString(36).slice(2, 8)}`;
}

function toFeaturePolygon(section: RoofPolygon): Feature<GeoPolygon> | null {
  try {
    return polygon(section.coordinates);
  } catch {
    return null;
  }
}

function obstructionCircle(
  obstruction: SiteObstruction,
  clearanceFt: number
): Feature<GeoPolygon> | null {
  const radiusFt = (obstruction.radius_ft ?? 0) + clearanceFt;
  if (radiusFt <= 0) return null;
  try {
    return circle([obstruction.lng, obstruction.lat], radiusFt * FT_TO_M, {
      units: "meters",
      steps: 32,
    });
  } catch {
    return null;
  }
}

/**
 * Erode each roof section by setback, then subtract obstruction footprints (+ clearance).
 */
export function buildBuildablePolygons(
  roof: RoofGeometry,
  obstructions: SiteObstruction[],
  setbackFt = 1.5,
  clearanceFt = 1
): Buildable[] {
  const setbackM = Math.max(0, setbackFt) * FT_TO_M;
  const sections = roofGeometryToPolygons(roof);
  const result: Buildable[] = [];

  for (const section of sections) {
    const feature = toFeaturePolygon(section);
    if (!feature) continue;

    let buildable: Buildable | null =
      setbackM > 0
        ? (buffer(feature, -setbackM, { units: "meters" }) as Buildable | null)
        : feature;

    if (!buildable?.geometry) continue;

    for (const obstruction of obstructions) {
      const hole = obstructionCircle(obstruction, clearanceFt);
      if (!hole) continue;
      try {
        const cut = difference(featureCollection([buildable, hole]));
        if (cut?.geometry) buildable = cut as Buildable;
      } catch {
        // Keep previous buildable if difference fails for a degenerate circle.
      }
    }

    if (buildable?.geometry) result.push(buildable);
  }

  return result;
}

function sectionAzimuthDeg(section: RoofPolygon): number {
  const ring = section.coordinates[0];
  const first = ring?.[0];
  const second = ring?.[1];
  if (!first || !second) return 0;
  return (bearing(first as [number, number], second as [number, number]) + 360) % 360;
}

function panelFootprint(
  centerLng: number,
  centerLat: number,
  widthM: number,
  heightM: number,
  rotationDeg: number
): RoofPolygon | null {
  const halfW = widthM / 2;
  const halfH = heightM / 2;
  const cornersLocal: Array<[number, number]> = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ];

  const origin = point([centerLng, centerLat]);
  const ring: number[][] = cornersLocal.map(([x, y]) => {
    const dist = Math.hypot(x, y);
    if (dist < 1e-9) return [centerLng, centerLat];
    const localBearing = (Math.atan2(x, y) * 180) / Math.PI;
    const dest = destination(origin, dist, localBearing + rotationDeg, {
      units: "meters",
    });
    return dest.geometry.coordinates;
  });
  ring.push([...ring[0]!]);

  try {
    return { type: "Polygon", coordinates: [ring] };
  } catch {
    return null;
  }
}

function footprintOverlapsPreserve(
  candidate: Feature<GeoPolygon>,
  preserved: PlacedPanel[]
): boolean {
  for (const panel of preserved) {
    try {
      const existing = polygon(panel.footprint_geojson.coordinates);
      if (!booleanDisjoint(candidate, existing)) return true;
    } catch {
      // ignore bad preserve footprints
    }
  }
  return false;
}

function packSection(args: {
  section: RoofPolygon;
  sectionIndex: number;
  buildable: Buildable;
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  panelGapMm: number;
  preservePanels: PlacedPanel[];
}): PlacedPanel[] {
  const { section, sectionIndex, buildable, panelSpec, orientation, panelGapMm, preservePanels } =
    args;
  const shortM = panelSpec.width_mm * MM_TO_M;
  const longM = panelSpec.height_mm * MM_TO_M;
  const widthM = orientation === "landscape" ? longM : shortM;
  const heightM = orientation === "landscape" ? shortM : longM;
  const gapM = Math.max(0, panelGapMm) * MM_TO_M;
  const pitchX = widthM + gapM;
  const pitchY = heightM + gapM;
  const rotationDeg = sectionAzimuthDeg(section);

  const [minX, minY, maxX, maxY] = bbox(buildable);
  const midLat = (minY + maxY) / 2;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((midLat * Math.PI) / 180);
  if (metersPerDegLng < 1) return [];

  const widthDeg = Math.max(0, maxX - minX);
  const heightDeg = Math.max(0, maxY - minY);
  const cols = Math.max(1, Math.ceil((widthDeg * metersPerDegLng) / pitchX) + 2);
  const rows = Math.max(1, Math.ceil((heightDeg * metersPerDegLat) / pitchY) + 2);

  const originLng = minX + (widthM / 2) / metersPerDegLng;
  const originLat = minY + (heightM / 2) / metersPerDegLat;
  const panels: PlacedPanel[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const eastM = col * pitchX;
      const northM = row * pitchY;
      // Rotate grid with roof edge so rows follow the longest roof side.
      const rad = (rotationDeg * Math.PI) / 180;
      const dx = eastM * Math.cos(rad) - northM * Math.sin(rad);
      const dy = eastM * Math.sin(rad) + northM * Math.cos(rad);
      const centerLng = originLng + dx / metersPerDegLng;
      const centerLat = originLat + dy / metersPerDegLat;

      const footprint = panelFootprint(centerLng, centerLat, widthM, heightM, rotationDeg);
      if (!footprint) continue;

      let candidate: Feature<GeoPolygon>;
      try {
        candidate = polygon(footprint.coordinates);
      } catch {
        continue;
      }

      if (!booleanContains(buildable, candidate)) continue;
      if (footprintOverlapsPreserve(candidate, preservePanels)) continue;

      panels.push({
        id: newPanelId(sectionIndex, row, col),
        footprint_geojson: footprint,
        section_index: sectionIndex,
        row_index: row,
        col_index: col,
        rotation_deg: rotationDeg,
        is_locked: false,
        is_manually_placed: false,
      });
    }
  }

  return panels;
}

export function autoPackPanels(input: AutoPackInput): AutoPackResult {
  const setbackFt = input.setbackFt ?? 1.5;
  const clearanceFt = input.obstructionClearanceFt ?? 1;
  const panelGapMm = input.panelGapMm ?? 20;
  const preservePanels = (input.preservePanels ?? []).filter((panel) => panel.is_locked);

  const sections = roofGeometryToPolygons(input.roof);
  const buildables = buildBuildablePolygons(
    input.roof,
    input.obstructions,
    setbackFt,
    clearanceFt
  );

  const packed: PlacedPanel[] = [...preservePanels];
  sections.forEach((section, sectionIndex) => {
    const buildable = buildables[sectionIndex];
    if (!buildable) return;
    packed.push(
      ...packSection({
        section,
        sectionIndex,
        buildable,
        panelSpec: input.panelSpec,
        orientation: input.orientation,
        panelGapMm,
        preservePanels,
      })
    );
  });

  const roofMetrics = calculateRoofMetrics(input.roof);
  const buildableAreaSqm = buildables.reduce((sum, feature) => sum + Math.max(0, area(feature)), 0);
  const buildableAreaSqft = buildableAreaSqm * SQM_TO_SQFT;
  const panelAreaSqm = packed.reduce((sum, panel) => {
    try {
      return sum + Math.max(0, area(polygon(panel.footprint_geojson.coordinates)));
    } catch {
      return sum;
    }
  }, 0);
  const panelAreaSqft = panelAreaSqm * SQM_TO_SQFT;
  const remainingAreaSqft = Math.max(0, buildableAreaSqft - panelAreaSqft);
  const coveragePct =
    roofMetrics.areaSqft > 0
      ? Math.min(100, (panelAreaSqft / roofMetrics.areaSqft) * 100)
      : 0;
  const panelCount = packed.length;
  const dcCapacityKw = (panelCount * input.panelSpec.wattage) / 1_000;

  return {
    panels: packed,
    panelCount,
    dcCapacityKw,
    remainingAreaSqft,
    coveragePct,
    buildableAreaSqft,
  };
}

/** Recompute coverage after delete/clear without re-packing. */
export function computePanelCoverageMetrics(
  roof: RoofGeometry,
  panels: PlacedPanel[]
): Pick<AutoPackResult, "remainingAreaSqft" | "coveragePct"> {
  const roofMetrics = calculateRoofMetrics(roof);
  const panelAreaSqm = panels.reduce((sum, panel) => {
    try {
      return sum + Math.max(0, area(polygon(panel.footprint_geojson.coordinates)));
    } catch {
      return sum;
    }
  }, 0);
  const panelAreaSqft = panelAreaSqm * SQM_TO_SQFT;
  return {
    remainingAreaSqft: Math.max(0, roofMetrics.areaSqft - panelAreaSqft),
    coveragePct:
      roofMetrics.areaSqft > 0
        ? Math.min(100, (panelAreaSqft / roofMetrics.areaSqft) * 100)
        : 0,
  };
}
