import { galleryItemByKey } from "@/lib/proposal-template-gallery";
import { readDefaultGalleryKey } from "@/lib/proposal-template-gallery-storage";
import type { ProposalBlockId } from "@/lib/proposal-block-registry";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";

/** Visual style within Sales Premium (`preset_id = residential_sales_premium`). */
export const SALES_PREMIUM_STYLE_IDS = ["pearl", "slate", "journey", "savings_focus"] as const;

export type SalesPremiumStyleId = (typeof SALES_PREMIUM_STYLE_IDS)[number];

/** @deprecated Stored on older proposals — maps to Slate at read time. */
export type LegacySalesPremiumStyleId = "institutional";

export const DEFAULT_SALES_PREMIUM_STYLE: SalesPremiumStyleId = "slate";

const STYLE_STORAGE_KEY = "ss_default_sales_premium_style_v1";

export const SALES_PREMIUM_STYLE_UPDATED_EVENT = "ss-sales-premium-style-updated";

const JOURNEY_FLOW_BLOCKS: ProposalBlockId[] = [
  "cover_page",
  "bill_intelligence",
  "system_requirements",
  "roi_savings",
  "warranty",
  "technical_specifications",
  "bom_material_list",
  "amc_maintenance",
  "payment_terms",
];

const JOURNEY_APPENDIX_BLOCKS: ProposalBlockId[] = [
  "terms_conditions",
  "financial_summary",
];

const SAVINGS_FOCUS_BLOCKS: ProposalBlockId[] = [
  "cover_page",
  "bill_intelligence",
  "system_requirements",
  "roi_savings",
  "payment_terms",
];

export type SalesPremiumInstitutionalVariant = "pearl" | "slate";

export type SalesPremiumStyleMeta = {
  id: SalesPremiumStyleId;
  label: string;
  subtitle: string;
  /** Pearl & Slate = isolated 5-page doc; Horizon & Ember = ProposalWebRenderer block loop. */
  renderer: "institutional" | "web_blocks";
  institutionalVariant?: SalesPremiumInstitutionalVariant;
  flowBlocks: ProposalBlockId[];
  appendixBlocks: ProposalBlockId[];
};

export const SALES_PREMIUM_STYLE_REGISTRY: Record<SalesPremiumStyleId, SalesPremiumStyleMeta> = {
  pearl: {
    id: "pearl",
    label: "Pearl",
    subtitle: "Clean white 5-page deck — minimalist lines and blue accents.",
    renderer: "institutional",
    institutionalVariant: "pearl",
    flowBlocks: [],
    appendixBlocks: [],
  },
  slate: {
    id: "slate",
    label: "Slate",
    subtitle: "Apple-style HNI document — hero cover, audit chart, BOM & execution.",
    renderer: "institutional",
    institutionalVariant: "slate",
    flowBlocks: [],
    appendixBlocks: [],
  },
  journey: {
    id: "journey",
    label: "Horizon",
    subtitle: "Golden content — scroll story with Horizon styling.",
    renderer: "web_blocks",
    flowBlocks: JOURNEY_FLOW_BLOCKS,
    appendixBlocks: JOURNEY_APPENDIX_BLOCKS,
  },
  savings_focus: {
    id: "savings_focus",
    label: "Ember",
    subtitle: "Golden content — compact dark savings deck.",
    renderer: "web_blocks",
    flowBlocks: SAVINGS_FOCUS_BLOCKS,
    appendixBlocks: [],
  },
};

export const SALES_PREMIUM_STYLE_LIST = SALES_PREMIUM_STYLE_IDS.map(
  (id) => SALES_PREMIUM_STYLE_REGISTRY[id]
);

function isSalesPremiumStyleId(raw: string): raw is SalesPremiumStyleId {
  return (SALES_PREMIUM_STYLE_IDS as readonly string[]).includes(raw);
}

/** Normalize legacy `institutional` and unknown values. */
export function normalizeSalesPremiumStyle(raw: string | null | undefined): SalesPremiumStyleId {
  if (raw === "institutional") return "slate";
  if (typeof raw === "string" && isSalesPremiumStyleId(raw)) return raw;
  return DEFAULT_SALES_PREMIUM_STYLE;
}

export function readDefaultSalesPremiumStyle(): SalesPremiumStyleId {
  if (typeof window === "undefined") return DEFAULT_SALES_PREMIUM_STYLE;
  try {
    const raw = localStorage.getItem(STYLE_STORAGE_KEY)?.trim();
    if (raw) return normalizeSalesPremiumStyle(raw);
  } catch {
    /* ignore */
  }
  return DEFAULT_SALES_PREMIUM_STYLE;
}

/**
 * Style used when generating a Sales Premium proposal — prefers the saved gallery
 * card (Pearl / Slate / Horizon / Ember) so style storage cannot drift.
 */
export function readActiveSalesPremiumStyle(): SalesPremiumStyleId {
  if (typeof window === "undefined") return DEFAULT_SALES_PREMIUM_STYLE;
  const galleryKey = readDefaultGalleryKey();
  if (galleryKey) {
    const item = galleryItemByKey(galleryKey);
    if (item && (item.presetId as string) === "residential_sales_premium" && item.salesPremiumStyle) {
      return normalizeSalesPremiumStyle(item.salesPremiumStyle);
    }
  }
  return readDefaultSalesPremiumStyle();
}

export function writeDefaultSalesPremiumStyle(id: SalesPremiumStyleId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STYLE_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(SALES_PREMIUM_STYLE_UPDATED_EVENT, { detail: { id } }));
}

export function resolveSalesPremiumStyle(
  input:
    | Pick<PremiumProposalPptInput, "salesPremiumStyle" | "galleryThemeKey">
    | null
    | undefined
): SalesPremiumStyleId {
  if (input?.salesPremiumStyle) {
    return normalizeSalesPremiumStyle(input.salesPremiumStyle);
  }
  const galleryKey = input?.galleryThemeKey?.trim();
  if (galleryKey) {
    const item = galleryItemByKey(galleryKey);
    if (item && (item.presetId as string) === "residential_sales_premium" && item.salesPremiumStyle) {
      return normalizeSalesPremiumStyle(item.salesPremiumStyle);
    }
  }
  return DEFAULT_SALES_PREMIUM_STYLE;
}

export function institutionalVariantForStyle(style: SalesPremiumStyleId): SalesPremiumInstitutionalVariant {
  return SALES_PREMIUM_STYLE_REGISTRY[style].institutionalVariant ?? "slate";
}

export function labelForSalesPremiumStyle(id: SalesPremiumStyleId): string {
  return SALES_PREMIUM_STYLE_REGISTRY[id]?.label ?? "Slate";
}

export function getSalesPremiumLayoutForStyle(style: SalesPremiumStyleId): ProposalTemplateV1 {
  const meta = SALES_PREMIUM_STYLE_REGISTRY[style];
  const blocks = [
    ...meta.flowBlocks.map((id) => ({
      id,
      enabled: true as const,
      section: "flow" as const,
    })),
    ...meta.appendixBlocks.map((id) => ({
      id,
      enabled: true as const,
      section: "appendix" as const,
    })),
  ];
  return { version: 1, blocks };
}

export function usesInstitutionalRenderer(style: SalesPremiumStyleId): boolean {
  return SALES_PREMIUM_STYLE_REGISTRY[style].renderer === "institutional";
}
