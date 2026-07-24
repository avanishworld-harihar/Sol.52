/**
 * Design Studio Phase 4 — Shadow Engine (planning estimate).
 *
 * Height model (roof-plane datum):
 * - Plant roof height AGL = how high the solar terrace is above ground.
 * - Roof-mounted objects (tank/chimney): height_ft = above roof → cast with that height.
 * - Ground objects (tree): height_ft = AGL → cast with max(0, tree_agl − plant_roof_agl).
 * Flat/low-pitch v1. Not a certified shading report.
 */

import area from "@turf/area";
import destination from "@turf/destination";
import intersect from "@turf/intersect";
import { featureCollection, polygon } from "@turf/helpers";
import type { Feature, Polygon as GeoPolygon, MultiPolygon } from "geojson";
import * as SunCalc from "suncalc";
import type { PlacedPanel } from "@/lib/panel-layout";
import type { SiteObstruction } from "@/lib/site-layout";
import { effectiveObstructionRadiusFt } from "@/components/site-layout/core/panel-placement";

const FT_TO_M = 0.3048;

/** Fallback heights when an obstruction was saved with height 0 (legacy). */
export const DEFAULT_OBSTRUCTION_HEIGHT_FT: Record<SiteObstruction["type"], number> = {
  water_tank: 8,
  tree: 25,
  chimney: 6,
  parapet: 3,
  other: 5,
};

export type ObstructionHeightDatum = "above_roof" | "agl";

/** Default datum by type — trees are ground-level; tanks/chimneys sit on the roof. */
export function defaultHeightDatum(type: SiteObstruction["type"]): ObstructionHeightDatum {
  return type === "tree" ? "agl" : "above_roof";
}

export function obstructionHeightDatum(obstruction: SiteObstruction): ObstructionHeightDatum {
  return obstruction.height_datum === "agl" || obstruction.height_datum === "above_roof"
    ? obstruction.height_datum
    : defaultHeightDatum(obstruction.type);
}

export function effectiveObstructionHeightFt(obstruction: SiteObstruction): number {
  const stored = obstruction.height_ft ?? 0;
  if (stored > 0) return stored;
  return DEFAULT_OBSTRUCTION_HEIGHT_FT[obstruction.type] ?? 5;
}

/**
 * Height that actually casts onto the plant roof plane.
 * Example: plant roof 40 ft AGL, tree 55 ft AGL → 15 ft effective.
 * Tree 30 ft AGL on a 40 ft roof → 0 (cannot shade the array).
 */
export function effectiveShadowHeightAboveRoofFt(
  obstruction: SiteObstruction,
  plantRoofHeightAglFt: number
): number {
  const raw = effectiveObstructionHeightFt(obstruction);
  const datum = obstructionHeightDatum(obstruction);
  if (datum === "above_roof") return raw;
  const roofAgl = Math.max(0, plantRoofHeightAglFt);
  return Math.max(0, raw - roofAgl);
}

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
 * SunCalc v2: altitude & azimuth in degrees; azimuth north-based CW (0=N, 90=E).
 */
export function sunPoseAt(date: Date, latitudeDeg: number, longitudeDeg: number): SunPose {
  const pos = SunCalc.getPosition(date, latitudeDeg, longitudeDeg);
  // Guard: if a bundler ever resolved classic v1 (radians), altitude is typically |x|≤π/2
  // while real solar altitude in degrees for India daytime is usually > 2°. Prefer degrees
  // whenever |altitude| > π/2 (impossible for radians) OR |azimuth| > π (v2 bearings).
  const altitudeLooksDegrees = Math.abs(pos.altitude) > Math.PI / 2 + 0.01;
  const azimuthLooksDegrees = Math.abs(pos.azimuth) > Math.PI + 0.01;
  const useDegrees = altitudeLooksDegrees || azimuthLooksDegrees;

  let altitudeDeg: number;
  let sunBearingDeg: number;
  if (useDegrees) {
    altitudeDeg = pos.altitude;
    sunBearingDeg = ((pos.azimuth % 360) + 360) % 360;
  } else {
    // Classic SunCalc v1 fallback
    altitudeDeg = (pos.altitude * 180) / Math.PI;
    sunBearingDeg = (((pos.azimuth * 180) / Math.PI + 180) % 360 + 360) % 360;
  }
  const shadowBearingDeg = (sunBearingDeg + 180) % 360;
  return { altitudeDeg, sunBearingDeg, shadowBearingDeg };
}

export function shadowLengthM(heightFt: number, altitudeDeg: number): number {
  if (altitudeDeg <= 1) return Number.POSITIVE_INFINITY;
  const heightM = Math.max(0, heightFt) * FT_TO_M;
  const rad = (altitudeDeg * Math.PI) / 180;
  return heightM / Math.tan(rad);
}

export type LatLngLiteral = { lat: number; lng: number };

type ShadowPoly = Feature<GeoPolygon | MultiPolygon> & { mapPath?: LatLngLiteral[] };

/**
 * Capsule (stadium) shadow footprint using only @turf/destination
 * (avoids @turf/buffer failures in some bundlers).
 */
export function shadowStadiumLatLngs(opts: {
  lat: number;
  lng: number;
  lengthM: number;
  shadowBearingDeg: number;
  radiusM: number;
  stepsPerCap?: number;
}): LatLngLiteral[] | null {
  const { lat, lng, shadowBearingDeg } = opts;
  const lengthM = Math.max(0.5, opts.lengthM);
  const radiusM = Math.max(0.4, opts.radiusM);
  const steps = opts.stepsPerCap ?? 12;
  const origin: [number, number] = [lng, lat];

  try {
    const tip = destination(origin, lengthM, shadowBearingDeg, { units: "meters" }).geometry
      .coordinates as [number, number];
    const leftBearing = (shadowBearingDeg + 270) % 360;
    const rightBearing = (shadowBearingDeg + 90) % 360;
    const ring: LatLngLiteral[] = [];

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const bearing = (leftBearing + ((rightBearing - leftBearing + 360) % 360) * t) % 360;
      const pt = destination(tip, radiusM, bearing, { units: "meters" }).geometry.coordinates;
      ring.push({ lat: pt[1], lng: pt[0] });
    }
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const bearing = (rightBearing + ((leftBearing - rightBearing + 360) % 360) * t) % 360;
      const pt = destination(origin, radiusM, bearing, { units: "meters" }).geometry.coordinates;
      ring.push({ lat: pt[1], lng: pt[0] });
    }
    if (ring.length < 4) return null;
    return ring;
  } catch {
    return null;
  }
}

function latLngsToPolygonFeature(ring: LatLngLiteral[]): ShadowPoly | null {
  if (ring.length < 3) return null;
  const coords = ring.map((p) => [p.lng, p.lat] as [number, number]);
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }
  try {
    return polygon([coords]) as ShadowPoly;
  } catch {
    return null;
  }
}

/**
 * Approximate roof-plane shadow of a circular obstruction (stadium from object to tip).
 */
export function obstructionShadowPolygon(
  obstruction: SiteObstruction,
  altitudeDeg: number,
  shadowBearingDeg: number,
  plantRoofHeightAglFt = 0
): ShadowPoly | null {
  if (!(altitudeDeg > 1) || !Number.isFinite(altitudeDeg)) return null;
  if (!Number.isFinite(obstruction.lat) || !Number.isFinite(obstruction.lng)) return null;

  const heightFt = effectiveShadowHeightAboveRoofFt(obstruction, plantRoofHeightAglFt);
  if (heightFt <= 0) return null;

  const lengthM = shadowLengthM(heightFt, altitudeDeg);
  if (!Number.isFinite(lengthM) || lengthM <= 0) return null;

  const radiusM = effectiveObstructionRadiusFt(obstruction) * FT_TO_M;
  // Visible floor so high-sun noon still shows a lobe; cap low-sun extremes.
  const cappedM = Math.min(Math.max(lengthM, radiusM * 1.25), 80);

  const mapPath = shadowStadiumLatLngs({
    lat: obstruction.lat,
    lng: obstruction.lng,
    lengthM: cappedM,
    shadowBearingDeg,
    radiusM,
  });
  if (!mapPath) return null;
  const feature = latLngsToPolygonFeature(mapPath);
  if (!feature) return null;
  feature.mapPath = mapPath;
  return feature;
}

export type PanelShadeResult = {
  panelId: string;
  shadeFraction: number;
};

export type ShadowAnalysisResult = {
  sampleAt: Date;
  sun: SunPose;
  panelShades: PanelShadeResult[];
  meanShadeFraction: number;
  shadeFreeFraction: number;
  shadeFreePanelSqft: number;
  totalPanelSqft: number;
  shadedPanelCount: number;
  castingObstructionCount: number;
  skippedObstructionCount: number;
  disclaimer: string;
};

function panelFeature(panel: PlacedPanel): Feature<GeoPolygon> | null {
  try {
    return polygon(panel.footprint_geojson.coordinates);
  } catch {
    return null;
  }
}

export function analyzePanelShadows(opts: {
  panels: PlacedPanel[];
  obstructions: SiteObstruction[];
  date: Date;
  latitudeDeg: number;
  longitudeDeg: number;
  plantRoofHeightAglFt?: number;
}): ShadowAnalysisResult {
  const {
    panels,
    obstructions,
    date,
    latitudeDeg,
    longitudeDeg,
    plantRoofHeightAglFt = 0,
  } = opts;
  const sun = sunPoseAt(date, latitudeDeg, longitudeDeg);
  const disclaimer =
    "Planning estimate — roof-plane shadow from plant height + object height (tank above roof / tree AGL). Not a certified shading report.";

  const countCasts = () => {
    let casting = 0;
    let skipped = 0;
    if (sun.altitudeDeg > 1) {
      for (const obstruction of obstructions) {
        if (
          obstructionShadowPolygon(
            obstruction,
            sun.altitudeDeg,
            sun.shadowBearingDeg,
            plantRoofHeightAglFt
          )
        ) {
          casting += 1;
        } else {
          skipped += 1;
        }
      }
    } else {
      skipped = obstructions.length;
    }
    return { castingObstructionCount: casting, skippedObstructionCount: skipped };
  };

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
      ...countCasts(),
      disclaimer,
    };
  }

  if (sun.altitudeDeg <= 1) {
    const panelShades = panels.map((p) => ({ panelId: p.id, shadeFraction: 1 }));
    let totalSqm = 0;
    for (const p of panels) {
      const f = panelFeature(p);
      if (f) totalSqm += area(f);
    }
    return {
      sampleAt: date,
      sun,
      panelShades,
      meanShadeFraction: 1,
      shadeFreeFraction: 0,
      shadeFreePanelSqft: 0,
      totalPanelSqft: totalSqm * 10.7639104167,
      shadedPanelCount: panels.length,
      castingObstructionCount: 0,
      skippedObstructionCount: obstructions.length,
      disclaimer,
    };
  }

  const shadows: ShadowPoly[] = [];
  let castingObstructionCount = 0;
  let skippedObstructionCount = 0;
  for (const obstruction of obstructions) {
    const shadow = obstructionShadowPolygon(
      obstruction,
      sun.altitudeDeg,
      sun.shadowBearingDeg,
      plantRoofHeightAglFt
    );
    if (shadow?.geometry) {
      shadows.push(shadow);
      castingObstructionCount += 1;
    } else {
      skippedObstructionCount += 1;
    }
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

  return {
    sampleAt: date,
    sun,
    panelShades,
    meanShadeFraction: Math.round(meanShadeFraction * 1000) / 1000,
    shadeFreeFraction: Math.round((1 - meanShadeFraction) * 1000) / 1000,
    shadeFreePanelSqft: Math.round(freeSqm * 10.7639104167),
    totalPanelSqft: Math.round(totalSqm * 10.7639104167),
    shadedPanelCount,
    castingObstructionCount,
    skippedObstructionCount,
    disclaimer,
  };
}

/** Survey / Design Hub note from a single planning sample. */
export function formatShadowAnalysisNote(
  analysis: ShadowAnalysisResult,
  sampleLabel: string
): string {
  const meanPct = Math.round(analysis.meanShadeFraction * 100);
  const free = Math.round(analysis.shadeFreePanelSqft);
  return (
    `Design Studio · ${sampleLabel} · mean shade ${meanPct}% · ` +
    `shade-free ≈${free.toLocaleString("en-IN")} sq.ft · ` +
    `${analysis.shadedPanelCount}/${analysis.panelShades.length || 0} panels hit. ` +
    analysis.disclaimer
  ).slice(0, 1000);
}

/**
 * Rough annual generation loss from mean shade across the six IST solstice samples.
 * Planning only — not bankable.
 */
export function estimateAnnualShadeLoss(opts: {
  panels: PlacedPanel[];
  obstructions: SiteObstruction[];
  latitudeDeg: number;
  longitudeDeg: number;
  plantRoofHeightAglFt?: number;
  unshadedAnnualKwh: number;
}): {
  meanShadeFraction: number;
  annualLossKwh: number;
  shadedAnnualKwh: number;
  sampleCount: number;
  note: string;
} {
  const unshaded = Math.max(0, opts.unshadedAnnualKwh);
  if (opts.panels.length === 0 || unshaded <= 0) {
    return {
      meanShadeFraction: 0,
      annualLossKwh: 0,
      shadedAnnualKwh: unshaded,
      sampleCount: 0,
      note: "Place panels and enable yield estimate to see annual shade loss.",
    };
  }

  let sum = 0;
  for (const preset of SHADOW_SOLSTICE_PRESETS) {
    const sample = analyzePanelShadows({
      panels: opts.panels,
      obstructions: opts.obstructions,
      date: presetToDate(preset),
      latitudeDeg: opts.latitudeDeg,
      longitudeDeg: opts.longitudeDeg,
      plantRoofHeightAglFt: opts.plantRoofHeightAglFt,
    });
    sum += sample.meanShadeFraction;
  }
  const meanShadeFraction =
    Math.round((sum / SHADOW_SOLSTICE_PRESETS.length) * 1000) / 1000;
  const annualLossKwh = Math.round(unshaded * meanShadeFraction);
  const shadedAnnualKwh = Math.max(0, unshaded - annualLossKwh);
  return {
    meanShadeFraction,
    annualLossKwh,
    shadedAnnualKwh,
    sampleCount: SHADOW_SOLSTICE_PRESETS.length,
    note:
      `≈${Math.round(meanShadeFraction * 100)}% mean shade across ${SHADOW_SOLSTICE_PRESETS.length} ` +
      `solstice samples → ~${annualLossKwh.toLocaleString("en-IN")} kWh/yr loss (planning).`,
  };
}

/** Canonical Dec 21 · 12 PM sample used when saving survey shadow fields. */
export function buildSurveyShadowFields(opts: {
  panels: PlacedPanel[];
  obstructions: SiteObstruction[];
  latitudeDeg: number;
  longitudeDeg: number;
  plantRoofHeightAglFt?: number;
}): { shadow_free_sqft: number; shadow_analysis_note: string } | null {
  if (opts.panels.length === 0) return null;
  const preset = SHADOW_SOLSTICE_PRESETS.find((item) => item.id === "dec21-12");
  if (!preset) return null;
  const analysis = analyzePanelShadows({
    panels: opts.panels,
    obstructions: opts.obstructions,
    date: presetToDate(preset),
    latitudeDeg: opts.latitudeDeg,
    longitudeDeg: opts.longitudeDeg,
    plantRoofHeightAglFt: opts.plantRoofHeightAglFt,
  });
  return {
    shadow_free_sqft: analysis.shadeFreePanelSqft,
    shadow_analysis_note: formatShadowAnalysisNote(analysis, preset.label),
  };
}

export function shadeFillColor(shadeFraction: number, selected: boolean, locked: boolean): string {
  if (selected) return "#1e3a8a";
  if (locked && shadeFraction < 0.05) return "#1c1917";
  if (shadeFraction >= 0.5) return "#7f1d1d";
  if (shadeFraction >= 0.2) return "#b45309";
  if (shadeFraction >= 0.05) return "#a16207";
  return locked ? "#1c1917" : "#0b1220";
}
