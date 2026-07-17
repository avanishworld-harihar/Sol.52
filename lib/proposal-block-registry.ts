/**
 * Modular proposal sections â€” dynamic engine building blocks (not static PDF pages).
 * Toggle + order = `proposalLayout` on `PremiumProposalPptInput` (see proposal-template-schema.ts).
 *
 * Workflow patterns distilled from typical EPC quotations: letter/cover â†’ about â†’ technical narrative â†’
 * BOM/spec table â†’ commercial â†’ ROI/generation â†’ warranty â†’ payment â†’ terms â†’ gallery â†’ client checklist â†’ AMC.
 *
 * Phase A additions:
 *   - `preset_affinity` â€” which presets include this block by default.
 *   - `executive_summary` â€” high-level impact block for C&I proposals.
 *   - `system_requirements` â€” requirement-based path (no bill); shows sizing, generation, specs.
 *   - `payback_analysis` â€” NPV / IRR detail block for commercial decision-makers.
 */

import { z } from "zod";

export const PROPOSAL_BLOCK_IDS = [
  "cover_page",
  "about_company",
  "executive_summary",
  "technical_proposal",
  "bill_intelligence",
  "system_requirements",
  "technical_specifications",
  "bom_material_list",
  "financial_summary",
  "investment_summary",
  "roi_savings",
  "payback_analysis",
  "warranty",
  "payment_terms",
  "terms_conditions",
  "project_gallery",
  "customer_documents_required",
  "amc_maintenance",
  /** Wave 3 P7 â€” side-by-side panel/inverter brand comparison. Commercial preset optional block. */
  "brand_comparison_card",
  /** C&I â€” DCR vs NON-DCR cost comparison */
  "dcr_comparison_card",
  /** C&I â€” multi-kW capacity scenario comparison */
  "capacity_scenarios_card",
  /** C&I â€” EMI / financing scenarios */
  "commercial_financing_card",
  /** C&I â€” Solar + DG hybrid architecture, savings, operation scenarios */
  "dg_hybrid_analysis_card",
  /** C&I â€” School / institution segment insight page (auto when orgType = school) */
  "school_institution_insight_card",
  /** Aurora â€” system layout: SLD diagram + panel tilt by location + DC/AC run distances */
  "system_layout",
  /** Aurora / residential â€” PM Surya Ghar & state subsidy explainer */
  "subsidy_clarity",
  /** Aurora â€” richer system summary (kW hero + 4 tiles + net-meter mini flow) */
  "technical_summary",
] as const;

export type ProposalBlockId = (typeof PROPOSAL_BLOCK_IDS)[number];

export const proposalBlockIdSchema = z.enum(PROPOSAL_BLOCK_IDS);

export type ProposalBlockGroup =
  | "intro"
  | "technical"
  | "commercial"
  | "legal"
  | "media"
  | "service";

/**
 * Which presets use this block in their default playlist.
 * `"all"` = every preset enables it by default.
 * An array = only those specific presets include it by default.
 */
export type PresetAffinity =
  | "all"
  | ReadonlyArray<
      | "residential_executive"
      | "residential_zenith"
      | "residential_premium_luxe"
      | "residential_blueprint"
    >;

export type ProposalBlockMeta = {
  id: ProposalBlockId;
  /** i18n key under lib/i18n-messages (EN) */
  labelKey: string;
  /** For future UI grouping */
  group: ProposalBlockGroup;
  /** Sensible default for new templates (applies when no preset is selected) */
  defaultEnabled: boolean;
  /**
   * Which presets enable this block by default.
   * Used by the preset engine to build `getPresetDefaultLayout()`.
   * `"all"` â€” enabled in all presets by default.
   * Array â€” only enabled for the listed presets.
   */
  preset_affinity: PresetAffinity;
  /**
   * When true, this block only renders when `dataSource = "requirement"`.
   * (i.e. no bill uploaded â€” system-spec path.)
   */
  requirement_path_only?: boolean;
};

export const PROPOSAL_BLOCK_REGISTRY: Record<ProposalBlockId, ProposalBlockMeta> = {
  cover_page: {
    id: "cover_page",
    labelKey: "proposal_block_cover_page",
    group: "intro",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  about_company: {
    id: "about_company",
    labelKey: "proposal_block_about_company",
    group: "intro",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  /**
   * High-level executive impact block for C&I proposals.
   * Leads with the commercial headline: savings, payback, ROI â€” in one screen.
   * Designed for decision-makers who skip technical detail.
   */
  executive_summary: {
    id: "executive_summary",
    labelKey: "proposal_block_executive_summary",
    group: "intro",
    defaultEnabled: false,
    preset_affinity: [],
  },

  technical_proposal: {
    id: "technical_proposal",
    labelKey: "proposal_block_technical_proposal",
    group: "technical",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  bill_intelligence: {
    id: "bill_intelligence",
    labelKey: "proposal_block_bill_intelligence",
    group: "technical",
    defaultEnabled: false,
    preset_affinity: [],
  },

  /**
   * System requirement block â€” shown instead of bill audit pages
   * when no bill was uploaded (dataSource = "requirement").
   * Shows: sizing rationale, annual generation, peak demand coverage, specs.
   */
  system_requirements: {
    id: "system_requirements",
    labelKey: "proposal_block_system_requirements",
    group: "technical",
    defaultEnabled: false,
    preset_affinity: [],
    requirement_path_only: true,
  },

  technical_specifications: {
    id: "technical_specifications",
    labelKey: "proposal_block_technical_specifications",
    group: "technical",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  bom_material_list: {
    id: "bom_material_list",
    labelKey: "proposal_block_bom",
    group: "technical",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  financial_summary: {
    id: "financial_summary",
    labelKey: "proposal_block_financial",
    group: "commercial",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  investment_summary: {
    id: "investment_summary",
    labelKey: "proposal_block_investment_summary",
    group: "commercial",
    defaultEnabled: false,
    preset_affinity: [],
  },

  roi_savings: {
    id: "roi_savings",
    labelKey: "proposal_block_roi",
    group: "commercial",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  /**
   * Detailed NPV / IRR / payback analysis for commercial decision-makers.
   * Goes beyond the standard roi_savings block with multi-year cashflow table.
   */
  payback_analysis: {
    id: "payback_analysis",
    labelKey: "proposal_block_payback_analysis",
    group: "commercial",
    defaultEnabled: false,
    preset_affinity: [],
  },

  warranty: {
    id: "warranty",
    labelKey: "proposal_block_warranty",
    group: "legal",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  payment_terms: {
    id: "payment_terms",
    labelKey: "proposal_block_payment",
    group: "commercial",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  terms_conditions: {
    id: "terms_conditions",
    labelKey: "proposal_block_terms",
    group: "legal",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  project_gallery: {
    id: "project_gallery",
    labelKey: "proposal_block_gallery",
    group: "media",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  customer_documents_required: {
    id: "customer_documents_required",
    labelKey: "proposal_block_customer_docs",
    group: "service",
    defaultEnabled: true,
    preset_affinity: [],
  },

  amc_maintenance: {
    id: "amc_maintenance",
    labelKey: "proposal_block_amc",
    group: "service",
    defaultEnabled: true,
    preset_affinity: "all",
  },

  /**
   * Wave 3 P7 â€” Brand comparison card.
   * Side-by-side comparison of panel + inverter brands with key specs.
   * Local-only data from lib/brand-metadata.ts â€” no marketplace coupling.
   * Commercial preset optional block; disabled by default.
   */
  brand_comparison_card: {
    id: "brand_comparison_card",
    labelKey: "proposal_block_brand_comparison",
    group: "technical",
    defaultEnabled: false,
    preset_affinity: [],
  },

  dcr_comparison_card: {
    id: "dcr_comparison_card",
    labelKey: "proposal_block_dcr_comparison",
    group: "commercial",
    defaultEnabled: true,
    preset_affinity: [],
  },

  capacity_scenarios_card: {
    id: "capacity_scenarios_card",
    labelKey: "proposal_block_capacity_scenarios",
    group: "commercial",
    defaultEnabled: true,
    preset_affinity: [],
  },

  commercial_financing_card: {
    id: "commercial_financing_card",
    labelKey: "proposal_block_commercial_financing",
    group: "commercial",
    defaultEnabled: false,
    preset_affinity: [],
  },

  dg_hybrid_analysis_card: {
    id: "dg_hybrid_analysis_card",
    labelKey: "proposal_block_dg_hybrid",
    group: "technical",
    defaultEnabled: false,
    preset_affinity: [],
  },

  school_institution_insight_card: {
    id: "school_institution_insight_card",
    labelKey: "proposal_block_school_institution",
    group: "intro",
    defaultEnabled: false,
    preset_affinity: [],
  },

  /**
   * Aurora preset signature block â€” system layout engineering page.
   * Shows: SLD (PV array â†’ DCDB â†’ inverter â†’ ACDB â†’ net meter â†’ grid),
   * panel tilt for site latitude, panel-to-inverter DC run length & why.
   * Three SVG illustrations: electrical flow, tilt, distance.
   */
  system_layout: {
    id: "system_layout",
    labelKey: "proposal_block_system_layout",
    group: "technical",
    defaultEnabled: false,
    preset_affinity: [],
  },

  /**
   * Subsidy clarity block â€” dedicated PM Surya Ghar / state subsidy explainer.
   * Shows: gross cost, subsidy amount, net payable, eligibility criteria.
   * Aurora default optional; residential_smart optional.
   */
  subsidy_clarity: {
    id: "subsidy_clarity",
    labelKey: "proposal_block_subsidy_clarity",
    group: "commercial",
    defaultEnabled: false,
    preset_affinity: [],
  },

  /**
   * Aurora technical summary â€” richer than Sales Premium's 3-card summary.
   * Shows: kW hero, 4 stat tiles (panels, inverter, annual gen, roof area),
   * on-grid net-metering mini flow diagram.
   */
  technical_summary: {
    id: "technical_summary",
    labelKey: "proposal_block_technical_summary",
    group: "technical",
    defaultEnabled: false,
    preset_affinity: [],
  },
};

/** Default narrative order used when no preset is active. Maintains backward compatibility. */
export const DEFAULT_PROPOSAL_BLOCK_ORDER: ProposalBlockId[] = [
  "cover_page",
  "about_company",
  "executive_summary",
  "technical_proposal",
  "bill_intelligence",
  "system_requirements",
  "technical_specifications",
  "bom_material_list",
  "financial_summary",
  "investment_summary",
  "roi_savings",
  "payback_analysis",
  "warranty",
  "payment_terms",
  "terms_conditions",
  "project_gallery",
  "customer_documents_required",
  "amc_maintenance",
  "brand_comparison_card",
  "dcr_comparison_card",
  "capacity_scenarios_card",
  "commercial_financing_card",
  "dg_hybrid_analysis_card",
  "school_institution_insight_card",
  "system_layout",
  "subsidy_clarity",
  "technical_summary",
];
