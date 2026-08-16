import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { ResidentialTemplatePresetId } from "@/lib/proposal-default-preset-storage";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

/**
 * Gallery theme registry — Golden + Zenith + Atelier + Canvas + Commercial Executive.
 */

/** Thumbnail id — string so new themes need no type union update. */
export type ProposalTemplateThumbnailVariant = string;

export type ProposalTemplateCategory = "residential" | "commercial";

/** Stable id per gallery card — string so new themes need no type union update. */
export type ProposalTemplateGalleryKey = string;

export type ProposalTemplateGalleryItem = {
  key: ProposalTemplateGalleryKey;
  presetId: ProposalPresetId;
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
    description: "Homes & rooftops — Golden, Zenith, Atelier, Premium Luxe, Canvas, Quantum, Emerald, or Lumina.",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "C&I sites — Commercial Executive (LT) or HT Industrial (11/33 kV ToD & PF analysis).",
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
    name: "Atelier",
    description: "Warm cream masterplan — residential sales layout.",
    thumbnailVariant: "luxe",
  },
  {
    key: "luxe_noir",
    presetId: "residential_luxe_noir",
    category: "residential",
    name: "Premium Luxe",
    description: "Dark cinematic gold — engineering telemetry & peak-yield architecture.",
    thumbnailVariant: "luxe_noir",
  },
  {
    key: "blueprint",
    presetId: "residential_blueprint",
    category: "residential",
    name: "Canvas",
    description:
      "Investment Blueprint — Charcoal, Aluminum & Burnt Orange. Evidence cards, hardware modules & 25-year wealth bars.",
    thumbnailVariant: "blueprint",
  },
  {
    key: "quantum",
    presetId: "residential_quantum",
    category: "residential",
    name: "Quantum",
    description:
      "Cinematic Neo-Glass — deep-space HUD, structural PV wireframes, and capital recovery terminal.",
    thumbnailVariant: "quantum",
  },
  {
    key: "emerald",
    presetId: "residential_emerald",
    category: "residential",
    name: "Emerald",
    description:
      "Emerald Signature — Deep Forest & Champagne Gold split-folio, architectural catalog layout.",
    thumbnailVariant: "emerald",
  },
  {
    key: "lumina",
    presetId: "residential_lumina",
    category: "residential",
    name: "Lumina",
    description:
      "Warm paper flagship — copper chrome, forest yield, Inter. Cover shows plant + site; price on Capital.",
    thumbnailVariant: "lumina",
  },
];

/** Commercial themes — Executive (LT / C&I) and HT Industrial (HV ToD/PF). */
export const COMMERCIAL_TEMPLATE_GALLERY: ProposalTemplateGalleryItem[] = [
  {
    key: "commercial",
    presetId: "commercial_executive",
    category: "commercial",
    name: "Commercial Executive",
    description:
      "Hotel, hospital, factory, mill / industry, school & more — executive C&I proposal with segment-aware narrative.",
    recommended: true,
    thumbnailVariant: "commercial",
  },
  {
    key: "commercial_ht",
    presetId: "commercial_ht",
    category: "commercial",
    name: "HT Industrial",
    description:
      "HT (11/33 kV) industrial connections — ToD solar-window savings, power factor & APFC, demand charges, Section 32 AD, and a plain-language MPERC decision analysis.",
    thumbnailVariant: "ht",
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
  return match ?? RESIDENTIAL_TEMPLATE_GALLERY[0]!;
}

export function galleryItemByKey(key: ProposalTemplateGalleryKey): ProposalTemplateGalleryItem | undefined {
  return ALL_PROPOSAL_TEMPLATE_GALLERY.find((g) => g.key === key);
}

/** Default gallery key when no saved preference exists. */
export function resolveActiveGalleryKey(
  presetId: ResidentialTemplatePresetId | ProposalPresetId,
  _salesPremiumStyle?: SalesPremiumStyleId
): ProposalTemplateGalleryKey {
  if (presetId === "commercial_executive") return "commercial";
  if (presetId === "commercial_ht") return "commercial_ht";
  if (presetId === "residential_executive") return "golden";
  if (presetId === "residential_zenith") return "zenith";
  if (presetId === "residential_premium_luxe") return "luxe";
  if (presetId === "residential_luxe_noir") return "luxe_noir";
  if (presetId === "residential_blueprint") return "blueprint";
  if (presetId === "residential_quantum") return "quantum";
  if (presetId === "residential_emerald") return "emerald";
  if (presetId === "residential_lumina") return "lumina";
  return "zenith";
}

export function galleryItemById(id: ProposalPresetId): ProposalTemplateGalleryItem | undefined {
  return ALL_PROPOSAL_TEMPLATE_GALLERY.find((g) => g.presetId === id);
}
