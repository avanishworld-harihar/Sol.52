import type { DiscomOption } from "@/lib/supabase-discoms";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states-uts";

export type DetectedInstallerLocation = {
  state: string;
  district: string;
  city: string;
};

function canonicalIndianState(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  const aliases: Record<string, string> = {
    orissa: "Odisha",
    "national capital territory of delhi": "Delhi",
    "nct of delhi": "Delhi",
    "andaman & nicobar islands": "Andaman and Nicobar Islands",
  };
  if (aliases[normalized]) return aliases[normalized];
  return INDIAN_STATES_AND_UTS.find((state) => state.toLowerCase() === normalized) ?? raw.trim();
}

function devicePosition(): Promise<GeolocationPosition> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Location is not supported on this device."));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 10 * 60_000,
    });
  });
}

/** Requests device location, then resolves its Indian state/district in-browser. */
export async function detectInstallerLocation(): Promise<DetectedInstallerLocation> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  if (!apiKey) throw new Error("Location lookup is not configured. Select the region manually.");

  const position = await devicePosition();
  const maps = await loadGoogleMaps(apiKey);
  const geocoder = new maps.Geocoder();
  const response = await geocoder.geocode({
    location: { lat: position.coords.latitude, lng: position.coords.longitude },
    region: "IN",
  });
  const result = response.results[0];
  if (!result) throw new Error("We could not identify this location. Select the region manually.");

  const component = (type: string) =>
    result.address_components.find((item) => item.types.includes(type))?.long_name?.trim() ?? "";
  const country = result.address_components.find((item) => item.types.includes("country"))?.short_name ?? "";
  if (country && country.toUpperCase() !== "IN") {
    throw new Error("Automatic region setup is currently available for locations in India.");
  }

  const state = canonicalIndianState(component("administrative_area_level_1"));
  if (!state || !INDIAN_STATES_AND_UTS.includes(state as (typeof INDIAN_STATES_AND_UTS)[number])) {
    throw new Error("Indian state could not be detected. Select it manually.");
  }
  return {
    state,
    district: component("administrative_area_level_2"),
    city: component("locality") || component("postal_town") || component("administrative_area_level_3"),
  };
}

const MP_EAST = [
  "anup", "balaghat", "chhatarpur", "chhindwara", "damoh", "dindori", "jabalpur", "katni",
  "mandla", "narsinghpur", "panna", "rewa", "sagar", "satna", "seoni", "shahdol", "sidhi",
  "singrauli", "tikamgarh", "niwari", "umaria", "maihar",
];
const MP_WEST = [
  "agar", "alirajpur", "barwani", "burhanpur", "dewas", "dhar", "indore", "jhabua", "khandwa",
  "khargone", "mandsaur", "neemuch", "ratlam", "shajapur", "ujjain",
];
const MP_CENTRAL = [
  "ashoknagar", "betul", "bhind", "bhopal", "datia", "guna", "gwalior", "harda", "morena",
  "narmadapuram", "hoshangabad", "raisen", "rajgarh", "sehore", "sheopur", "shivpuri", "vidisha",
];

function optionByCode(options: DiscomOption[], code: string): string | null {
  return options.find((option) => option.code.toUpperCase() === code.toUpperCase())?.code ?? null;
}

/** Returns only confident matches; ambiguous multi-DISCOM states remain user-confirmed. */
export function inferDiscomForLocation(
  location: DetectedInstallerLocation,
  options: DiscomOption[]
): string | null {
  if (options.length === 1) return options[0]?.code ?? null;
  const place = `${location.district} ${location.city}`.toLowerCase();

  if (location.state === "Madhya Pradesh") {
    if (MP_EAST.some((name) => place.includes(name))) return optionByCode(options, "MPPKVVCL");
    if (MP_WEST.some((name) => place.includes(name))) return optionByCode(options, "MPPaKVVCL");
    if (MP_CENTRAL.some((name) => place.includes(name))) return optionByCode(options, "MPMKVVCL");
  }

  const localityMatch = options.find((option) => {
    const label = `${option.name} ${option.code}`.toLowerCase();
    return [location.city, location.district]
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length >= 4)
      .some((value) => label.includes(value));
  });
  return localityMatch?.code ?? null;
}
