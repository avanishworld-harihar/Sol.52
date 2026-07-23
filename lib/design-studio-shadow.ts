/**
 * Design Studio Phase 4 — Shadow Engine (planning estimate).
 * Flat/low-pitch v1: obstruction height → ground shadow length via sun altitude.
 * Not a certified shading report.
 */

import area from "@turf/area";
import buffer from "@turf/buffer";
import destination from "@turf/destination";
import intersect from "@turf/intersect";
import { featureCollection, lineString, polygon } from "@turf/helpers";
import type { Feature, Polygon as GeoPolygon, MultiPolygon } from "geojson";
import * as SunCalc from "suncalc";
import type { PlacedPanel } from "@/lib/panel-layout";
import type { SiteObstruction } from "@/lib/site-layout";
import { effectiveObstructionRadiusFt } from "@/components/site-layout/core/panel-placement";

const FT_TO_M = 0.3048;

export type ShadowSampleId =
  | "jun21-09"
  | "jun21-12"
  | "jun21-15"
  | "dec21-09"
  | "dec21-12"
  | "dec21-15"
  | "custom";

export type ShadowSamplePreset = {
  id: Exclude<ShadowSampleId, "custom">;
  label: string;
  /** Month 1–12 */
  month: number;
  day: number;
  /** Hour in IST (0–23) */
  hourIst: number;
};

export const SHADOW_SOLSTICE_PRESETS: ShadowSamplePreset[] = [
  { id: "jun21-09", label: "21 Jun · 9 AM", month: 6, day: 21, hourIst: 9 },
  { id: "jun21-12", label: "21 Jun · 12 PM", month: 6, day: 21, hourIst: 12 },
  { id: "jun21-15", label: "21 Jun · 3 PM", month: 6, day: 21, hourIst: 15 },
  { id: "dec21-09", label: "21 Dec · 9 AM", month: 12, day: 21, hourIst: 9 },
  { id: "dec21-12", label: "21 Dec · 12 PM", month: 12, day: 21, hourIst: 12 },
  { id: "dec21-15", label: "21 Dec · 3 PM", month: 12, day: 21, hourIst: 15 },
];

/** Build a Date for calendar day + hour in Asia/Kolkata (IST). */
export function dateAtIst(year: number, month: number, day: number, hourIst: number): Date {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hourIst).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T${hh}:00:00+05:30`);
}

export function presetToDate(preset: ShadowSamplePreset, year = new Date().getFullYear()): Date {
  return dateAtIst(year, preset.month, preset.day, preset.hourIst);
}

export type SunPose = {
  /** Degrees above horizon; ≤0 means night / below horizon. */
  altitudeDeg: number;
  /** Compass bearing of sun from north, clockwise (0=N, 90=E). */
  sunBearingDeg: number;
  /** Direction shadows fall (opposite sun), 0=N. */
  shadowBearingDeg: number;
};

/**
 * SunCalc azimuth is radians from south toward west.
 * Convert to geographic bearing from north for turf destination.
 */
export function sunPoseAt(date: Date, latitudeDeg: number, longitudeDeg: number): SunPose {
  const pos = SunCalc.getPosition(date, latitudeDeg, longitudeDeg);
  const altitudeDeg = (pos.altitude * 180) / Math.PI;
  // az=0 south → bearing 180; az=π/2 west → bearing 270
  const sunBearingDeg = (((pos.azimuth * 180) / Math.PI + 180) % 360 + 360) % 360;
  const shadowBearingDeg = (sunBearingDeg + 180) % 360;
  return { altitudeDeg, sunBearingDeg, shadowBearingDeg };
}

export function shadowLengthM(heightFt: number, altitudeDeg: number): number {
  if (altitudeDeg <= 1) return Number.POSITIVE_INFINITY;
  const heightM = Math.max(0, heightFt) * FT_TO_M;
  const rad = (altitudeDeg * Math.PI) / 180;
  return heightM / Math.tan(rad);
}

type ShadowPoly = Feature<GeoPolygon | MultiPolygon>;

/**
 * Approximate ground shadow of a circular obstruction (stadium from object to tip).
 */
export function obstructionShadowPolygon(
  obstruction: SiteObstruction,
  altitudeDeg: number,
  shadowBearingDeg: number
): ShadowPoly | null {
  if (altitudeDeg <= 1) return null;
  const heightFt = Math.max(0, obstruction.height_ft ?? 0);
  if (heightFt <= 0) return null;

  const lengthM = shadowLengthM(heightFt, altitudeDeg);
  if (!Number.isFinite(lengthM) || lengthM <= 0) return null;
  // Cap extreme low-sun shadows (km-scale) for UI stability.
  const cappedM = Math.min(lengthM, 80);

  const radiusM = effectiveObstructionRadiusFt(obstruction) * FT_TO_M;
  const origin: [number, number] = [obstruction.lng, obstruction.lat];
  try {
    const tip = destination(origin, cappedM, shadowBearingDeg, { units: "meters" });
    const tipCoord = tip.geometry.coordinates as [number, number];
    const spine = lineString([origin, tipCoord]);
    const buffered = buffer(spine, Math.max(0.3, radiusM), {
      units: "meters",
      steps: 24,
    });
    return buffered as ShadowPoly | null;
  } catch {
    return null;
  }
}

export type PanelShadeResult = {
  panelId: string;
  shadeFraction: number;
};

export type ShadowAnalysisResult = {
  sampleAt: Date;
  sun: SunPose;
  panelShades: PanelShadeResult[];
  /** Mean shade fraction across panels (0–1). */
  meanShadeFraction: number;
  /** Fraction of panel area that is shade-free (1 − mean). */
  shadeFreeFraction: number;
  /** Approximate shade-free panel area (sq.ft). */
  shadeFreePanelSqft: number;
  /** Total panel footprint area (sq.ft). */
  totalPanelSqft: number;
  shadedPanelCount: number;
  disclaimer: string;
};

function panelFeature(panel: PlacedPanel): Feature<GeoPolygon> | null {
  try {
    return polygon(panel.footprint_geojson.coordinates);
  } catch {
    return null;
  }
}

/**
 * Per-panel shade fraction for one sun sample. Uses obstruction height + radius only.
 */
export function analyzePanelShadows(opts: {
  panels: PlacedPanel[];
  obstructions: SiteObstruction[];
  date: Date;
  latitudeDeg: number;
  longitudeDeg: number;
}): ShadowAnalysisResult {
  const { panels, obstructions, date, latitudeDeg, longitudeDeg } = opts;
  const sun = sunPoseAt(date, latitudeDeg, longitudeDeg);
  const disclaimer =
    "Planning estimate only — flat-roof shadow model from obstruction height. Not a certified shading report.";

  if (panels.length === 0) {
    return {
      sampleAt: date,
      sun,
      panelShades: [],
      meanShadeFraction: 0,
      shadeFreeFraction: 1,
      shadeFreePanelSqft: 0,
      totalPanelSqft: 0,
      shadedPanelCount: 0,
      disclaimer,
    };
  }

  // Night / sun below horizon → treat as fully shaded for planning.
  if (sun.altitudeDeg <= 1) {
    const panelShades = panels.map((p) => ({ panelId: p.id, shadeFraction: 1 }));
    let totalSqm = 0;
    for (const p of panels) {
      const f = panelFeature(p);
      if (f) totalSqm += area(f);
    }
    const totalPanelSqft = totalSqm * 10.7639104167;
    return {
      sampleAt: date,
      sun,
      panelShades,
      meanShadeFraction: 1,
      shadeFreeFraction: 0,
      shadeFreePanelSqft: 0,
      totalPanelSqft,
      shadedPanelCount: panels.length,
      disclaimer,
    };
  }

  const shadows: ShadowPoly[] = [];
  for (const obstruction of obstructions) {
    const shadow = obstructionShadowPolygon(
      obstruction,
      sun.altitudeDeg,
      sun.shadowBearingDeg
    );
    if (shadow?.geometry) shadows.push(shadow);
  }

  const panelShades: PanelShadeResult[] = [];
  let totalSqm = 0;
  let freeSqm = 0;
  let shadedPanelCount = 0;

  for (const panel of panels) {
    const feat = panelFeature(panel);
    if (!feat) {
      panelShades.push({ panelId: panel.id, shadeFraction: 0 });
      continue;
    }
    const panelArea = area(feat);
    if (panelArea <= 0) {
      panelShades.push({ panelId: panel.id, shadeFraction: 0 });
      continue;
    }
    totalSqm += panelArea;

    let shadedSqm = 0;
    if (shadows.length > 0) {
      for (const shadow of shadows) {
        try {
          const hit = intersect(featureCollection([feat, shadow]));
          if (hit) shadedSqm += area(hit);
        } catch {
          // ignore topology failures
        }
      }
      // Overlapping shadows can double-count; clamp.
      shadedSqm = Math.min(panelArea, shadedSqm);
    }

    const shadeFraction = Math.min(1, Math.max(0, shadedSqm / panelArea));
    if (shadeFraction > 0.05) shadedPanelCount += 1;
    freeSqm += panelArea * (1 - shadeFraction);
    panelShades.push({
      panelId: panel.id,
      shadeFraction: Math.round(shadeFraction * 1000) / 1000,
    });
  }

  const meanShadeFraction =
    panelShades.length === 0
      ? 0
      : panelShades.reduce((s, p) => s + p.shadeFraction, 0) / panelShades.length;
  const totalPanelSqft = totalSqm * 10.7639104167;
  const shadeFreePanelSqft = freeSqm * 10.7639104167;

  return {
    sampleAt: date,
    sun,
    panelShades,
    meanShadeFraction: Math.round(meanShadeFraction * 1000) / 1000,
    shadeFreeFraction: Math.round((1 - meanShadeFraction) * 1000) / 1000,
    shadeFreePanelSqft: Math.round(shadeFreePanelSqft),
    totalPanelSqft: Math.round(totalPanelSqft),
    shadedPanelCount,
    disclaimer,
  };
}

/** Map fill color for shade fraction (selected panels keep selection styling in UI). */
export function shadeFillColor(shadeFraction: number, selected: boolean, locked: boolean): string {
  if (selected) return "#1e3a8a";
  if (locked && shadeFraction < 0.05) return "#1c1917";
  if (shadeFraction >= 0.5) return "#7f1d1d";
  if (shadeFraction >= 0.2) return "#b45309";
  if (shadeFraction >= 0.05) return "#a16207";
  return locked ? "#1c1917" : "#0b1220";
}
