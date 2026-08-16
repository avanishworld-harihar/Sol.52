"use client";

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import { readDefaultResidentialPreset } from "@/lib/proposal-default-preset-storage";
import { readDefaultGalleryKey } from "@/lib/proposal-template-gallery-storage";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

export type QuickRequirementCreateResult = {
  ok: boolean;
  id?: string;
  customerName?: string;
  shareUrl?: string;
  systemKw?: number;
  netCostInr?: number;
  subsidyInr?: number;
  plantGrossInr?: number;
  error?: string;
  code?: string;
};

export function resolveQuickQuotePresetOptions(): {
  presetId: ProposalPresetId;
  salesPremiumStyle?: SalesPremiumStyleId;
  galleryThemeKey?: string;
} {
  const presetId = readDefaultResidentialPreset();
  if (presetId === "residential_zenith") {
    return { presetId, galleryThemeKey: "zenith" };
  }
  if (presetId === "residential_premium_luxe") {
    return { presetId, galleryThemeKey: "luxe" };
  }
  if (presetId === "residential_luxe_noir") {
    return { presetId, galleryThemeKey: "luxe_noir" };
  }
  if (presetId === "residential_blueprint") {
    return { presetId, galleryThemeKey: "blueprint" };
  }
  if (presetId === "residential_quantum") {
    return { presetId, galleryThemeKey: "quantum" };
  }
  if (presetId === "residential_emerald") {
    return { presetId, galleryThemeKey: "emerald" };
  }
  if (presetId === "residential_lumina") {
    return { presetId, galleryThemeKey: "lumina" };
  }
  if (presetId === "residential_sienna") {
    return { presetId, galleryThemeKey: "sienna" };
  }
  if (presetId === "residential_khadi") {
    return { presetId, galleryThemeKey: "khadi" };
  }
  if (presetId === "residential_executive") {
    return { presetId, galleryThemeKey: "golden" };
  }
  return {
    presetId,
    galleryThemeKey: readDefaultGalleryKey() ?? undefined,
  };
}

export async function createQuickRequirementProposal(input: {
  kw: number;
  customerName?: string;
  presetId?: ProposalPresetId;
  salesPremiumStyle?: SalesPremiumStyleId;
  galleryThemeKey?: string;
  leadId?: string | null;
  connectionPhase?: "single_phase" | "three_phase";
}): Promise<QuickRequirementCreateResult> {
  const resolved = resolveQuickQuotePresetOptions();
  const res = await fetch("/api/proposals/quick-requirement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kw: input.kw,
      customerName: input.customerName,
      leadId: input.leadId ?? null,
      connectionPhase: input.connectionPhase,
      presetId: input.presetId ?? resolved.presetId,
      salesPremiumStyle: input.salesPremiumStyle ?? resolved.salesPremiumStyle,
      galleryThemeKey: input.galleryThemeKey ?? resolved.galleryThemeKey,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as QuickRequirementCreateResult & {
    error?: string;
    code?: string;
  };
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || "Could not create proposal",
      code: data.code,
    };
  }
  return {
    ok: true,
    id: data.id,
    customerName: data.customerName,
    shareUrl: data.shareUrl,
    systemKw: data.systemKw,
    netCostInr: data.netCostInr,
    subsidyInr: data.subsidyInr,
    plantGrossInr: data.plantGrossInr,
  };
}
