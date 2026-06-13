import type { ProposalBlockId } from "@/lib/proposal-block-registry";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";

/** Visual style within Sales Premium (`preset_id = residential_sales_premium`). */
export const SALES_PREMIUM_STYLE_IDS = ["institutional", "journey", "savings_focus"] as const;

export type SalesPremiumStyleId = (typeof SALES_PREMIUM_STYLE_IDS)[number];

export const DEFAULT_SALES_PREMIUM_STYLE: SalesPremiumStyleId = "institutional";

const STYLE_STORAGE_KEY = "ss_default_sales_premium_style_v1";

export const SALES_PREMIUM_STYLE_UPDATED_EVENT = "ss-sales-premium-style-updated";

const JOURNEY_FLOW_BLOCKS: ProposalBlockId[] = [
  "cover_page",
  "bill_intelligence",
  "system_requirements",
  "roi_savings",
  "investment_summary",
  "technical_specifications",
  "amc_maintenance",
  "payment_terms",
];

const JOURNEY_APPENDIX_BLOCKS: ProposalBlockId[] = [
  "terms_conditions",
  "customer_documents_required",
  "bom_material_list",
  "financial_summary",
];

const SAVINGS_FOCUS_BLOCKS: ProposalBlockId[] = [
  "cover_page",
  "bill_intelligence",
  "roi_savings",
  "investment_summary",
  "payment_terms",
];

export type SalesPremiumStyleMeta = {
  id: SalesPremiumStyleId;
  label: string;
  subtitle: string;
  /** `institutional` = isolated 5-page doc; others = ProposalWebRenderer block loop. */
  renderer: "institutional" | "web_blocks";
  flowBlocks: ProposalBlockId[];
  appendixBlocks: ProposalBlockId[];
};

export const SALES_PREMIUM_STYLE_REGISTRY: Record<SalesPremiumStyleId, SalesPremiumStyleMeta> = {
  institutional: {
    id: "institutional",
    label: "Slate",
    subtitle: "5-page minimalist PDF — audit, capital, BOM, execution.",
    renderer: "institutional",
    flowBlocks: [],
    appendixBlocks: [],
  },
  journey: {
    id: "journey",
    label: "Horizon",
    subtitle: "Scroll story — bill → savings → system → support → pay.",
    renderer: "web_blocks",
    flowBlocks: JOURNEY_FLOW_BLOCKS,
    appendixBlocks: JOURNEY_APPENDIX_BLOCKS,
  },
  savings_focus: {
    id: "savings_focus",
    label: "Ember",
    subtitle: "Short deck — bill, ROI hero, investment, payment.",
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

export function readDefaultSalesPremiumStyle(): SalesPremiumStyleId {
  if (typeof window === "undefined") return DEFAULT_SALES_PREMIUM_STYLE;
  try {
    const raw = localStorage.getItem(STYLE_STORAGE_KEY)?.trim();
    if (raw && isSalesPremiumStyleId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_SALES_PREMIUM_STYLE;
}

export function writeDefaultSalesPremiumStyle(id: SalesPremiumStyleId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STYLE_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(SALES_PREMIUM_STYLE_UPDATED_EVENT, { detail: { id } }));
}

export function resolveSalesPremiumStyle(
  input: Pick<PremiumProposalPptInput, "salesPremiumStyle"> | null | undefined
): SalesPremiumStyleId {
  const raw = input?.salesPremiumStyle;
  if (typeof raw === "string" && isSalesPremiumStyleId(raw)) return raw;
  return DEFAULT_SALES_PREMIUM_STYLE;
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
