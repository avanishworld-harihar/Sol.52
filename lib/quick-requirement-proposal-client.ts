"use client";

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import { readDefaultResidentialPreset } from "@/lib/proposal-default-preset-storage";
import { readDefaultGalleryKey } from "@/lib/proposal-template-gallery-storage";
import { readActiveSalesPremiumStyle, type SalesPremiumStyleId } from "@/lib/sales-premium-styles";

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
  if (presetId === "residential_sales_premium") {
    return {
      presetId,
      salesPremiumStyle: readActiveSalesPremiumStyle(),
      galleryThemeKey: readDefaultGalleryKey() ?? undefined,
    };
  }
  if (presetId === "residential_solstice") {
    return { presetId, galleryThemeKey: "solstice" };
  }
  return { presetId };
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
  try {
    const presetOptions = resolveQuickQuotePresetOptions();
    const presetId = input.presetId ?? presetOptions.presetId;
    const salesPremiumStyle = input.salesPremiumStyle ?? presetOptions.salesPremiumStyle;
    const galleryThemeKey = input.galleryThemeKey ?? presetOptions.galleryThemeKey;

    const body: Record<string, unknown> = { kw: input.kw, presetId };
    if (input.customerName?.trim()) body.customerName = input.customerName.trim();
    if (salesPremiumStyle) body.salesPremiumStyle = salesPremiumStyle;
    if (galleryThemeKey) body.galleryThemeKey = galleryThemeKey;
    if (input.leadId?.trim()) body.leadId = input.leadId.trim();
    if (input.connectionPhase) body.connectionPhase = input.connectionPhase;

    const res = await fetch("/api/proposals/quick-requirement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as QuickRequirementCreateResult & {
      ok?: boolean;
    };
    if (!res.ok || !json.ok || !json.id) {
      return {
        ok: false,
        error: json.error || "quick_requirement_failed",
        code: json.code,
      };
    }
    return {
      ok: true,
      id: json.id,
      customerName: json.customerName,
      shareUrl: json.shareUrl,
      systemKw: json.systemKw,
      netCostInr: json.netCostInr,
      subsidyInr: json.subsidyInr,
      plantGrossInr: json.plantGrossInr,
    };
  } catch {
    return { ok: false, error: "quick_requirement_failed" };
  }
}
