import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { ResidentialTemplatePresetId } from "@/lib/proposal-default-preset-storage";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

/** Visual codename for thumbnail CSS. */
export type ProposalTemplateThumbnailVariant =
  | "golden"
  | "pearl"
  | "horizon"
  | "ember"
  | "ledger"
  | "classic"
  | "commercial";

export type ProposalTemplateCategory = "residential" | "commercial";

/** Unique key per gallery card (one preset can map to multiple theme cards). */
export type ProposalTemplateGalleryKey =
  | "golden"
  | "pearl"
  | "horizon"
  | "ember"
  | "ledger"
  | "classic"
  | "commercial_executive";

export type ProposalTemplateGalleryItem = {
  key: ProposalTemplateGalleryKey;
  presetId: ResidentialTemplatePresetId | "commercial_executive";
  /** When preset is Sales Premium, which visual style to apply. */
  salesPremiumStyle?: SalesPremiumStyleId;
  category: ProposalTemplateCategory;
  name: string;
  description: string;
  recommended?: boolean;
  thumbnailVariant: ProposalTemplateThumbnailVariant;
};

export type ProposalTemplateCategoryMeta = {
  id: ProposalTemplateCategory;
  label: string;
  description: string;
};

export const PROPOSAL_TEMPLATE_CATEGORIES: ProposalTemplateCategoryMeta[] = [
  {
    id: "residential",
    label: "Residential",
    description: "Homes & rooftops up to ~10 kW — pick your default theme.",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "C&I & industrial — full executive proposal deck.",
  },
];

export const RESIDENTIAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [
  {
    key: "golden",
    presetId: "residential_executive",
    category: "residential",
    name: "Golden",
    description: "Champagne gold editorial — Executive Premium for HNI clients.",
    thumbnailVariant: "golden",
  },
  {
    key: "pearl",
    presetId: "residential_sales_premium",
    salesPremiumStyle: "institutional",
    category: "residential",
    name: "Pearl",
    description: "Clean 5-page institutional sales deck.",
    recommended: true,
    thumbnailVariant: "pearl",
  },
  {
    key: "horizon",
    presetId: "residential_sales_premium",
    salesPremiumStyle: "journey",
    category: "residential",
    name: "Horizon",
    description: "Scroll story — bill, savings, system, and payment flow.",
    thumbnailVariant: "horizon",
  },
  {
    key: "ember",
    presetId: "residential_sales_premium",
    salesPremiumStyle: "savings_focus",
    category: "residential",
    name: "Ember",
    description: "Short savings-first deck — bill, ROI, and investment.",
    thumbnailVariant: "ember",
  },
  {
    key: "ledger",
    presetId: "residential_bank_loan",
    category: "residential",
    name: "Ledger",
    description: "Documentation-first pack for bank & subsidy.",
    thumbnailVariant: "ledger",
  },
  {
    key: "classic",
    presetId: "residential_smart",
    category: "residential",
    name: "Classic",
    description: "Full Sol.52 audit & legacy section stack.",
    thumbnailVariant: "classic",
  },
];

export const COMMERCIAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [
  {
    key: "commercial_executive",
    presetId: "commercial_executive",
    category: "commercial",
    name: "Commercial Executive",
    description: "Full C&I proposal — executive summary, BOM, ROI, financing & gallery.",
    recommended: true,
    thumbnailVariant: "commercial",
  },
];

/** @deprecated Use category-specific galleries */
export const PROPOSAL_TEMPLATE_GALLERY = RESIDENTIAL_TEMPLATE_GALLERY;

export function galleryForCategory(category: ProposalTemplateCategory): ProposalTemplateGalleryItem[] {
  return category === "commercial" ? COMMERCIAL_TEMPLATE_GALLERY : RESIDENTIAL_TEMPLATE_GALLERY;
}

export function galleryItemForPreset(id: ResidentialTemplatePresetId): ProposalTemplateGalleryItem {
  const match =
    RESIDENTIAL_TEMPLATE_GALLERY.find((g) => g.presetId === id && g.recommended) ??
    RESIDENTIAL_TEMPLATE_GALLERY.find((g) => g.presetId === id);
  return match ?? RESIDENTIAL_TEMPLATE_GALLERY[1]!;
}

export function galleryItemByKey(key: ProposalTemplateGalleryKey): ProposalTemplateGalleryItem | undefined {
  return [...RESIDENTIAL_TEMPLATE_GALLERY, ...COMMERCIAL_TEMPLATE_GALLERY].find((g) => g.key === key);
}

export function resolveActiveGalleryKey(
  presetId: ResidentialTemplatePresetId,
  salesPremiumStyle?: SalesPremiumStyleId
): ProposalTemplateGalleryKey {
  if (presetId === "residential_executive") return "golden";
  if (presetId === "residential_bank_loan") return "ledger";
  if (presetId === "residential_smart") return "classic";
  if (presetId === "residential_sales_premium") {
    if (salesPremiumStyle === "journey") return "horizon";
    if (salesPremiumStyle === "savings_focus") return "ember";
    return "pearl";
  }
  return "pearl";
}

export function galleryItemById(id: ProposalPresetId): ProposalTemplateGalleryItem | undefined {
  return [...RESIDENTIAL_TEMPLATE_GALLERY, ...COMMERCIAL_TEMPLATE_GALLERY].find((g) => g.presetId === id);
}
