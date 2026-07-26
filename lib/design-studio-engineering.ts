import type { PanelMountingType, PanelOrientation } from "@/lib/panel-layout";
import { recommendedTiltFromLatitude } from "@/lib/proposal-site-geo";
import { SOLAR_YIELD_KWH_PER_KW_YEAR } from "@/lib/solar-engine";

/** Smallest angle difference between two bearings (0–180). */
export function bearingDeltaDeg(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

export type AzimuthAdvice = {
  roofAzimuthDeg: number;
  /** Degrees off due-south (180°) — lower is better for India fixed tilt. */
  offSouthDeg: number;
  grade: "excellent" | "good" | "fair" | "poor";
  summary: string;
  suggestedOrientation: Exclude<PanelOrientation, "east_west">;
  orientationHint: string;
};

/**
 * India rooftop: ideal array faces south (~180°).
 * Roof edge azimuth is a proxy from the first polygon edge.
 */
export function adviseRoofAzimuth(roofAzimuthDeg: number): AzimuthAdvice {
  const az = ((roofAzimuthDeg % 360) + 360) % 360;
  const offSouthDeg = bearingDeltaDeg(az, 180);
  const grade =
    offSouthDeg <= 15 ? "excellent" : offSouthDeg <= 30 ? "good" : offSouthDeg <= 45 ? "fair" : "poor";

  // E–W ridge (~90/270) → long side N–S (portrait). N–S ridge (~0/180) → landscape packs along ridge.
  const offEW = Math.min(bearingDeltaDeg(az, 90), bearingDeltaDeg(az, 270));
  const offNS = Math.min(bearingDeltaDeg(az, 0), bearingDeltaDeg(az, 180));
  const suggestedOrientation: Exclude<PanelOrientation, "east_west"> =
    offEW <= offNS ? "portrait" : "landscape";

  const facing =
    grade === "excellent"
      ? "Nearly south-facing — strong year-round yield."
      : grade === "good"
        ? "Mostly south-biased — solid for India rooftop."
        : grade === "fair"
          ? "Off-south — expect some yield loss vs ideal south."
          : "Far from south — consider another roof plane if available.";

  return {
    roofAzimuthDeg: Math.round(az),
    offSouthDeg: Math.round(offSouthDeg),
    grade,
    summary: `Edge ${Math.round(az)}° · ${Math.round(offSouthDeg)}° off south · ${facing}`,
    suggestedOrientation,
    orientationHint:
      suggestedOrientation === "portrait"
        ? "Suggest Portrait (long side N–S) for typical E–W roof edge."
        : "Suggest Landscape to align rows with a N–S roof edge.",
  };
}

/**
 * Front-to-front row pitch (m) to limit winter inter-row shade.
 * Flush = module length + small gap. Elevated / ground = classic shade formula.
 */
export function recommendedRowPitchM(opts: {
  tiltDeg: number;
  moduleLengthM: number;
  latitudeDeg: number;
  mounting: PanelMountingType;
  flushGapM?: number;
}): number {
  const L = Math.max(0.2, opts.moduleLengthM);
  const gap = opts.flushGapM ?? 0.02;
  if (opts.mounting === "flush") {
    return L + gap;
  }
  const tilt = Math.max(0, Math.min(60, opts.tiltDeg));
  const beta = (tilt * Math.PI) / 180;
  // Winter noon altitude ≈ 90 − |lat| − 23.44°
  const winterAltDeg = Math.max(12, 90 - Math.abs(opts.latitudeDeg) - 23.44);
  const alpha = (winterAltDeg * Math.PI) / 180;
  const pitch = L * (Math.cos(beta) + Math.sin(beta) / Math.tan(alpha));
  return Math.max(L + gap, pitch);
}

export function moduleLengthForOrientationM(
  widthMm: number,
  heightMm: number,
  orientation: PanelOrientation
): number {
  const shortM = widthMm / 1000;
  const longM = heightMm / 1000;
  // Pitch along “row” direction uses the footprint height in packer coords.
  // Portrait = long N–S; landscape + east_west = short N–S (long E–W).
  return orientation === "portrait" ? longM : shortM;
}

export type YieldEstimate = {
  dcKw: number;
  specificYieldKwhPerKwp: number;
  annualKwh: number;
  dailyKwh: number;
  note: string;
};

/**
 * Rough annual yield from DC kW + site lat / tilt / roof azimuth.
 * Not a bankable simulation — Design Studio planning estimate only.
 */
export function estimateDesignAnnualYield(opts: {
  dcKw: number;
  tiltDeg: number;
  latitudeDeg: number;
  roofAzimuthDeg: number | null;
}): YieldEstimate {
  const dcKw = Math.max(0, opts.dcKw);
  const recommendedTilt = recommendedTiltFromLatitude(opts.latitudeDeg);
  const tiltDelta = Math.abs(opts.tiltDeg - recommendedTilt);
  const tiltFactor = Math.max(0.82, 1 - tiltDelta * 0.008);

  const offSouth =
    opts.roofAzimuthDeg == null ? 25 : bearingDeltaDeg(opts.roofAzimuthDeg, 180);
  const azFactor =
    offSouth <= 15 ? 1 : offSouth <= 30 ? 0.97 : offSouth <= 45 ? 0.93 : offSouth <= 90 ? 0.86 : 0.78;

  // Slight lat band nudge around India mid (~20–25°N).
  const lat = Math.abs(opts.latitudeDeg);
  const latFactor = lat < 15 ? 0.96 : lat < 28 ? 1 : 0.97;

  const specific = Math.round(
    SOLAR_YIELD_KWH_PER_KW_YEAR * tiltFactor * azFactor * latFactor
  );
  const annualKwh = Math.round(dcKw * specific);
  return {
    dcKw,
    specificYieldKwhPerKwp: specific,
    annualKwh,
    dailyKwh: Number((annualKwh / 365).toFixed(1)),
    note: `≈${specific} kWh/kWp/yr · tilt vs ideal ${recommendedTilt}° · azimuth factor included (rough, not bankable).`,
  };
}
