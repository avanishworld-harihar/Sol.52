import { emptyMonthlyUnits } from "@/lib/bill-parse";
import { getInstallerRateCard } from "@/lib/installer-rate-card-store";
import { defaultLineItemsFromSeed } from "@/lib/proposal-pricing-lines";
import type { ProposalPricingInsert } from "@/lib/proposal-pricing-merge";
import {
  applyResidentialFlagsToLayout,
  normalizeResidentialConfig,
} from "@/lib/residential-proposal-config";
import { buildResidentialConfigForQuickQuote } from "@/lib/requirement-size-presets";
import { residentialCostBreakdown } from "@/lib/residential-deck-helpers";
import { syncResidentialSolarToLineItems } from "@/lib/residential-solar-engine";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { summarizeProposalDeck } from "@/lib/proposal-ppt";
import { getPresetDefaultLayout, type ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";
import { applyConnectionPhaseSelection, type ConnectionPhase } from "@/lib/connection-phase-pricing";
import { templateCustomerName } from "@/lib/duplicate-proposal";
import { anonymousQuickQuoteCustomerName } from "@/lib/proposal-customer-placeholder";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export type QuickRequirementProposalPayload = {
  kw: number;
  customerName?: string;
  presetId?: ProposalPresetId;
  salesPremiumStyle?: SalesPremiumStyleId;
  galleryThemeKey?: string;
  leadId?: string | null;
  connectionPhase?: ConnectionPhase;
};

export type QuickRequirementProposalBuild = {
  pptInput: PremiumProposalPptInput;
  summary: ReturnType<typeof summarizeProposalDeck>;
  residentialConfig: ResidentialProposalConfig;
  pricingInsert: ProposalPricingInsert;
  presetId: ProposalPresetId;
};

export async function buildQuickRequirementProposal(
  input: QuickRequirementProposalPayload
): Promise<QuickRequirementProposalBuild> {
  const kw = Math.max(0.5, Math.min(10000, Number(input.kw) || 5));
  const presetId = input.presetId ?? "residential_zenith";
  const rateCard = await getInstallerRateCard();
  const catalog = rateCard?.residentialCatalog ?? null;

  let residentialConfig = buildResidentialConfigForQuickQuote(kw, catalog);
  if (input.connectionPhase === "three_phase" || input.connectionPhase === "single_phase") {
    residentialConfig = applyConnectionPhaseSelection(residentialConfig, input.connectionPhase);
  }
  const breakdown = residentialCostBreakdown(residentialConfig);
  const customerName = (input.customerName?.trim() || anonymousQuickQuoteCustomerName()).slice(0, 120);

  const baseLayout = getPresetDefaultLayout(presetId);
  const proposalLayout = applyResidentialFlagsToLayout(baseLayout, residentialConfig);

  const pptInput: PremiumProposalPptInput = {
    customerName,
    location: "",
    systemKw: residentialConfig.solar.plantCapacityKw,
    yearlyBill: 0,
    afterSolar: 0,
    saving: 0,
    paybackYears: 0,
    monthlyUnits: emptyMonthlyUnits(),
    dataSource: "requirement",
    grossSystemCostInr: breakdown.grossInr,
    pmSuryaGharSubsidyInr: breakdown.subsidyInr,
    netCostInr: breakdown.netInr,
    commercialNetPayableInr: breakdown.netInr,
    residentialConfig: normalizeResidentialConfig(residentialConfig),
    proposalLayout,
    pricingSource: "rate_card",
    ...(input.galleryThemeKey
      ? { galleryThemeKey: input.galleryThemeKey }
      : presetId === "residential_zenith"
        ? { galleryThemeKey: "zenith" }
        : presetId === "residential_premium_luxe"
          ? { galleryThemeKey: "luxe" }
          : presetId === "residential_luxe_noir"
            ? { galleryThemeKey: "luxe_noir" }
            : presetId === "residential_blueprint"
              ? { galleryThemeKey: "blueprint" }
              : presetId === "residential_quantum"
                ? { galleryThemeKey: "quantum" }
                : presetId === "residential_emerald"
                  ? { galleryThemeKey: "emerald" }
                : presetId === "residential_lumina"
                  ? { galleryThemeKey: "lumina" }
                : presetId === "residential_sienna"
                  ? { galleryThemeKey: "sienna" }
                  : presetId === "residential_khadi"
                    ? { galleryThemeKey: "khadi" }
                  : presetId === "residential_jaali"
                    ? { galleryThemeKey: "jaali" }
                  : presetId === "residential_voltaic"
                    ? { galleryThemeKey: "voltaic" }
                  : presetId === "residential_executive"
                  ? { galleryThemeKey: "golden" }
                  : {}),
  };

  const summary = summarizeProposalDeck(pptInput);
  const grossWithPhase = breakdown.grossInr + breakdown.phaseSurchargeInr;
  const w = Math.round(residentialConfig.solar.plantCapacityKw * 1000);
  const pricePerWatt = w > 0 ? Math.round((breakdown.grossInr / w) * 10000) / 10000 : 0;

  const seedLines = defaultLineItemsFromSeed({
    hardware_inr: grossWithPhase,
    installation_inr: 0,
    structure_inr: 0,
    subsidy_inr: breakdown.subsidyInr,
    discount_inr: breakdown.discountInr,
    panelBrandHint: residentialConfig.solar.brand,
  });
  const line_items = syncResidentialSolarToLineItems(residentialConfig.solar, seedLines);

  const pricingInsert: ProposalPricingInsert = {
    proposal_id: "",
    system_kw: residentialConfig.solar.plantCapacityKw,
    price_per_watt_inr: pricePerWatt,
    hardware_inr: grossWithPhase,
    installation_inr: 0,
    structure_inr: 0,
    subsidy_inr: breakdown.subsidyInr,
    discount_inr: breakdown.discountInr,
    final_amount_inr: breakdown.netInr,
    manual_final_override: false,
    line_items,
  };

  return {
    pptInput,
    summary,
    residentialConfig,
    pricingInsert,
    presetId,
  };
}
