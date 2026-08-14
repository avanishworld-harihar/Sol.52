import type { ProposalPresetId } from "@/lib/proposal-preset-engine";

/** Residential templates users pick in More → saved as default for new proposals. */
export const RESIDENTIAL_TEMPLATE_PRESET_IDS = [
  "residential_executive",
  "residential_zenith",
  "residential_premium_luxe",
  "residential_luxe_noir",
  "residential_blueprint",
  "residential_quantum",
  "residential_emerald",
  "residential_obsidian",
  "residential_field",
] as const;

export type ResidentialTemplatePresetId = (typeof RESIDENTIAL_TEMPLATE_PRESET_IDS)[number];

export const DEFAULT_RESIDENTIAL_TEMPLATE_PRESET: ResidentialTemplatePresetId =
  "residential_zenith";

const STORAGE_KEY = "ss_default_residential_proposal_preset_v1";

export const PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT = "ss-proposal-default-preset-updated";

export type ResidentialTemplateOption = {
  id: ResidentialTemplatePresetId;
  label: string;
  subtitle: string;
};

export const RESIDENTIAL_TEMPLATE_OPTIONS: ResidentialTemplateOption[] = [
  {
    id: "residential_executive",
    label: "Golden",
    subtitle: "Champagne gold editorial layout for high-trust clients.",
  },
  {
    id: "residential_zenith",
    label: "Zenith",
    subtitle: "Midnight Onyx luxury brochure — architecture & Tier-1 BOM.",
  },
  {
    id: "residential_premium_luxe",
    label: "Atelier",
    subtitle: "Warm cream masterplan for residential sales.",
  },
  {
    id: "residential_luxe_noir",
    label: "Premium Luxe",
    subtitle: "Dark cinematic gold — engineering telemetry & peak-yield design.",
  },
  {
    id: "residential_blueprint",
    label: "Canvas",
    subtitle: "Investment Blueprint — Charcoal / Aluminum / Burnt Orange + wealth bars.",
  },
  {
    id: "residential_quantum",
    label: "Quantum",
    subtitle: "Cinematic Neo-Glass — HUD telemetry & capital recovery terminal.",
  },
  {
    id: "residential_emerald",
    label: "Emerald",
    subtitle: "Eco-luxury split-folio — Deep Forest sidebar & Champagne Gold.",
  },
  {
    id: "residential_obsidian",
    label: "Obsidian",
    subtitle: "Pitch-black HUD / viewfinder — engineering telemetry & yield terminal.",
  },
  {
    id: "residential_field",
    label: "Field Engineering",
    subtitle: "Survey drawings — graph paper, title block, trust through method.",
  },
];

function isResidentialTemplatePreset(id: string): id is ResidentialTemplatePresetId {
  return (RESIDENTIAL_TEMPLATE_PRESET_IDS as readonly string[]).includes(id);
}

export function readDefaultResidentialPreset(): ResidentialTemplatePresetId {
  if (typeof window === "undefined") return DEFAULT_RESIDENTIAL_TEMPLATE_PRESET;
  try {
    const raw = localStorage.getItem(STORAGE_KEY)?.trim();
    if (raw && isResidentialTemplatePreset(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_RESIDENTIAL_TEMPLATE_PRESET;
}

export function writeDefaultResidentialPreset(id: ResidentialTemplatePresetId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, { detail: { id } }));
}

export function labelForResidentialTemplate(id: ProposalPresetId): string {
  return RESIDENTIAL_TEMPLATE_OPTIONS.find((o) => o.id === id)?.label ?? "Zenith";
}

/* ── Commercial templates — Executive (LT/C&I) vs HT Industrial ── */

export const COMMERCIAL_TEMPLATE_PRESET_IDS = [
  "commercial_executive",
  "commercial_ht",
] as const;

export type CommercialTemplatePresetId = (typeof COMMERCIAL_TEMPLATE_PRESET_IDS)[number];

export const DEFAULT_COMMERCIAL_TEMPLATE_PRESET: CommercialTemplatePresetId =
  "commercial_executive";

const COMMERCIAL_STORAGE_KEY = "ss_default_commercial_proposal_preset_v1";

function isCommercialTemplatePreset(id: string): id is CommercialTemplatePresetId {
  return (COMMERCIAL_TEMPLATE_PRESET_IDS as readonly string[]).includes(id);
}

export function readDefaultCommercialPreset(): CommercialTemplatePresetId {
  if (typeof window === "undefined") return DEFAULT_COMMERCIAL_TEMPLATE_PRESET;
  try {
    const raw = localStorage.getItem(COMMERCIAL_STORAGE_KEY)?.trim();
    if (raw && isCommercialTemplatePreset(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_COMMERCIAL_TEMPLATE_PRESET;
}

export function writeDefaultCommercialPreset(id: CommercialTemplatePresetId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMERCIAL_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, { detail: { id } }));
}

export function labelForCommercialTemplate(id: ProposalPresetId): string {
  return id === "commercial_ht" ? "HT Industrial" : "Commercial Executive";
}
