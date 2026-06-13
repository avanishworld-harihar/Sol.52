import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { ResidentialTemplatePresetId } from "@/lib/proposal-default-preset-storage";

/** Visual codename for thumbnail CSS — not shown as a separate selectable option. */
export type ProposalTemplateThumbnailVariant =
  | "golden"
  | "pearl"
  | "ledger"
  | "classic"
  | "commercial";

export type ProposalTemplateCategory = "residential" | "commercial";

export type ProposalTemplateGalleryItem = {
  id: ResidentialTemplatePresetId | "commercial_executive";
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
    description: "Homes & rooftops up to ~10 kW — pick your default sales format.",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "C&I & industrial — full executive proposal deck.",
  },
];

export const RESIDENTIAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [
  {
    id: "residential_executive",
    category: "residential",
    name: "Executive Premium",
    description: "Champagne gold editorial layout for high-trust clients.",
    thumbnailVariant: "golden",
  },
  {
    id: "residential_sales_premium",
    category: "residential",
    name: "Sales Premium",
    description: "Clean, premium 5-page sales proposal.",
    recommended: true,
    thumbnailVariant: "pearl",
  },
  {
    id: "residential_bank_loan",
    category: "residential",
    name: "Bank Loan Pack",
    description: "Documentation-first pack for bank & subsidy.",
    thumbnailVariant: "ledger",
  },
  {
    id: "residential_smart",
    category: "residential",
    name: "Residential Legacy",
    description: "Full Sol.52 audit & section stack.",
    thumbnailVariant: "classic",
  },
];

export const COMMERCIAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [
  {
    id: "commercial_executive",
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
  return RESIDENTIAL_TEMPLATE_GALLERY.find((g) => g.id === id) ?? RESIDENTIAL_TEMPLATE_GALLERY[1]!;
}

export function galleryItemById(id: ProposalPresetId): ProposalTemplateGalleryItem | undefined {
  return [...RESIDENTIAL_TEMPLATE_GALLERY, ...COMMERCIAL_TEMPLATE_GALLERY].find((g) => g.id === id);
}
