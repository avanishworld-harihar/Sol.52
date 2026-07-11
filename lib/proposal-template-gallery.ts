import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { ResidentialTemplatePresetId } from "@/lib/proposal-default-preset-storage";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

/**
 * Gallery theme registry — Golden + Zenith + Premium Luxe.
 */

/** Thumbnail id — string so new themes need no type union update. */
export type ProposalTemplateThumbnailVariant = string;

export type ProposalTemplateCategory = "residential" | "commercial";

/** Stable id per gallery card — string so new themes need no type union update. */
export type ProposalTemplateGalleryKey = string;

export type ProposalTemplateGalleryItem = {
  key: ProposalTemplateGalleryKey;
  presetId: ResidentialTemplatePresetId;
  /** Legacy field — unused for Golden / Zenith / Luxe. */
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
    description: "Homes & rooftops — Golden, Zenith, or Premium Luxe.",
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
    key: "zenith",
    presetId: "residential_zenith",
    category: "residential",
    name: "Zenith",
    description: "Midnight Onyx luxury brochure — architecture cards & Tier-1 BOM.",
    recommended: true,
    thumbnailVariant: "zenith",
  },
  {
    key: "luxe",
    presetId: "residential_premium_luxe",
    category: "residential",
    name: "Premium Luxe",
    description: "Warm cream masterplan — champagne metrics & smart capital allocation.",
    thumbnailVariant: "luxe",
  },
];

/** Commercial gallery emptied — commercial preset removed. */
export const COMMERCIAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [];

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
  return match ?? RESIDENTIAL_TEMPLATE_GALLERY[0]!;
}

export function galleryItemByKey(key: ProposalTemplateGalleryKey): ProposalTemplateGalleryItem | undefined {
  return ALL_PROPOSAL_TEMPLATE_GALLERY.find((g) => g.key === key);
}

/** Default gallery key when no saved preference exists. */
export function resolveActiveGalleryKey(
  presetId: ResidentialTemplatePresetId,
  _salesPremiumStyle?: SalesPremiumStyleId
): ProposalTemplateGalleryKey {
  if (presetId === "residential_executive") return "golden";
  if (presetId === "residential_zenith") return "zenith";
  if (presetId === "residential_premium_luxe") return "luxe";
  return "zenith";
}

export function galleryItemById(id: ProposalPresetId): ProposalTemplateGalleryItem | undefined {
  return ALL_PROPOSAL_TEMPLATE_GALLERY.find((g) => g.presetId === id);
}
