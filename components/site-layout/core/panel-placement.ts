import area from "@turf/area";
import bbox from "@turf/bbox";
import booleanDisjoint from "@turf/boolean-disjoint";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
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

function subtractObstructions(
  buildable: Buildable,
  obstructions: SiteObstruction[],
  clearanceFt: number
): Buildable {
  let next = buildable;
  for (const obstruction of obstructions) {
    const hole = obstructionCircle(obstruction, clearanceFt);
    if (!hole) continue;
    try {
      const cut = difference(featureCollection([next, hole]));
      if (cut?.geometry) next = cut as Buildable;
    } catch {
      // Keep previous buildable if difference fails.
    }
  }
  return next;
}

/**
 * One buildable polygon per roof section (same index order).
 * Falls back to the raw roof section if setback erosion fails.
 */
export function buildBuildablePolygons(
  roof: RoofGeometry,
  obstructions: SiteObstruction[],
  setbackFt = 1.5,
  clearanceFt = 1
): Array<Buildable | null> {
  const setbackM = Math.max(0, setbackFt) * FT_TO_M;
  const sections = roofGeometryToPolygons(roof);

  return sections.map((section) => {
    const feature = toFeaturePolygon(section);
    if (!feature) return null;

    let buildable: Buildable | null = feature;
    if (setbackM > 0) {
      try {
        const eroded = buffer(feature, -setbackM, { units: "meters" }) as Buildable | null;
        if (eroded?.geometry) buildable = eroded;
      } catch {
        buildable = feature;
      }
    }

    if (!buildable?.geometry) return null;
    return subtractObstructions(buildable, obstructions, clearanceFt);
  });
}

function panelFootprint(
  centerLng: number,
  centerLat: number,
  widthM: number,
  heightM: number
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
    const dest = destination(origin, dist, localBearing, { units: "meters" });
    return dest.geometry.coordinates;
  });
  ring.push([...ring[0]!]);

  try {
    return { type: "Polygon", coordinates: [ring] };
  } catch {
    return null;
  }
}

function footprintInsideBuildable(
  footprint: RoofPolygon,
  buildable: Buildable
): boolean {
  const ring = footprint.coordinates[0]?.slice(0, -1) ?? [];
  if (ring.length < 3) return false;
  // Require every corner + center inside. More reliable than booleanContains on curved buffers.
  const centerLng = ring.reduce((sum, p) => sum + p[0]!, 0) / ring.length;
  const centerLat = ring.reduce((sum, p) => sum + p[1]!, 0) / ring.length;
  const samples: number[][] = [...ring, [centerLng, centerLat]];
  return samples.every((coord) =>
    booleanPointInPolygon(point(coord as [number, number]), buildable)
  );
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
  sectionIndex: number;
  buildable: Buildable;
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  panelGapMm: number;
  preservePanels: PlacedPanel[];
}): PlacedPanel[] {
  const { sectionIndex, buildable, panelSpec, orientation, panelGapMm, preservePanels } = args;
  const shortM = panelSpec.width_mm * MM_TO_M;
  const longM = panelSpec.height_mm * MM_TO_M;
  // Portrait = long side north-south (common rooftop mounting).
  const widthM = orientation === "landscape" ? longM : shortM;
  const heightM = orientation === "landscape" ? shortM : longM;
  const gapM = Math.max(0, panelGapMm) * MM_TO_M;
  const pitchX = widthM + gapM;
  const pitchY = heightM + gapM;

  const [minX, minY, maxX, maxY] = bbox(buildable);
  const midLat = (minY + maxY) / 2;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = Math.max(1, 111_320 * Math.cos((midLat * Math.PI) / 180));

  const widthMTotal = Math.max(0, (maxX - minX) * metersPerDegLng);
  const heightMTotal = Math.max(0, (maxY - minY) * metersPerDegLat);
  if (widthMTotal < widthM || heightMTotal < heightM) return [];

  const cols = Math.max(1, Math.floor((widthMTotal + gapM) / pitchX));
  const rows = Math.max(1, Math.floor((heightMTotal + gapM) / pitchY));
  const panels: PlacedPanel[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const centerLng = minX + ((col + 0.5) * pitchX) / metersPerDegLng;
      const centerLat = minY + ((row + 0.5) * pitchY) / metersPerDegLat;
      const footprint = panelFootprint(centerLng, centerLat, widthM, heightM);
      if (!footprint) continue;
      if (!footprintInsideBuildable(footprint, buildable)) continue;

      let candidate: Feature<GeoPolygon>;
      try {
        candidate = polygon(footprint.coordinates);
      } catch {
        continue;
      }
      if (footprintOverlapsPreserve(candidate, preservePanels)) continue;

      panels.push({
        id: newPanelId(sectionIndex, row, col),
        footprint_geojson: footprint,
        section_index: sectionIndex,
        row_index: row,
        col_index: col,
        rotation_deg: 0,
        is_locked: false,
        is_manually_placed: false,
      });
    }
  }

  return panels;
}

function packAllSections(args: {
  roof: RoofGeometry;
  obstructions: SiteObstruction[];
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  setbackFt: number;
  clearanceFt: number;
  panelGapMm: number;
  preservePanels: PlacedPanel[];
}): { panels: PlacedPanel[]; buildables: Array<Buildable | null> } {
  const sections = roofGeometryToPolygons(args.roof);
  const buildables = buildBuildablePolygons(
    args.roof,
    args.obstructions,
    args.setbackFt,
    args.clearanceFt
  );
  const packed: PlacedPanel[] = [...args.preservePanels];

  sections.forEach((_, sectionIndex) => {
    const buildable = buildables[sectionIndex];
    if (!buildable) return;
    packed.push(
      ...packSection({
        sectionIndex,
        buildable,
        panelSpec: args.panelSpec,
        orientation: args.orientation,
        panelGapMm: args.panelGapMm,
        preservePanels: args.preservePanels,
      })
    );
  });

  return { panels: packed, buildables };
}

export function autoPackPanels(input: AutoPackInput): AutoPackResult {
  const setbackFt = input.setbackFt ?? 1.5;
  const clearanceFt = input.obstructionClearanceFt ?? 1;
  const panelGapMm = input.panelGapMm ?? 20;
  const preservePanels = (input.preservePanels ?? []).filter((panel) => panel.is_locked);

  let { panels: packed, buildables } = packAllSections({
    roof: input.roof,
    obstructions: input.obstructions,
    panelSpec: input.panelSpec,
    orientation: input.orientation,
    setbackFt,
    clearanceFt,
    panelGapMm,
    preservePanels,
  });

  // If setback was too aggressive for this roof size, retry once with 0 setback.
  if (packed.length === preservePanels.length && setbackFt > 0) {
    const retry = packAllSections({
      roof: input.roof,
      obstructions: input.obstructions,
      panelSpec: input.panelSpec,
      orientation: input.orientation,
      setbackFt: 0,
      clearanceFt,
      panelGapMm,
      preservePanels,
    });
    packed = retry.panels;
    buildables = retry.buildables;
  }

  const roofMetrics = calculateRoofMetrics(input.roof);
  const buildableAreaSqm = buildables.reduce(
    (sum, feature) => sum + (feature ? Math.max(0, area(feature)) : 0),
    0
  );
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
