/**
 * Walkway & safety profiles for Design Studio packing / engineering.
 * Consumed by setback defaults — installer-selectable.
 */

export type SafetyProfileId = "residential" | "commercial" | "industrial" | "custom";

export type WalkwaySafetyProfile = {
  id: SafetyProfileId;
  label: string;
  /** Edge setback from roof perimeter (ft). */
  edgeSetbackFt: number;
  /** Extra keep-out around obstructions (ft). */
  obstructionClearanceFt: number;
  /** Suggested walkway gap between arrays (ft) — advisory. */
  walkwayFt: number;
  /** Fire / maintenance edge preference (ft). */
  fireSetbackFt: number;
};

export const WALKWAY_SAFETY_PROFILES: Record<
  Exclude<SafetyProfileId, "custom">,
  WalkwaySafetyProfile
> = {
  residential: {
    id: "residential",
    label: "Residential",
    edgeSetbackFt: 1.5,
    obstructionClearanceFt: 1.5,
    walkwayFt: 2,
    fireSetbackFt: 3,
  },
  commercial: {
    id: "commercial",
    label: "Commercial",
    edgeSetbackFt: 2.5,
    obstructionClearanceFt: 2,
    walkwayFt: 3,
    fireSetbackFt: 4,
  },
  industrial: {
    id: "industrial",
    label: "Industrial",
    edgeSetbackFt: 3,
    obstructionClearanceFt: 2.5,
    walkwayFt: 4,
    fireSetbackFt: 6,
  },
};

export function resolveSafetyProfile(
  id: SafetyProfileId | null | undefined,
  custom?: Partial<WalkwaySafetyProfile> | null
): WalkwaySafetyProfile {
  if (id === "custom" && custom) {
    return {
      id: "custom",
      label: "Custom",
      edgeSetbackFt: custom.edgeSetbackFt ?? 1.5,
      obstructionClearanceFt: custom.obstructionClearanceFt ?? 1.5,
      walkwayFt: custom.walkwayFt ?? 2,
      fireSetbackFt: custom.fireSetbackFt ?? 3,
    };
  }
  if (id && id !== "custom" && WALKWAY_SAFETY_PROFILES[id]) {
    return WALKWAY_SAFETY_PROFILES[id];
  }
  return WALKWAY_SAFETY_PROFILES.residential;
}

/**
 * Roof type → suggested mounting + whether East-West preset is appropriate.
 */
export type DesignRoofTypeKey =
  | "flat_rcc"
  | "sloped_rcc"
  | "metal_sheet"
  | "tile"
  | "ground_mount"
  | string;

export type RoofTypePackAdvice = {
  preferredMounting: "flush" | "elevated" | "ground_mount";
  allowEastWest: boolean;
  defaultSetbackFt: number;
  note: string;
};

export function advisePackingForRoofType(roofType: DesignRoofTypeKey | null | undefined): RoofTypePackAdvice {
  const key = String(roofType ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (key.includes("ground")) {
    return {
      preferredMounting: "ground_mount",
      allowEastWest: true,
      defaultSetbackFt: 2,
      note: "Ground mount — elevated/ground pitch; East-West OK on open yards.",
    };
  }
  if (key.includes("flat") || (key.includes("rcc") && !key.includes("slope"))) {
    return {
      preferredMounting: "elevated",
      allowEastWest: true,
      defaultSetbackFt: 1.5,
      note: "Flat RCC — elevated MMS common; East-West optional.",
    };
  }
  if (key.includes("slope") || key.includes("tile") || key.includes("metal") || key.includes("sheet")) {
    return {
      preferredMounting: "flush",
      allowEastWest: false,
      defaultSetbackFt: 1.5,
      note: "Sloped / metal / tile — flush to roof pitch; East-West usually not used.",
    };
  }
  return {
    preferredMounting: "flush",
    allowEastWest: true,
    defaultSetbackFt: 1.5,
    note: "Generic roof — adjust mounting to site.",
  };
}
