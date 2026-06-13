import type { ResidentialTemplatePresetId } from "@/lib/proposal-default-preset-storage";

/** Visual codename for thumbnail CSS — not shown as a separate selectable option. */
export type ProposalTemplateThumbnailVariant = "onyx" | "pearl" | "ledger" | "classic";

export type ProposalTemplateGalleryItem = {
  id: ResidentialTemplatePresetId;
  name: string;
  description: string;
  recommended?: boolean;
  thumbnailVariant: ProposalTemplateThumbnailVariant;
};

export const PROPOSAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [
  {
    id: "residential_executive",
    name: "Executive Premium",
    description: "Onyx split-page layout for high-trust clients.",
    thumbnailVariant: "onyx",
  },
  {
    id: "residential_sales_premium",
    name: "Sales Premium",
    description: "Clean, premium 5-page sales proposal.",
    recommended: true,
    thumbnailVariant: "pearl",
  },
  {
    id: "residential_bank_loan",
    name: "Bank Loan Pack",
    description: "Documentation-first pack for bank & subsidy.",
    thumbnailVariant: "ledger",
  },
  {
    id: "residential_smart",
    name: "Residential Legacy",
    description: "Full Sol.52 audit & section stack.",
    thumbnailVariant: "classic",
  },
];

export function galleryItemForPreset(id: ResidentialTemplatePresetId): ProposalTemplateGalleryItem {
  return PROPOSAL_TEMPLATE_GALLERY.find((g) => g.id === id) ?? PROPOSAL_TEMPLATE_GALLERY[1]!;
}
