import type { ResidentialThemeKey } from "@/lib/billing/types";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

const THEME_KEYS = new Set<string>([
  "classic",
  "ledger",
  "pearl",
  "slate",
  "golden",
  "horizon",
  "ember",
  "solstice",
  "freedom",
]);

function asThemeKey(value: string | null | undefined): ResidentialThemeKey | null {
  if (!value) return null;
  return THEME_KEYS.has(value) ? (value as ResidentialThemeKey) : null;
}

/** Map gallery / preset selection to a stable theme key for residential entitlement checks only. */
export function resolveResidentialThemeKey(input: {
  presetId: string;
  salesPremiumStyle?: SalesPremiumStyleId | string | null;
  galleryKey?: string | null;
}): ResidentialThemeKey {
  if (isCommercialPreset(input.presetId)) {
    throw new Error(
      "resolveResidentialThemeKey must not be called for commercial presets — use commercial_proposals entitlement."
    );
  }

  const fromGallery = asThemeKey(input.galleryKey ?? null);
  if (fromGallery) return fromGallery;

  if (input.galleryKey === "zenith") return "golden";
  if (input.galleryKey === "luxe") return "golden";
  if (input.galleryKey === "luxe_noir") return "golden";
  if (input.galleryKey === "blueprint") return "golden";
  if (input.galleryKey === "quantum") return "golden";
  if (input.galleryKey === "emerald") return "golden";
  if (input.galleryKey === "obsidian") return "golden";
  if (input.galleryKey === "field") return "golden";
  if (input.galleryKey === "wall_street") return "golden";
  if (input.galleryKey === "cyanotype") return "golden";

  const preset = input.presetId;
  if (preset === "residential_executive") return "golden";
  if (preset === "residential_zenith") return "golden";
  if (preset === "residential_premium_luxe") return "golden";
  if (preset === "residential_luxe_noir") return "golden";
  if (preset === "residential_blueprint") return "golden";
  if (preset === "residential_quantum") return "golden";
  if (preset === "residential_emerald") return "golden";
  if (preset === "residential_obsidian") return "golden";
  if (preset === "residential_field") return "golden";
  if (preset === "residential_wall_street") return "golden";
  if (preset === "residential_cyanotype") return "golden";
  if (preset === "residential_horizon" || preset.includes("horizon")) return "horizon";
  if (preset === "residential_ember" || preset.includes("ember")) return "ember";
  if (preset.includes("solstice")) return "solstice";
  if (preset.includes("freedom")) return "freedom";
  if (preset.includes("classic")) return "classic";
  if (preset.includes("ledger")) return "ledger";
  if (preset.includes("pearl")) return "pearl";
  if (preset.includes("slate")) return "slate";

  return "golden";
}

export function isCommercialPreset(presetId: string): boolean {
  return presetId === "commercial_executive";
}
