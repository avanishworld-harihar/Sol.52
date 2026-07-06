import type { ProposalPresetId } from "@/lib/proposal-preset-engine";

/** Residential templates users pick in More → saved as default for new proposals. */
export const RESIDENTIAL_TEMPLATE_PRESET_IDS = [
  "residential_aurora",
  "residential_sales_premium",
  "residential_bank_loan",
  "residential_executive",
  "residential_smart",
] as const;

export type ResidentialTemplatePresetId = (typeof RESIDENTIAL_TEMPLATE_PRESET_IDS)[number];

export const DEFAULT_RESIDENTIAL_TEMPLATE_PRESET: ResidentialTemplatePresetId =
  "residential_sales_premium";

const STORAGE_KEY = "ss_default_residential_proposal_preset_v1";

export const PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT = "ss-proposal-default-preset-updated";

export type ResidentialTemplateOption = {
  id: ResidentialTemplatePresetId;
  label: string;
  subtitle: string;
};

export const RESIDENTIAL_TEMPLATE_OPTIONS: ResidentialTemplateOption[] = [
  {
    id: "residential_aurora",
    label: "Aurora",
    subtitle: "Techno-commercial — SLD diagram, tilt, BOM, subsidy. Easy English.",
  },
  {
    id: "residential_executive",
    label: "Executive Premium",
    subtitle: "Champagne gold editorial layout for high-trust clients.",
  },
  {
    id: "residential_sales_premium",
    label: "Sales Premium",
    subtitle: "Pearl, Slate, Horizon & Ember theme family.",
  },
  {
    id: "residential_bank_loan",
    label: "Bank Loan Pack",
    subtitle: "Documentation-first pack for bank & subsidy.",
  },
  {
    id: "residential_smart",
    label: "Residential Legacy",
    subtitle: "Full Sol.52 audit & section stack.",
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
  return RESIDENTIAL_TEMPLATE_OPTIONS.find((o) => o.id === id)?.label ?? "Sales Premium";
}
