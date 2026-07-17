import type { ResidentialThemeKey } from "@/lib/billing/types";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

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

  if (input.galleryKey === "golden") return "golden";
  if (input.galleryKey === "zenith") return "golden";
  if (input.galleryKey === "luxe") return "golden";
  if (input.galleryKey === "blueprint") return "golden";

  const preset = input.presetId;
  if (preset === "residential_executive") return "golden";
  if (preset === "residential_zenith") return "golden";
  if (preset === "residential_premium_luxe") return "golden";
  if (preset === "residential_blueprint") return "golden";

  return "golden";
}

export function isCommercialPreset(presetId: string): boolean {
  return presetId === "commercial_executive";
}
