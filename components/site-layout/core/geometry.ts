import area from "@turf/area";
import bearing from "@turf/bearing";
import centroid from "@turf/centroid";
import length from "@turf/length";
import { lineString, polygon } from "@turf/helpers";
import type { RoofPolygon } from "@/lib/site-layout";

const SQM_TO_SQFT = 10.7639104167;

export type RoofMetrics = {
  areaSqm: number;
  areaSqft: number;
  perimeterM: number;
  azimuthDeg: number | null;
  center: { lat: number; lng: number };
};

export function calculateRoofMetrics(roof: RoofPolygon): RoofMetrics {
  const feature = polygon(roof.coordinates);
  const areaSqm = Math.max(0, area(feature));
  const ring = roof.coordinates[0];
  const perimeterM = length(lineString(ring), { units: "kilometers" }) * 1000;
  const centerPoint = centroid(feature).geometry.coordinates;
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
