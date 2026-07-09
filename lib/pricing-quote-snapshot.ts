/**
 * Frozen quote payload — immutable customer offer (Phase 1 quotation engine).
 */

import { z } from "zod";
import {
  PRICING_ENGINE_VERSION,
  type PanelTrack,
} from "@/lib/pricing-engine";
import { resolvePlantPriceFromConfig } from "@/lib/plant-pricing-resolver";
import { resolvePhaseSurchargeInr } from "@/lib/connection-phase-pricing";
import { applyResidentialDiscountInr, residentialNetCostInr, resolveResidentialSubsidyInr } from "@/lib/residential-deck-helpers";
import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import { getEffectivePanelCatalog, resolvePanelQuote } from "@/lib/commercial-panel-catalog";
import {
  applyCommercialPanelTrackPolicy,
  resolveCommercialPanelTrack,
} from "@/lib/commercial-panel-track-policy";
import {
  plantGrossFromSharedCatalog,
  plantGrossFromSharedCatalogOrFallback,
} from "@/lib/shared-plant-rate-card";
import { wattsFromSystemKw } from "@/lib/proposal-pricing-merge";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import type { ProposalPricingRow } from "@/lib/proposal-pricing-schema";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export const quoteEngineSnapshotSchema = z.object({
  engineVersion: z.literal(1),
  frozenAt: z.string(),
  pricingSource: z.enum(["rate_card", "customer_override"]),
  segment: z.enum(["residential", "commercial"]),
  systemKw: z.number().min(0),
  moduleWatt: z.number().min(100).optional(),
  panelTrack: z.enum(["dcr", "non_dcr"]).optional(),
  brandId: z.string().max(40).optional(),
  brandLabel: z.string().max(80).optional(),
  ratePerWpInr: z.number().min(0),
  plantGrossInr: z.number().min(0),
  subsidyInr: z.number().min(0),
  discountInr: z.number().min(0),
  netPayableInr: z.number().min(0),
  marginPct: z.number().min(0).max(100).optional(),
  inverterNote: z.string().max(200).optional(),
});

export type QuoteEngineSnapshot = z.infer<typeof quoteEngineSnapshotSchema>;

export function resolveResidentialRatePerWp(
  config: ResidentialProposalConfig,
  connectionType?: string
): { ratePerWp: number; plantGross: number; track: PanelTrack } {
  const track = (config.solar.panelTrack ?? "dcr") as PanelTrack;
  void connectionType;
  const resolved = resolvePlantPriceFromConfig(config, { mode: track });
  if (resolved.ok) {
    return { ratePerWp: resolved.ratePerWpInr, plantGross: resolved.plantGrossInr, track };
  }
  return { ratePerWp: 0, plantGross: 0, track };
}

export function buildResidentialQuoteSnapshot(
  config: ResidentialProposalConfig,
  opts: {
    pricingSource: "rate_card" | "customer_override";
    connectionType?: string;
    subsidyEligible?: boolean;
  }
): QuoteEngineSnapshot {
  const { ratePerWp, plantGross, track } = resolveResidentialRatePerWp(config, opts.connectionType);
  const phaseSurcharge = resolvePhaseSurchargeInr(config.pricing);
  const discount = applyResidentialDiscountInr(plantGross + phaseSurcharge, config.pricing?.discount);
  const eligible =
    opts.subsidyEligible ?? isPmSuryaGharSubsidyEligible(opts.connectionType ?? config.connectionType);
  const subsidyPref = config.subsidy?.preference ?? "maximize";
  const subsidy =
    !eligible || subsidyPref === "none" ? 0 : resolveResidentialSubsidyInr(config, true);
  const net = residentialNetCostInr(config, {
    connectionType: opts.connectionType,
    subsidyEligible: eligible,
  });

  return quoteEngineSnapshotSchema.parse({
    engineVersion: PRICING_ENGINE_VERSION,
    frozenAt: new Date().toISOString(),
    pricingSource: opts.pricingSource,
    segment: "residential",
    systemKw: config.solar.plantCapacityKw,
    moduleWatt: config.solar.watt,
    panelTrack: track,
    brandId: config.solar.brandId,
    brandLabel: config.solar.brand,
    ratePerWpInr: ratePerWp,
    plantGrossInr: plantGross,
    subsidyInr: subsidy,
    discountInr: discount,
    netPayableInr: net,
    marginPct: undefined,
    inverterNote: config.inverterBrandOptions?.[0]?.brand,
  });
}

export function buildCommercialQuoteSnapshot(
  ppt: PremiumProposalPptInput,
  commercialConfig: CommercialProposalConfig | null | undefined,
  pricingRow: ProposalPricingRow | null
): QuoteEngineSnapshot {
  const kw = ppt.systemKw;
  const track =
    ppt.residentialConfig?.solar && commercialConfig
      ? applyCommercialPanelTrackPolicy(
          ppt.residentialConfig,
          ppt.connectionType ?? ppt.residentialConfig.connectionType ?? ppt.customerProfile?.connectionType
        ).solar.panelTrack ?? "dcr"
      : resolveCommercialPanelTrack(
          ppt.connectionType ?? ppt.customerProfile?.connectionType,
          kw
        );

  const sharedGross = ppt.sharedPlantCatalog?.entries?.length
    ? plantGrossFromSharedCatalog(kw, track, ppt.sharedPlantCatalog)
    : null;

  if (sharedGross != null && sharedGross > 0) {
    const w = wattsFromSystemKw(kw);
    const ratePerWp = w > 0 ? Math.round((sharedGross / w) * 10000) / 10000 : 0;
    const subsidy = pricingRow?.subsidy_inr ?? ppt.pmSuryaGharSubsidyInr ?? 0;
    const discount = pricingRow?.discount_inr ?? 0;
    const net =
      pricingRow?.final_amount_inr ??
      ppt.commercialNetPayableInr ??
      ppt.netCostInr ??
      Math.max(0, sharedGross - subsidy - discount);

    return quoteEngineSnapshotSchema.parse({
      engineVersion: PRICING_ENGINE_VERSION,
      frozenAt: new Date().toISOString(),
      pricingSource: ppt.pricingSource ?? "rate_card",
      segment: "commercial",
      systemKw: kw,
      panelTrack: track,
      ratePerWpInr: ratePerWp,
      plantGrossInr: sharedGross,
      subsidyInr: subsidy,
      discountInr: discount,
      netPayableInr: net,
    });
  }

  const catalogId = commercialConfig?.panel?.catalogId ?? getEffectivePanelCatalog()[0]?.id ?? "";
  const quote = resolvePanelQuote(kw, catalogId, commercialConfig?.panel?.ratePerWpInr);
  const ratePerWp = quote?.ratePerWpInr ?? pricingRow?.price_per_watt_inr ?? 0;
  const plantGross =
    quote?.hardwareInr ??
    pricingRow?.hardware_inr ??
    ppt.grossSystemCostInr ??
    plantGrossFromSharedCatalogOrFallback(kw, track, ppt.sharedPlantCatalog);
  const subsidy = pricingRow?.subsidy_inr ?? ppt.pmSuryaGharSubsidyInr ?? 0;
  const discount = pricingRow?.discount_inr ?? 0;
  const net =
    pricingRow?.final_amount_inr ??
    ppt.commercialNetPayableInr ??
    ppt.netCostInr ??
    Math.max(0, plantGross - subsidy - discount);

  return quoteEngineSnapshotSchema.parse({
    engineVersion: PRICING_ENGINE_VERSION,
    frozenAt: new Date().toISOString(),
    pricingSource: ppt.pricingSource ?? "rate_card",
    segment: "commercial",
    systemKw: kw,
    moduleWatt: quote?.entry.watt,
    panelTrack: quote?.entry.panelType === "DCR" ? "dcr" : "non_dcr",
    brandId: quote?.entry.brandId,
    brandLabel: quote?.entry.brandLabel,
    ratePerWpInr: ratePerWp,
    plantGrossInr: plantGross,
    subsidyInr: subsidy,
    discountInr: discount,
    netPayableInr: net,
  });
}

export function buildQuoteSnapshotFromProposal(
  ppt: PremiumProposalPptInput,
  presetId: string,
  pricingRow: ProposalPricingRow | null
): QuoteEngineSnapshot | null {
  const source = ppt.pricingSource ?? "rate_card";
  if (presetId === "residential_smart" && ppt.residentialConfig) {
    return buildResidentialQuoteSnapshot(ppt.residentialConfig, {
      pricingSource: source,
      connectionType: ppt.connectionType,
    });
  }
  if (presetId === "commercial_executive") {
    return buildCommercialQuoteSnapshot(ppt, ppt.commercialConfig ?? null, pricingRow);
  }
  if (ppt.residentialConfig) {
    return buildResidentialQuoteSnapshot(ppt.residentialConfig, { pricingSource: source });
  }
  return null;
}
