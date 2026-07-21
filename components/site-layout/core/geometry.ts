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
  const ring = sections[0]?.coordinates[0] ?? [];
  const first = ring[0];
  const second = ring[1];
  const rawBearing =
    first && second
      ? bearing(first as [number, number], second as [number, number])
      : null;
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
  const rings = candidate.coordinates as number[][][];
  if (!rings[0] || rings[0].length < 4) return null;
  return { type: "Polygon", coordinates: rings };
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
