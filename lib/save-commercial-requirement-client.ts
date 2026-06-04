import {
  applyCommercialFlagsToLayout,
  type CommercialProposalConfig,
} from "@/lib/commercial-proposal-config";
import { applyCommercialPanelTrackPolicy } from "@/lib/commercial-panel-track-policy";
import { findCatalogIdForTrack } from "@/lib/commercial-bom-panels";
import { saveInstallerResidentialCatalog } from "@/lib/installer-rate-card-client";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import { syncEquipmentPresetsFromConfig } from "@/lib/residential-equipment-presets";
import {
  inverterBrandsLabel,
  panelBrandsLabel,
  wireBrandsLabel,
} from "@/lib/residential-deck-helpers";
import { syncResidentialSolarToLineItems } from "@/lib/residential-solar-engine";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export type SaveCommercialRequirementInput = {
  proposalId: string;
  pricingConfig: ResidentialProposalConfig;
  commercialConfig: CommercialProposalConfig;
  proposalLayout?: ProposalTemplateV1 | null;
  lineItems?: PricingLineItem[];
};

/** Apply Quote & equipment brand picks to BOM line_items (panel / inverter / wire). */
export function syncQuoteEquipmentToLineItems(
  lines: PricingLineItem[],
  pricing: ResidentialProposalConfig
): PricingLineItem[] {
  const panelBrand = panelBrandsLabel(pricing.panelBrandOptions, pricing.solar.brand ?? "Waaree");
  const inverterBrand = inverterBrandsLabel(pricing.inverterBrandOptions, "");
  const wireBrand = wireBrandsLabel(pricing.pricing);

  return lines.map((line) => {
    if (line.kind === "panels") {
      return { ...line, brand: panelBrand, panel_track: "dcr" as const };
    }
    if (line.kind === "inverter" && inverterBrand) {
      return { ...line, brand: inverterBrand };
    }
    if (line.kind === "cabling" && wireBrand) {
      return { ...line, brand: wireBrand };
    }
    return line;
  });
}

export type SaveCommercialRequirementResult = {
  ok: boolean;
  error?: string;
  proposalLayout?: ProposalTemplateV1;
  commercialConfig?: CommercialProposalConfig;
};

/** Sync panel / inverter / wire choices from Quote & equipment into commercialConfig. */
export function syncCommercialEquipmentFromPricing(
  commercial: CommercialProposalConfig,
  pricing: ResidentialProposalConfig
): CommercialProposalConfig {
  const catalog = pricing.brandCatalog;
  const activeBrandId = catalog?.activeBrandId ?? pricing.solar.brandId ?? "waaree";
  const entry = catalog?.entries?.find((e) => e.brandId === activeBrandId);
  const primaryPanel =
    pricing.panelBrandOptions?.find((p) => p.brand?.trim())?.brand?.trim() ??
    entry?.brand ??
    pricing.solar.brand;
  const watt = pricing.solar.watt ?? entry?.kwTiers?.[0]?.kw ?? 540;
  const catalogId =
    findCatalogIdForTrack(activeBrandId, watt, "dcr") ??
    commercial.panel?.catalogId ??
    "waaree-540-dcr";

  return {
    ...commercial,
    panel: {
      catalogId,
      brandId: activeBrandId,
      watt,
      panelType: "DCR",
      ratePerWpInr: pricing.solar.ratePerWpInr ?? commercial.panel?.ratePerWpInr,
      technology:
        pricing.pricing?.panelTechnology?.trim() ??
        pricing.solar.technology ??
        commercial.panel?.technology ??
        "Mono PERC",
    },
    panelRegistry: {
      ...commercial.panelRegistry,
      selectedDcrCatalogId: catalogId,
      selectedNonDcrCatalogId: undefined,
    },
    dcrComparison: { ...commercial.dcrComparison, enabled: false },
  };
}

/** Merge rate-card / brand toggles from pricing into commercial deck flags. */
export function mergeCommercialConfigWithPricing(
  commercial: CommercialProposalConfig,
  pricing: ResidentialProposalConfig
): CommercialProposalConfig {
  let merged = syncCommercialEquipmentFromPricing(commercial, pricing);
  merged = {
    ...merged,
    dcrComparison: {
      ...merged.dcrComparison,
      enabled: false,
      brandId: pricing.trackCompare?.compareBrandId ?? merged.dcrComparison?.brandId,
      watt: pricing.solar.watt ?? merged.dcrComparison?.watt,
    },
    brandComparison: {
      ...merged.brandComparison,
      enabled: pricing.brandCompare?.enabled !== false,
      brandIdA: pricing.brandCompare?.brandIdA ?? merged.brandComparison?.brandIdA,
      brandIdB: pricing.brandCompare?.brandIdB ?? merged.brandComparison?.brandIdB,
    },
  };
  return merged;
}

/**
 * Persists commercial pricing (residentialConfig shape) + commercialConfig + optional BOM lines.
 */
export async function saveCommercialRequirement(
  input: SaveCommercialRequirementInput
): Promise<SaveCommercialRequirementResult> {
  const { proposalId, commercialConfig, proposalLayout, lineItems } = input;
  const pricing = applyCommercialPanelTrackPolicy(
    syncEquipmentPresetsFromConfig(ensureBrandCatalog(input.pricingConfig)),
    input.pricingConfig.connectionType
  );
  const mergedCommercial = mergeCommercialConfigWithPricing(commercialConfig, pricing);
  const layout = applyCommercialFlagsToLayout(
    proposalLayout ?? { version: 1, blocks: [] },
    mergedCommercial
  );

  if (pricing.brandCatalog) {
    void saveInstallerResidentialCatalog(pricing.brandCatalog);
  }

  if (lineItems?.length) {
    let syncedLines = syncQuoteEquipmentToLineItems(lineItems, pricing);
    syncedLines = syncResidentialSolarToLineItems(pricing.solar, syncedLines);
    const prRes = await fetch(`/api/proposals/${proposalId}/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        line_items: syncedLines,
        system_kw: pricing.solar.plantCapacityKw,
      }),
    });
    const prJson = (await prRes.json()) as { ok?: boolean; error?: string };
    if (!prRes.ok || !prJson.ok) {
      return { ok: false, error: prJson.error ?? "pricing_save_failed" };
    }
  }

  const cfgRes = await fetch(`/api/proposals/${proposalId}/commercial-config`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commercialConfig: mergedCommercial,
      residentialConfig: {
        ...pricing,
        inputMode: pricing.inputMode ?? "bill",
        pricingSource: pricing.pricingSource ?? "rate_card",
        solar: { ...pricing.solar, panelTrack: "dcr" },
      },
      proposalLayout: layout,
    }),
  });
  const cfgJson = (await cfgRes.json()) as {
    ok?: boolean;
    error?: string;
    proposalLayout?: ProposalTemplateV1;
    commercialConfig?: CommercialProposalConfig;
  };
  if (!cfgRes.ok || !cfgJson.ok) {
    return { ok: false, error: cfgJson.error ?? "config_save_failed" };
  }

  return {
    ok: true,
    proposalLayout: cfgJson.proposalLayout ?? layout,
    commercialConfig: cfgJson.commercialConfig ?? mergedCommercial,
  };
}
