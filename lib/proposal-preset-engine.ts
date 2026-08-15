/**
 * Proposal Preset Engine — drives which blocks appear, in what order,
 * and which inputs are required for each proposal type.
 *
 * Active presets:
 *   1. residential_executive     — Golden / Executive Premium (locked flagship)
 *   2. residential_zenith        — Zenith Luxury brochure
 *   3. residential_premium_luxe  — Atelier Industrial Minimalist (cream)
 *   4. residential_luxe_noir     — Premium Luxe dark cinematic
 *   5. residential_blueprint     — Blueprint Investment Blueprint (modular light cards)
 *   6. residential_quantum       — Quantum Cinematic Neo-Glass
 *   7. residential_emerald       — Emerald Signature split-folio
 *   8. residential_field         — Field Engineering survey drawing sheets
 *   9. residential_wall_street   — Wall Street Ledger salmon newsprint
 *  10. residential_cyanotype      — Cyanotype indigo blueprint drafting
 *  11. residential_brutalism      — Brutalism concrete industrial spec
 *  12. residential_lumina         — Lumina clean light app UI
 *  13. commercial_executive      — C&I commercial (hotel / hospital / industry…)
 *
 * Removed residential presets remap via normalizePresetId → residential_executive.
 */

import type { ProposalBlockId } from "@/lib/proposal-block-registry";
import { DEFAULT_PROPOSAL_BLOCK_ORDER, PROPOSAL_BLOCK_REGISTRY } from "@/lib/proposal-block-registry";
import {
  normalizeProposalTemplateV1,
  parseProposalTemplateV1,
  type ProposalTemplateBlock,
  type ProposalTemplateV1,
} from "@/lib/proposal-template-schema";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { getStoryCopy, type StoryMode, type StorySegment, type StoryCopy, type StoryLang } from "@/lib/proposal-story-copy";
import { SALES_PREMIUM_STYLE_LIST } from "@/lib/sales-premium-styles";

// ─── Preset identifiers ──────────────────────────────────────────────────────

export const PROPOSAL_PRESET_IDS = [
  "residential_executive",
  "residential_zenith",
  "residential_premium_luxe",
  "residential_luxe_noir",
  "residential_blueprint",
  "residential_quantum",
  "residential_emerald",
  "residential_field",
  "residential_wall_street",
  "residential_cyanotype",
  "residential_brutalism",
  "residential_lumina",
  "commercial_executive",
  "commercial_ht",
] as const;

export type ProposalPresetId = (typeof PROPOSAL_PRESET_IDS)[number];

/** No active residential presets use the ProposalWebRenderer block loop. */
export const RESIDENTIAL_WEB_RENDERER_PRESETS: ReadonlyArray<ProposalPresetId> = [];

export function isValidPresetId(id: unknown): id is ProposalPresetId {
  return typeof id === "string" && PROPOSAL_PRESET_IDS.includes(id as ProposalPresetId);
}

/**
 * Historic document ids have a deliberate, auditable fallback.  Unknown ids
 * are not assumed to be a customer-facing theme; callers can surface the
 * diagnostic and keep the public document from silently becoming another
 * preset.
 */
export const LEGACY_RESIDENTIAL_PRESET_FALLBACKS = {
  residential_smart: "residential_executive",
  residential_sales_premium: "residential_executive",
  residential_bank_loan: "residential_executive",
  residential_solstice: "residential_executive",
  residential_energy_freedom: "residential_executive",
  residential_obsidian: "residential_executive",
} as const satisfies Record<string, ProposalPresetId>;

export type PresetResolution = {
  presetId: ProposalPresetId;
  status: "active" | "legacy" | "unknown";
};

export function resolvePresetId(raw: string | null | undefined): PresetResolution {
  if (raw && isValidPresetId(raw)) return { presetId: raw, status: "active" };
  if (raw && raw in LEGACY_RESIDENTIAL_PRESET_FALLBACKS) {
    return {
      presetId:
        LEGACY_RESIDENTIAL_PRESET_FALLBACKS[
          raw as keyof typeof LEGACY_RESIDENTIAL_PRESET_FALLBACKS
        ],
      status: "legacy",
    };
  }
  return { presetId: "residential_executive", status: "unknown" };
}

/** Compatibility wrapper for existing consumers. Prefer `resolvePresetId`. */
export function normalizePresetId(raw: string | null | undefined): ProposalPresetId {
  return resolvePresetId(raw).presetId;
}

/** Returns true only for the legacy block-loop web renderer (not isolated document presets). */
export function isWebRendererPreset(presetId: ProposalPresetId): boolean {
  return (RESIDENTIAL_WEB_RENDERER_PRESETS as ReadonlyArray<string>).includes(presetId);
}

/** True when the preset is a residential document renderer (Golden / Zenith / Atelier / Blueprint). */
export function isResidentialDocumentPreset(presetId: ProposalPresetId): boolean {
  return (
    presetId === "residential_executive" ||
    presetId === "residential_zenith" ||
    presetId === "residential_premium_luxe" ||
    presetId === "residential_luxe_noir" ||
    presetId === "residential_blueprint" ||
    presetId === "residential_quantum" ||
    presetId === "residential_emerald" ||
    presetId === "residential_field" ||
    presetId === "residential_wall_street" ||
    presetId === "residential_cyanotype" ||
    presetId === "residential_brutalism" ||
    presetId === "residential_lumina"
  );
}

/** True for C&I commercial executive / HT-Commercial. */
export function isCommercialPreset(presetId: ProposalPresetId): boolean {
  return presetId === "commercial_executive" || presetId === "commercial_ht";
}

// ─── Preset shape ────────────────────────────────────────────────────────────

export type BillRequirement = "required" | "optional" | "not_applicable";
export type ThemeHint = "residential" | "commercial";

export type ProposalPreset = {
  id: ProposalPresetId;
  /** Human label. i18n key: `preset_label_${id}` */
  label: string;
  description: string;
  /**
   * `required`        — bill upload or manual monthly units must be provided.
   * `optional`        — works with or without bill (residential default).
   * `not_applicable`  — commercial path; bill is never expected.
   */
  bill_requirement: BillRequirement;
  /** Block IDs included and enabled by default for this preset. */
  default_blocks: ProposalBlockId[];
  /** Block IDs supported by this preset but off by default. */
  optional_blocks: ProposalBlockId[];
  /** Blocks rendered in the appendix (after the active reading flow). */
  appendix_blocks?: ProposalBlockId[];
  /** Visual theme hint — renderers use this to apply appropriate styling. */
  theme_hint: ThemeHint;
  /**
   * Whether the `dataSource` field defaults to "bill" or "requirement" for this preset
   * when not explicitly specified by the builder.
   */
  default_data_source: "bill" | "requirement";
};

// ─── Preset registry ─────────────────────────────────────────────────────────

export const PROPOSAL_PRESET_REGISTRY: Record<ProposalPresetId, ProposalPreset> = {
  residential_executive: {
    id: "residential_executive",
    label: "Executive Premium",
    description:
      "NextGen executive document — property-first, ledger-style economics. " +
      "6 pages: cover → bill intelligence or requirement context → ledger → asset → governance → investment.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "bill",
    /** Legacy block IDs — not used by Editorial Split-Page renderer. */
    default_blocks: [],
    optional_blocks: [],
  },

  residential_zenith: {
    id: "residential_zenith",
    label: "Zenith",
    description:
      "Zenith Luxury brochure — Midnight Onyx cover, architecture cards, Tier-1 BOM editorial.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_premium_luxe: {
    id: "residential_premium_luxe",
    label: "Atelier",
    description:
      "Warm cream Premium Luxe masterplan — residential sales layout, print-ready.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_luxe_noir: {
    id: "residential_luxe_noir",
    label: "Premium Luxe",
    description:
      "Dark cinematic gold proposal — engineering telemetry, oversize DC architecture, print-ready noir.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_blueprint: {
    id: "residential_blueprint",
    label: "Canvas",
    description:
      "Investment Blueprint — Charcoal / Aluminum / Burnt Orange, Evidence cards, hardware modules & 25-year wealth bars.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_quantum: {
    id: "residential_quantum",
    label: "Quantum",
    description:
      "Cinematic Neo-Glass — deep-space HUD telemetry, structural PV wireframes, and capital recovery terminal.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_emerald: {
    id: "residential_emerald",
    label: "Emerald",
    description:
      "Emerald Signature — Deep Forest / Champagne Gold split-folio. Architectural catalog: 30% emerald sidebar, 70% ivory content.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_field: {
    id: "residential_field",
    label: "Field Engineering",
    description:
      "Survey drawing sheets — graph-paper, dimensioned diagrams, spec tables, and a persistent title block. Trust through method.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_wall_street: {
    id: "residential_wall_street",
    label: "Wall Street Ledger",
    description:
      "Salmon newsprint financial editorial — masthead, stock ticker, dotted ledger rows, and executive summary.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_cyanotype: {
    id: "residential_cyanotype",
    label: "Cyanotype",
    description:
      "Deep indigo blueprint — drafting grid, dimension lines, crosshairs, and monospace data boxes.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_brutalism: {
    id: "residential_brutalism",
    label: "Brutalism",
    description:
      "Concrete gray industrial spec — heavy black frame, caution orange, and massive type.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  residential_lumina: {
    id: "residential_lumina",
    label: "Lumina",
    description:
      "Clean light app UI — hero photo, Inter, trust-green cards. Consumer-friendly, no dark theme.",
    bill_requirement: "optional",
    theme_hint: "residential",
    default_data_source: "requirement",
    default_blocks: [],
    optional_blocks: [],
  },

  commercial_executive: {
    id: "commercial_executive",
    label: "Commercial Executive Proposal",
    description:
      "Executive-grade proposal for C&I / commercial / industrial rooftop solar. " +
      "Segment-aware (hotel, hospital, factory, mill, school…). " +
      "Bill upload optional — sizing from declared load requirement.",
    bill_requirement: "not_applicable",
    theme_hint: "commercial",
    default_data_source: "requirement",
    default_blocks: [
      "cover_page",
      "about_company",
      "executive_summary",
      "system_requirements",
      "dcr_comparison_card",
      "capacity_scenarios_card",
      "technical_proposal",
      "technical_specifications",
      "bom_material_list",
      "financial_summary",
      "payback_analysis",
      "payment_terms",
      "warranty",
      "terms_conditions",
      "project_gallery",
      "amc_maintenance",
    ],
    optional_blocks: [
      "customer_documents_required",
      "brand_comparison_card",
      "commercial_financing_card",
      "dg_hybrid_analysis_card",
      "school_institution_insight_card",
      "roi_savings",
    ],
  },

  commercial_ht: {
    id: "commercial_ht",
    label: "HT-Commercial",
    description:
      "HT (High Tension) industrial proposal — kVAh billing, ToD solar-window savings, " +
      "power factor analysis, fixed demand charges and Section 32 accelerated depreciation.",
    bill_requirement: "required",
    theme_hint: "commercial",
    default_data_source: "bill",
    /** Isolated document renderer — no legacy block loop. */
    default_blocks: [],
    optional_blocks: [],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the full ordered block playlist for a preset as a `ProposalTemplateV1`.
 * Default-on blocks are `enabled: true`; optional blocks are `enabled: false`.
 * Any registry block not in the preset's lists is appended as disabled.
 */
export function getPresetDefaultLayout(presetId: ProposalPresetId): ProposalTemplateV1 {
  const preset = PROPOSAL_PRESET_REGISTRY[presetId];
  const defaultSet = new Set<ProposalBlockId>(preset.default_blocks);
  const appendixSet = new Set<ProposalBlockId>(preset.appendix_blocks ?? []);
  const optionalSet = new Set<ProposalBlockId>(preset.optional_blocks);

  const seen = new Set<ProposalBlockId>();
  const ordered: Array<{ id: ProposalBlockId; enabled: boolean; section?: "flow" | "appendix" }> = [];

  for (const id of preset.default_blocks) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push({ id, enabled: true, section: appendixSet.has(id) ? "appendix" : "flow" });
    }
  }
  for (const id of preset.appendix_blocks ?? []) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push({ id, enabled: true, section: "appendix" });
    }
  }
  for (const id of preset.optional_blocks) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push({ id, enabled: false, section: appendixSet.has(id) ? "appendix" : "flow" });
    }
  }
  for (const id of DEFAULT_PROPOSAL_BLOCK_ORDER) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push({
        id,
        enabled: PROPOSAL_BLOCK_REGISTRY[id].defaultEnabled && defaultSet.has(id),
        section: appendixSet.has(id) ? "appendix" : "flow",
      });
    }
  }

  void optionalSet;
  return { version: 1, blocks: ordered };
}

/** Legacy Sales Premium helper — style playlists only (preset removed). */
export function getSalesPremiumAllowedBlockIds(): ProposalBlockId[] {
  const seen = new Set<ProposalBlockId>();
  const ordered: ProposalBlockId[] = [];
  for (const meta of SALES_PREMIUM_STYLE_LIST) {
    if (meta.renderer !== "web_blocks") continue;
    for (const id of [...meta.flowBlocks, ...meta.appendixBlocks]) {
      if (seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
  }
  return ordered;
}

/** @deprecated Sales Premium preset removed — kept for orphan style helpers. */
export function normalizeSalesPremiumProposalLayout(input: ProposalTemplateV1): ProposalTemplateV1 {
  const allowedOrder = getSalesPremiumAllowedBlockIds();
  const inputById = new Map(input.blocks.map((b) => [b.id, b]));

  const blocks: ProposalTemplateBlock[] = allowedOrder.map((id) => {
    const fromInput = inputById.get(id);
    const base = {
      id,
      enabled: false,
      section: "flow" as const,
    };
    if (!fromInput) return base;
    return {
      id,
      enabled: fromInput.enabled,
      section: fromInput.section ?? "flow",
    };
  });

  return { version: 1, blocks };
}

export function normalizeProposalLayoutForPreset(
  input: ProposalTemplateV1,
  _presetId: ProposalPresetId
): ProposalTemplateV1 {
  return normalizeProposalTemplateV1(input);
}

export function resolveProposalLayout(
  input: Pick<PremiumProposalPptInput, "proposalLayout" | "salesPremiumStyle" | "galleryThemeKey">,
  presetId: ProposalPresetId
): ProposalTemplateV1 {
  const storedLayout = parseProposalTemplateV1(input.proposalLayout);
  if (storedLayout) {
    return normalizeProposalLayoutForPreset(storedLayout, presetId);
  }
  return getPresetDefaultLayout(presetId);
}

export function getPresetLabel(presetId: string): string {
  const p = PROPOSAL_PRESET_REGISTRY[presetId as ProposalPresetId];
  return p?.label ?? presetId;
}

export function presetRequiresBill(presetId: ProposalPresetId): boolean {
  return PROPOSAL_PRESET_REGISTRY[presetId].bill_requirement === "required";
}

export function presetSupportsBill(presetId: ProposalPresetId): boolean {
  const req = PROPOSAL_PRESET_REGISTRY[presetId].bill_requirement;
  return req === "required" || req === "optional";
}

// ─── Story mode (commercial_executive only) ─────────────────────────────────

export type StoryVariant = StoryCopy & {
  segment: StorySegment;
  mode: StoryMode;
  lang: StoryLang;
};

export function resolveStoryVariant(
  presetId: ProposalPresetId | string,
  segment: StorySegment | string | null | undefined,
  mode: StoryMode | string | null | undefined,
  lang: StoryLang | string
): StoryVariant | null {
  if (presetId !== "commercial_executive") return null;
  if (!segment || !mode) return null;

  const VALID_SEGMENTS: StorySegment[] = ["hotel", "hospital", "factory", "warehouse", "dairy", "school"];
  const VALID_MODES: StoryMode[] = ["executive_pitch", "cfo_brief", "operations_brief", "sustainability_story"];

  if (!VALID_SEGMENTS.includes(segment as StorySegment)) return null;
  if (!VALID_MODES.includes(mode as StoryMode)) return null;

  const storyLang: StoryLang = lang === "hi" ? "hi" : "en";
  const copy = getStoryCopy(segment as StorySegment, mode as StoryMode, storyLang);
  if (!copy) return null;

  return {
    ...copy,
    segment: segment as StorySegment,
    mode: mode as StoryMode,
    lang: storyLang,
  };
}
