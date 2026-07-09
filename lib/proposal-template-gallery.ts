import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { ResidentialTemplatePresetId } from "@/lib/proposal-default-preset-storage";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

/**
 * Gallery theme registry — add entries to RESIDENTIAL_TEMPLATE_GALLERY / COMMERCIAL_TEMPLATE_GALLERY.
 * No max count: the UI renders whatever is in these arrays.
 *
 * To add a theme: push a new item with a unique `key`, optional `salesPremiumStyle`, and `thumbnailVariant`.
 * Register a matching thumb in proposal-template-thumbnail.tsx (or use a generic fallback).
 */

/** Thumbnail id — string so new themes need no type union update. */
export type ProposalTemplateThumbnailVariant = string;

export type ProposalTemplateCategory = "residential" | "commercial";

/** Stable id per gallery card — string so new themes need no type union update. */
export type ProposalTemplateGalleryKey = string;

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
    key: "solstice",
    presetId: "residential_solstice",
    category: "residential",
    name: "Solstice",
    description:
      "Modern energy masterplan — sticky nav, hero stats, investment, green impact & component cards.",
    recommended: true,
    thumbnailVariant: "solstice",
  },
  {
    key: "freedom",
    presetId: "residential_energy_freedom",
    category: "residential",
    name: "Freedom",
    description:
      "Ultra-minimal white & teal — ENERGY REIMAGINED cover, perspective story & investment matrix.",
    thumbnailVariant: "freedom",
  },
  {
    key: "pearl",
    presetId: "residential_sales_premium",
    salesPremiumStyle: "pearl",
    category: "residential",
    name: "Pearl",
    description: "Clean 5-page institutional sales deck — white & gray minimalist layout.",
    thumbnailVariant: "pearl",
  },
  {
    key: "slate",
    presetId: "residential_sales_premium",
    salesPremiumStyle: "slate",
    category: "residential",
    name: "Slate",
    description:
      "Ultra-premium HNI deck — hero cover, bill chart, investment flow, BOM & execution.",
    recommended: true,
    thumbnailVariant: "slate",
  },
  {
    key: "horizon",
    presetId: "residential_horizon",
    category: "residential",
    name: "Horizon",
    description: "Solar Monolith — Obsidian & Cobalt editorial · ENERGY ARCHITECT · 11-page wow workflow.",
    thumbnailVariant: "horizon",
  },
  {
    key: "ember",
    presetId: "residential_sales_premium",
    salesPremiumStyle: "savings_focus",
    category: "residential",
    name: "Ember",
    description: "Golden editorial content — compact dark savings deck.",
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

export const ALL_PROPOSAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [
  ...RESIDENTIAL_TEMPLATE_GALLERY,
  ...COMMERCIAL_TEMPLATE_GALLERY,
];

/** @deprecated Use category-specific galleries */
export const PROPOSAL_TEMPLATE_GALLERY = RESIDENTIAL_TEMPLATE_GALLERY;

export function galleryForCategory(category: ProposalTemplateCategory): ProposalTemplateGalleryItem[] {
  return category === "commercial" ? COMMERCIAL_TEMPLATE_GALLERY : RESIDENTIAL_TEMPLATE_GALLERY;
}

export function galleryThemeNames(category: ProposalTemplateCategory): string {
  return galleryForCategory(category)
    .map((g) => g.name)
    .join(", ");
}

export function galleryItemForPreset(id: ResidentialTemplatePresetId): ProposalTemplateGalleryItem {
  const match =
    RESIDENTIAL_TEMPLATE_GALLERY.find((g) => g.presetId === id && g.recommended) ??
    RESIDENTIAL_TEMPLATE_GALLERY.find((g) => g.presetId === id);
  return match ?? RESIDENTIAL_TEMPLATE_GALLERY[1]!;
}

export function galleryItemByKey(key: ProposalTemplateGalleryKey): ProposalTemplateGalleryItem | undefined {
  return ALL_PROPOSAL_TEMPLATE_GALLERY.find((g) => g.key === key);
}

/** Default gallery key when no saved preference exists. */
export function resolveActiveGalleryKey(
  presetId: ResidentialTemplatePresetId,
  salesPremiumStyle?: SalesPremiumStyleId
): ProposalTemplateGalleryKey {
  if (presetId === "residential_executive") return "golden";
  if (presetId === "residential_solstice") return "solstice";
  if (presetId === "residential_energy_freedom") return "freedom";
  if (presetId === "residential_horizon") return "horizon";
  if (presetId === "residential_bank_loan") return "ledger";
  if (presetId === "residential_smart") return "classic";
  if (presetId === "residential_sales_premium") {
    if (salesPremiumStyle === "savings_focus") return "ember";
    if (salesPremiumStyle === "pearl") return "pearl";
    return "slate";
  }
  return "slate";
}

export function galleryItemById(id: ProposalPresetId): ProposalTemplateGalleryItem | undefined {
  return ALL_PROPOSAL_TEMPLATE_GALLERY.find((g) => g.presetId === id);
}
