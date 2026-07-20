/**
 * Design Studio — parse GPS from pasted text / GPS Map Camera stamps / photo EXIF.
 */

import exifr from "exifr";

export type SiteGpsPoint = {
  lat: number;
  lng: number;
  source: "paste" | "exif" | "stamp";
};

function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Accepts "24.57, 80.83" or "Lat 24.576354, Long 80.836641" (GPS Map Camera stamp). */
export function parseLatLngText(raw: string): SiteGpsPoint | null {
  const text = raw.trim();
  if (!text) return null;

  const stamp = text.match(
    /lat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\s*[,;\s]+(?:long(?:itude)?|lng)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i
  );
  if (stamp) {
    const lat = Number(stamp[1]);
    const lng = Number(stamp[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng, source: "stamp" };
  }

  const pair = text.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]+\s*(-?\d+(?:\.\d+)?)/);
  if (pair) {
    const a = Number(pair[1]);
    const b = Number(pair[2]);
    // Prefer lat,lng when first value looks like latitude (|lat|<=90).
    if (Math.abs(a) <= 90 && isValidLatLng(a, b)) return { lat: a, lng: b, source: "paste" };
    if (Math.abs(b) <= 90 && isValidLatLng(b, a)) return { lat: b, lng: a, source: "paste" };
  }

  return null;
}

export function parseSeparateLatLng(latRaw: string, lngRaw: string): SiteGpsPoint | null {
  const lat = Number(String(latRaw).trim().replace(/,/g, ""));
  const lng = Number(String(lngRaw).trim().replace(/,/g, ""));
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng, source: "paste" };
}

/** Read GPS from image EXIF (original GPS Map Camera files). WhatsApp often strips EXIF. */
export async function extractGpsFromImageFile(file: File): Promise<SiteGpsPoint | null> {
  try {
    const gps = (await exifr.gps(file)) as { latitude?: number; longitude?: number } | undefined;
    const lat = gps?.latitude;
    const lng = gps?.longitude;
    if (typeof lat === "number" && typeof lng === "number" && isValidLatLng(lat, lng)) {
      return { lat, lng, source: "exif" };
    }
  } catch {
    /* ignore — fall through */
  }
  return null;
}
