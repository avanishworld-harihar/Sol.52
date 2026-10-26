import area from "@turf/area";
import bearing from "@turf/bearing";
import centroid from "@turf/centroid";
import length from "@turf/length";
import { lineString, multiPolygon, polygon } from "@turf/helpers";
import type { RoofGeometry, RoofPolygon } from "@/lib/site-layout";

const SQM_TO_SQFT = 10.7639104167;

export type RoofMetrics = {
  areaSqm: number;
  areaSqft: number;
  perimeterM: number;
  azimuthDeg: number | null;
  center: { lat: number; lng: number };
};

export function roofGeometryToPolygons(roof: RoofGeometry): RoofPolygon[] {
  if (roof.type === "Polygon") return [roof];
  return roof.coordinates.map((coordinates) => ({ type: "Polygon", coordinates }));
}

export function polygonsToRoofGeometry(polygons: RoofPolygon[]): RoofGeometry | null {
  if (polygons.length === 0) return null;
  if (polygons.length === 1) return polygons[0];
  return {
    type: "MultiPolygon",
    coordinates: polygons.map((section) => section.coordinates),
  };
}

export function calculateRoofMetrics(roof: RoofGeometry): RoofMetrics {
  const sections = roofGeometryToPolygons(roof);
  const feature =
    roof.type === "Polygon"
      ? polygon(roof.coordinates)
      : multiPolygon(roof.coordinates);
  const areaSqm = Math.max(0, area(feature));
  const perimeterM =
    sections.reduce(
      (sum, section) =>
        sum + length(lineString(section.coordinates[0]), { units: "kilometers" }),
      0
    ) * 1000;
  const centerPoint = centroid(feature).geometry.coordinates;
  // Use the longest exterior edge across every roof section. The old first-edge
  // shortcut made azimuth depend on where the installer happened to start drawing.
  let longestEdgeKm = 0;
  let rawBearing: number | null = null;
  for (const section of sections) {
    const ring = section.coordinates[0] ?? [];
    for (let index = 0; index < ring.length - 1; index += 1) {
      const start = ring[index];
      const end = ring[index + 1];
      if (!start || !end) continue;
      const edgeKm = length(lineString([start, end]), { units: "kilometers" });
      if (edgeKm <= longestEdgeKm) continue;
      longestEdgeKm = edgeKm;
      rawBearing = bearing(start as [number, number], end as [number, number]);
    }
  }
  const azimuthDeg = rawBearing == null ? null : (rawBearing + 360) % 360;

  return {
    areaSqm,
    areaSqft: areaSqm * SQM_TO_SQFT,
    perimeterM,
    azimuthDeg,
    center: { lng: centerPoint[0] ?? 0, lat: centerPoint[1] ?? 0 },
  };
}

export function normalizeRoofPolygon(value: unknown): RoofPolygon | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== "Polygon" || !Array.isArray(candidate.coordinates)) return null;
  const rings = candidate.coordinates as unknown[];
  const normalizedRings = rings.map((ring) => normalizeRing(ring));
  // Never drop a malformed interior ring: doing so would silently turn a roof
  // opening/void into usable area.
  if (normalizedRings.length === 0 || normalizedRings.some((ring) => ring === null)) {
    return null;
  }
  return { type: "Polygon", coordinates: normalizedRings as number[][][] };
}

function normalizeRing(value: unknown): number[][] | null {
  if (!Array.isArray(value)) return null;
  const points: number[][] = [];
  for (const item of value) {
    if (!Array.isArray(item) || item.length < 2) return null;
    const lng = Number(item[0]);
    const lat = Number(item[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    const previous = points[points.length - 1];
    if (previous && previous[0] === lng && previous[1] === lat) continue;
    points.push([lng, lat]);
  }
  if (points.length < 3) return null;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push([first[0]!, first[1]!]);
  }
  return points.length >= 4 ? points : null;
}

export function normalizeRoofGeometry(value: unknown): RoofGeometry | null {
  const polygonValue = normalizeRoofPolygon(value);
  if (polygonValue) return polygonValue;
  if (!value || typeof value !== "object") return null;
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== "MultiPolygon" || !Array.isArray(candidate.coordinates)) {
    return null;
  }
  const sections = candidate.coordinates
    .map((coordinates) => normalizeRoofPolygon({ type: "Polygon", coordinates }))
    .filter((section): section is RoofPolygon => section !== null);
  if (sections.length !== candidate.coordinates.length) return null;
  return polygonsToRoofGeometry(sections);
}
