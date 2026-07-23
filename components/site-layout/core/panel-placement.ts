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

export type PanelPackMode = "target_kw" | "fill_max";

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
  /** Default target_kw when targetKw is set; otherwise fill_max. */
  packMode?: PanelPackMode;
  /** Desired DC plant size (kW). Used when packMode is target_kw. */
  targetKw?: number;
  /**
   * Front-to-front row pitch (m). When set (elevated / ground), overrides
   * height+gap for the Y packing step to leave inter-row shade clearance.
   */
  rowPitchM?: number;
};

export type AutoPackResult = {
  panels: PlacedPanel[];
  panelCount: number;
  dcCapacityKw: number;
  /** Uncapped pack size after setback + obstruction keep-out. */
  maxPanelCount: number;
  maxDcCapacityKw: number;
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

/** Minimum keep-out radius by type (ft). Tiny saved values still pack/avoid with this floor. */
export const MIN_OBSTRUCTION_RADIUS_FT: Record<SiteObstruction["type"], number> = {
  water_tank: 3.5,
  tree: 8,
  chimney: 2,
  parapet: 1,
  other: 2,
};

export function effectiveObstructionRadiusFt(obstruction: SiteObstruction): number {
  const stored = obstruction.radius_ft ?? 0;
  // Tiny UI values (e.g. 0.25 ft) still need a real footprint so panels avoid the object.
  return Math.max(stored, MIN_OBSTRUCTION_RADIUS_FT[obstruction.type] ?? 2);
}

function obstructionCircle(
  obstruction: SiteObstruction,
  clearanceFt: number
): Feature<GeoPolygon> | null {
  const radiusFt = effectiveObstructionRadiusFt(obstruction) + Math.max(0, clearanceFt);
  if (radiusFt <= 0) return null;
  try {
    return circle([obstruction.lng, obstruction.lat], radiusFt * FT_TO_M, {
      units: "meters",
      steps: 48,
    });
  } catch {
    return null;
  }
}

function intersectsAnyObstruction(
  candidate: Feature<GeoPolygon>,
  obstructions: SiteObstruction[],
  clearanceFt: number
): boolean {
  for (const obstruction of obstructions) {
    const hole = obstructionCircle(obstruction, clearanceFt);
    if (!hole) continue;
    try {
      if (!booleanDisjoint(candidate, hole)) return true;
    } catch {
      // ignore
    }
  }
  return false;
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

export function footprintCentroid(footprint: RoofPolygon): { lng: number; lat: number } | null {
  const ring = footprint.coordinates[0]?.slice(0, -1) ?? [];
  if (ring.length < 3) return null;
  const lng = ring.reduce((sum, p) => sum + p[0]!, 0) / ring.length;
  const lat = ring.reduce((sum, p) => sum + p[1]!, 0) / ring.length;
  return { lng, lat };
}

export function translateFootprint(
  footprint: RoofPolygon,
  dLng: number,
  dLat: number
): RoofPolygon {
  return {
    type: "Polygon",
    coordinates: [
      footprint.coordinates[0].map(([lng, lat]) => [lng + dLng, lat + dLat]),
    ],
  };
}

/**
 * Rotate a panel footprint around a geographic pivot.
 * deltaDeg: positive = east (clockwise from north in map view terms for
 * east/west plant yaw); negative = west.
 */
export function rotateFootprint(
  footprint: RoofPolygon,
  pivotLng: number,
  pivotLat: number,
  deltaDeg: number
): RoofPolygon {
  if (!Number.isFinite(deltaDeg) || Math.abs(deltaDeg) < 1e-9) return footprint;
  const ring = footprint.coordinates[0];
  if (!ring || ring.length < 3) return footprint;

  const rad = (deltaDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const nextRing = ring.map(([lng, lat]) => {
    const { eastM, northM } = deltaDegreesToMeters(pivotLat, lng - pivotLng, lat - pivotLat);
    // Rotate in local EN frame: +deltaDeg turns toward east (clockwise when N is up).
    const east2 = eastM * cos + northM * sin;
    const north2 = -eastM * sin + northM * cos;
    const { dLng, dLat } = metersToDeltaDegrees(pivotLat, east2, north2);
    return [pivotLng + dLng, pivotLat + dLat] as [number, number];
  });

  // Ensure closed ring
  if (nextRing.length > 0) {
    const first = nextRing[0]!;
    const last = nextRing[nextRing.length - 1]!;
    if (first[0] !== last[0] || first[1] !== last[1]) {
      nextRing.push([first[0], first[1]]);
    }
  }

  return { type: "Polygon", coordinates: [nextRing] };
}

/** Plant centroid of unlocked panels (fallback: all panels). */
export function plantCentroid(panels: PlacedPanel[]): { lng: number; lat: number } | null {
  const pool = panels.filter((p) => !p.is_locked);
  const use = pool.length > 0 ? pool : panels;
  if (use.length === 0) return null;
  let sumLng = 0;
  let sumLat = 0;
  let n = 0;
  for (const panel of use) {
    const c = footprintCentroid(panel.footprint_geojson);
    if (!c) continue;
    sumLng += c.lng;
    sumLat += c.lat;
    n += 1;
  }
  if (n === 0) return null;
  return { lng: sumLng / n, lat: sumLat / n };
}

/**
 * Rigid-rotate panels around their group centroid.
 * - If `panelIds` is provided, only those panels rotate (unlocked ones).
 * - Otherwise unlocked panels rotate (legacy whole-plant behavior).
 * Locked panels stay put. Updates rotation_deg and marks manually placed.
 */
export function rotatePlacedPanels(
  panels: PlacedPanel[],
  deltaDeg: number,
  panelIds?: string[]
): PlacedPanel[] {
  if (!Number.isFinite(deltaDeg) || Math.abs(deltaDeg) < 1e-9) return panels;
  const idSet = panelIds && panelIds.length > 0 ? new Set(panelIds) : null;
  const targets = panels.filter(
    (p) => !p.is_locked && (idSet === null || idSet.has(p.id))
  );
  if (targets.length === 0) return panels;
  const pivot = plantCentroid(targets);
  if (!pivot) return panels;
  const targetIds = new Set(targets.map((p) => p.id));

  return panels.map((panel) => {
    if (!targetIds.has(panel.id)) return panel;
    const nextRot = ((panel.rotation_deg + deltaDeg) % 360 + 540) % 360 - 180;
    return {
      ...panel,
      footprint_geojson: rotateFootprint(
        panel.footprint_geojson,
        pivot.lng,
        pivot.lat,
        deltaDeg
      ),
      rotation_deg: Math.round(nextRot * 10) / 10,
      is_manually_placed: true,
    };
  });
}

export function panelPitchMeters(
  panelSpec: PanelSpec,
  orientation: Exclude<PanelOrientation, "east_west">,
  panelGapMm = 20
): { widthM: number; heightM: number; pitchX: number; pitchY: number } {
  const shortM = panelSpec.width_mm * MM_TO_M;
  const longM = panelSpec.height_mm * MM_TO_M;
  const widthM = orientation === "landscape" ? longM : shortM;
  const heightM = orientation === "landscape" ? shortM : longM;
  const gapM = Math.max(0, panelGapMm) * MM_TO_M;
  return {
    widthM,
    heightM,
    pitchX: widthM + gapM,
    pitchY: heightM + gapM,
  };
}

function metersToDeltaDegrees(lat: number, eastM: number, northM: number): { dLng: number; dLat: number } {
  const metersPerDegLat = 111_320;
  const metersPerDegLng = Math.max(1, 111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    dLng: eastM / metersPerDegLng,
    dLat: northM / metersPerDegLat,
  };
}

function deltaDegreesToMeters(
  lat: number,
  dLng: number,
  dLat: number
): { eastM: number; northM: number } {
  const metersPerDegLat = 111_320;
  const metersPerDegLng = Math.max(1, 111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    eastM: dLng * metersPerDegLng,
    northM: dLat * metersPerDegLat,
  };
}

function quantize(value: number, step: number): number {
  if (step <= 1e-9) return value;
  return Math.round(value / step) * step;
}

/**
 * Snap a dragged panel onto the pitch grid of nearby panels,
 * or quantize free translation to pitch when alone.
 * Returns translation from the panel's pre-drag footprint to the snapped position.
 */
export function snapPanelMove(args: {
  moved: PlacedPanel;
  /** Footprint after drag (before snap). */
  movedFootprint: RoofPolygon;
  /** Other panels that stay put (not in the moving set). */
  anchors: PlacedPanel[];
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  panelGapMm?: number;
  /** Max distance (m) to consider an anchor for alignment. */
  snapRadiusM?: number;
}): { dLng: number; dLat: number } {
  const start = footprintCentroid(args.moved.footprint_geojson);
  const end = footprintCentroid(args.movedFootprint);
  if (!start || !end) return { dLng: 0, dLat: 0 };

  const { pitchX, pitchY } = panelPitchMeters(
    args.panelSpec,
    args.orientation,
    args.panelGapMm ?? 20
  );
  const snapRadiusM = args.snapRadiusM ?? Math.max(pitchX, pitchY) * 2.5;

  let bestAnchor: { lng: number; lat: number } | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const panel of args.anchors) {
    const c = footprintCentroid(panel.footprint_geojson);
    if (!c) continue;
    const d = deltaDegreesToMeters(end.lat, end.lng - c.lng, end.lat - c.lat);
    const dist = Math.hypot(d.eastM, d.northM);
    if (dist < bestDist) {
      bestDist = dist;
      bestAnchor = c;
    }
  }

  let desiredLng = end.lng;
  let desiredLat = end.lat;

  if (bestAnchor && bestDist <= snapRadiusM) {
    const rel = deltaDegreesToMeters(end.lat, end.lng - bestAnchor.lng, end.lat - bestAnchor.lat);
    const snapped = metersToDeltaDegrees(
      bestAnchor.lat,
      quantize(rel.eastM, pitchX),
      quantize(rel.northM, pitchY)
    );
    desiredLng = bestAnchor.lng + snapped.dLng;
    desiredLat = bestAnchor.lat + snapped.dLat;
  } else {
    const raw = deltaDegreesToMeters(start.lat, end.lng - start.lng, end.lat - start.lat);
    const snapped = metersToDeltaDegrees(
      start.lat,
      quantize(raw.eastM, pitchX),
      quantize(raw.northM, pitchY)
    );
    desiredLng = start.lng + snapped.dLng;
    desiredLat = start.lat + snapped.dLat;
  }

  return {
    dLng: desiredLng - start.lng,
    dLat: desiredLat - start.lat,
  };
}

/** Snap a newly placed panel center onto nearby panel pitch grid (or no-op). */
export function snapNewPanelFootprint(args: {
  footprint: RoofPolygon;
  anchors: PlacedPanel[];
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  panelGapMm?: number;
}): RoofPolygon {
  const center = footprintCentroid(args.footprint);
  if (!center || args.anchors.length === 0) return args.footprint;
  const ghost: PlacedPanel = {
    id: "ghost",
    footprint_geojson: translateFootprint(args.footprint, -1e-7, -1e-7),
    section_index: 0,
    row_index: 0,
    col_index: 0,
    rotation_deg: 0,
    is_locked: false,
    is_manually_placed: true,
  };
  const snapped = snapPanelMove({
    moved: ghost,
    movedFootprint: args.footprint,
    anchors: args.anchors,
    panelSpec: args.panelSpec,
    orientation: args.orientation,
    panelGapMm: args.panelGapMm,
  });
  return translateFootprint(ghost.footprint_geojson, snapped.dLng, snapped.dLat);
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
  rowPitchM?: number;
  preservePanels: PlacedPanel[];
  obstructions: SiteObstruction[];
  clearanceFt: number;
}): PlacedPanel[] {
  const {
    sectionIndex,
    buildable,
    panelSpec,
    orientation,
    panelGapMm,
    rowPitchM,
    preservePanels,
    obstructions,
    clearanceFt,
  } = args;
  const shortM = panelSpec.width_mm * MM_TO_M;
  const longM = panelSpec.height_mm * MM_TO_M;
  // Portrait = long side north-south (common rooftop mounting).
  const widthM = orientation === "landscape" ? longM : shortM;
  const heightM = orientation === "landscape" ? shortM : longM;
  const gapM = Math.max(0, panelGapMm) * MM_TO_M;
  const pitchX = widthM + gapM;
  const pitchY = Math.max(heightM + gapM, rowPitchM ?? 0);

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
      if (intersectsAnyObstruction(candidate, obstructions, clearanceFt)) continue;

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
  rowPitchM?: number;
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
        rowPitchM: args.rowPitchM,
        preservePanels: args.preservePanels,
        obstructions: args.obstructions,
        clearanceFt: args.clearanceFt,
      })
    );
  });

  return { panels: packed, buildables };
}

export function autoPackPanels(input: AutoPackInput): AutoPackResult {
  const setbackFt = input.setbackFt ?? 1.5;
  const clearanceFt = input.obstructionClearanceFt ?? 1;
  const panelGapMm = input.panelGapMm ?? 20;
  const rowPitchM = input.rowPitchM;
  const preservePanels = (input.preservePanels ?? []).filter((panel) => panel.is_locked);
  const wattage = Math.max(1, input.panelSpec.wattage);

  let { panels: packed, buildables } = packAllSections({
    roof: input.roof,
    obstructions: input.obstructions,
    panelSpec: input.panelSpec,
    orientation: input.orientation,
    setbackFt,
    clearanceFt,
    panelGapMm,
    rowPitchM,
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
      rowPitchM,
      preservePanels,
    });
    packed = retry.panels;
    buildables = retry.buildables;
  }

  const maxPanelCount = packed.length;
  const maxDcCapacityKw = (maxPanelCount * wattage) / 1_000;

  const packMode =
    input.packMode ??
    (input.targetKw != null && input.targetKw > 0 ? "target_kw" : "fill_max");

  if (packMode === "target_kw" && input.targetKw != null && input.targetKw > 0) {
    const targetCount = Math.ceil((input.targetKw * 1000) / wattage);
    const locked = packed.filter((panel) => panel.is_locked);
    const unlocked = packed.filter((panel) => !panel.is_locked);
    const unlockedQuota = Math.max(0, targetCount - locked.length);
    packed = [...locked, ...unlocked.slice(0, unlockedQuota)];
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
  const dcCapacityKw = (panelCount * wattage) / 1_000;

  return {
    panels: packed,
    panelCount,
    dcCapacityKw,
    maxPanelCount,
    maxDcCapacityKw,
    remainingAreaSqft,
    coveragePct,
    buildableAreaSqft,
  };
}

/** Estimate max DC kW on this roof (fill pack, no target truncate). */
export function estimateMaxDcCapacity(input: Omit<AutoPackInput, "packMode" | "targetKw">): {
  maxPanelCount: number;
  maxDcCapacityKw: number;
  buildableAreaSqft: number;
} {
  const result = autoPackPanels({ ...input, packMode: "fill_max" });
  return {
    maxPanelCount: result.maxPanelCount,
    maxDcCapacityKw: result.maxDcCapacityKw,
    buildableAreaSqft: result.buildableAreaSqft,
  };
}

/** Build a single panel footprint centered on a map click (manual place). */
export function createManualPanelAt(args: {
  lng: number;
  lat: number;
  panelSpec: PanelSpec;
  orientation: Exclude<PanelOrientation, "east_west">;
  sectionIndex?: number;
}): PlacedPanel | null {
  const shortM = args.panelSpec.width_mm * MM_TO_M;
  const longM = args.panelSpec.height_mm * MM_TO_M;
  const widthM = args.orientation === "landscape" ? longM : shortM;
  const heightM = args.orientation === "landscape" ? shortM : longM;
  const footprint = panelFootprint(args.lng, args.lat, widthM, heightM);
  if (!footprint) return null;
  return {
    id: `p-manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    footprint_geojson: footprint,
    section_index: args.sectionIndex ?? 0,
    row_index: 0,
    col_index: 0,
    rotation_deg: 0,
    is_locked: false,
    is_manually_placed: true,
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
