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

  if (input.galleryKey === "slate") return "slate";
  if (input.galleryKey === "pearl") return "pearl";
  if (input.galleryKey === "golden") return "golden";
  if (input.galleryKey === "classic") return "classic";
  if (input.galleryKey === "ledger") return "ledger";
  if (input.galleryKey === "horizon") return "horizon";
  if (input.galleryKey === "ember") return "ember";

  const preset = input.presetId;
  if (preset === "residential_smart") return "classic";
  if (preset === "residential_bank_loan") return "ledger";
  if (preset === "residential_executive") return "golden";

  if (preset === "residential_sales_premium") {
    const style = input.salesPremiumStyle;
    if (style === "journey") return "horizon";
    if (style === "savings_focus") return "ember";
    return "pearl";
  }

  return "classic";
}

export function isCommercialPreset(presetId: string): boolean {
  return presetId === "commercial_executive";
}
