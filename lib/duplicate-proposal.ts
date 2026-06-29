import { emptyMonthlyUnits } from "@/lib/bill-parse";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import type { ResidentialProposalConfig } from "@/lib/residential-proposal-config";

export type DuplicateProposalMode = "template" | "revision";

export function templateCustomerName(): string {
  return "New customer";
}

export function revisionCustomerName(name: string): string {
  const base = name.trim() || "Customer";
  const vMatch = /\s*\(v(\d+)\)\s*$/i.exec(base);
  if (vMatch) {
    const next = Number.parseInt(vMatch[1], 10) + 1;
    return `${base.slice(0, vMatch.index)} (v${next})`.trim().slice(0, 120);
  }
  return `${base} (v2)`.slice(0, 120);
}

function resolveSystemKw(src: PremiumProposalPptInput): number {
  const fromRes = src.residentialConfig?.solar?.plantCapacityKw;
  if (typeof fromRes === "number" && fromRes > 0) return fromRes;
  return Math.max(0, Number(src.systemKw) || 0);
}

function stripResidentialForTemplate(
  config: ResidentialProposalConfig | null | undefined
): ResidentialProposalConfig | undefined {
  if (!config) return undefined;
  const { connectionType: _connectionType, ...rest } = config;
  return {
    ...rest,
    inputMode: "requirement",
  };
}

/**
 * Build `ppt_input` for a duplicate proposal.
 *
 * - **template** — equipment, pricing overrides, theme/layout only (no bill audit or customer data).
 * - **revision** — full clone for same-customer versioning.
 */
export function buildDuplicatePptInput(
  src: PremiumProposalPptInput,
  mode: DuplicateProposalMode,
  customerName: string
): PremiumProposalPptInput {
  if (mode === "revision") {
    return {
      ...structuredClone(src),
      customerName,
      webProposalUrl: undefined,
    };
  }

  const systemKw = resolveSystemKw(src);

  return {
    systemKw,
    panelBrand: src.panelBrand,
    installerName: src.installerName,
    installerTagline: src.installerTagline,
    installerContact: src.installerContact,
    installerLogoUrl: src.installerLogoUrl,
    brandDisplayMode: src.brandDisplayMode,
    brandSectionConfig: src.brandSectionConfig,
    lang: src.lang,
    financeOption: src.financeOption,
    amcSelectedYears: src.amcSelectedYears,
    companyProfile: src.companyProfile,
    bankDetails: src.bankDetails,
    bomOverrides: src.bomOverrides,
    proposalLayout: src.proposalLayout,
    storyMode: src.storyMode,
    storySegment: src.storySegment,
    commercialConfig: src.commercialConfig ? structuredClone(src.commercialConfig) : src.commercialConfig,
    residentialConfig: stripResidentialForTemplate(src.residentialConfig),
    sharedPlantCatalog: src.sharedPlantCatalog ? structuredClone(src.sharedPlantCatalog) : src.sharedPlantCatalog,
    pricingSource: src.pricingSource,
    salesPremiumStyle: src.salesPremiumStyle,
    galleryThemeKey: src.galleryThemeKey,

    customerName,
    location: "",
    yearlyBill: 0,
    afterSolar: 0,
    saving: 0,
    paybackYears: 0,
    monthlyUnits: emptyMonthlyUnits(),
    dataSource: "requirement",
  };
}

export function duplicateCustomerNameForMode(
  srcName: string,
  mode: DuplicateProposalMode
): string {
  return mode === "revision" ? revisionCustomerName(srcName) : templateCustomerName();
}
