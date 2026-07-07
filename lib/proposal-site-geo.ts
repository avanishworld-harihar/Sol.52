/** Site latitude lookup for residential engineering (tilt, yield context). */

export const SATNA_LATITUDE = 24.58;

const CITY_LATITUDE: Record<string, number> = {
  satna: SATNA_LATITUDE,
  rewa: 24.53,
  jabalpur: 23.18,
  katni: 23.83,
  bhopal: 23.26,
  indore: 22.72,
  ujjain: 23.18,
  gwalior: 26.22,
};

function normalizeCityToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveSiteLatitude(
  location?: string | null,
  state?: string | null
): { lat: number; cityLabel: string } {
  const locationTrim = (location ?? "").trim();
  const firstCity = normalizeCityToken(locationTrim.split(",")[0] ?? "");

  if (firstCity && CITY_LATITUDE[firstCity] != null) {
    const label = firstCity.charAt(0).toUpperCase() + firstCity.slice(1);
    return { lat: CITY_LATITUDE[firstCity], cityLabel: label };
  }

  const locationLower = locationTrim.toLowerCase();
  for (const [city, lat] of Object.entries(CITY_LATITUDE)) {
    if (locationLower.includes(city)) {
      const label = city.charAt(0).toUpperCase() + city.slice(1);
      return { lat, cityLabel: label };
    }
  }

  const stateNorm = (state ?? "").trim().toLowerCase();
  if (stateNorm.includes("madhya") || stateNorm === "mp") {
    return { lat: SATNA_LATITUDE, cityLabel: "Satna region" };
  }

  // Harihar Solar default service area
  return { lat: SATNA_LATITUDE, cityLabel: "Satna" };
}

/** India rooftop rule of thumb: latitude − 5°, clamped 10–30°. */
export function recommendedTiltFromLatitude(latDeg: number): number {
  const tilt = Math.round(latDeg - 5);
  return Math.max(10, Math.min(tilt, 30));
}

export function tiltRationaleForSite(cityLabel: string, lat: number, tiltDeg: number): string {
  return `Recommended ${tiltDeg}° panel tilt for ${cityLabel} (${lat.toFixed(1)}°N latitude) — optimised for year-round generation in Madhya Pradesh.`;
}
