/**
 * Commercial proposal layout plan — used by UI and stability tests.
 */

import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { isSchoolInstitutionOrg } from "@/lib/proposal-financial-engine";

export const COMMERCIAL_BASE_SECTIONS = [
  "comm-cover",
  "comm-executive-summary",
  "comm-roi",
  "comm-financials",
  "comm-engineering",
  "comm-architecture",
  "comm-bom",
  "comm-timeline",
  "comm-monitoring",
  "comm-terms",
  "comm-closing",
] as const;

export const COMMERCIAL_SCHOOL_SECTIONS = [
  "comm-school-green",
  "comm-school-learning",
] as const;

export const COMMERCIAL_OPTIONAL_SECTIONS = [
  "comm-dcr",
  "comm-scenarios",
  "comm-dg-hybrid",
] as const;

export type CommercialSectionAnchor =
  | (typeof COMMERCIAL_BASE_SECTIONS)[number]
  | (typeof COMMERCIAL_SCHOOL_SECTIONS)[number]
  | (typeof COMMERCIAL_OPTIONAL_SECTIONS)[number];

export type CommercialLayoutPlan = {
  preset: "commercial_executive";
  isSchool: boolean;
  navSections: string[];
  requiredSections: string[];
  optionalSections: string[];
  estimatedPageCount: number;
  executiveKpiLabels: string[];
};

const EXECUTIVE_KPI_LABELS = [
  "Annual Saving",
  "Net Investment",
  "Payback",
  "25-Year ROI",
  "25-Year Profit",
] as const;

export function resolveCommercialLayoutPlan(
  pptInput: Pick<PremiumProposalPptInput, "commercialConfig">
): CommercialLayoutPlan {
  const cc = pptInput.commercialConfig;
  const isSchool = isSchoolInstitutionOrg(cc?.orgType);

  const optionalSections: string[] = [];
  if (cc?.dcrComparison?.enabled !== false) optionalSections.push("comm-dcr");
  if (cc?.capacityScenarios?.enabled !== false) optionalSections.push("comm-scenarios");
  if (cc?.dgAssumptions?.enabled === true) optionalSections.push("comm-dg-hybrid");

  const requiredSections: string[] = [
    "comm-cover",
    "comm-executive-summary",
    ...(isSchool ? [...COMMERCIAL_SCHOOL_SECTIONS] : []),
    ...optionalSections,
    ...COMMERCIAL_BASE_SECTIONS.slice(2),
  ];

  const navSections = isSchool
    ? [
        "comm-cover",
        "comm-executive-summary",
        ...COMMERCIAL_SCHOOL_SECTIONS,
        ...COMMERCIAL_BASE_SECTIONS.slice(2),
      ]
    : [...COMMERCIAL_BASE_SECTIONS];

  return {
    preset: "commercial_executive",
    isSchool,
    navSections,
    requiredSections,
    optionalSections,
    estimatedPageCount: requiredSections.length,
    executiveKpiLabels: [...EXECUTIVE_KPI_LABELS],
  };
}

export function validateCommercialLayoutPlan(plan: CommercialLayoutPlan): string[] {
  const errors: string[] = [];
  for (const id of COMMERCIAL_BASE_SECTIONS) {
    if (!plan.requiredSections.includes(id)) {
      errors.push(`missing base section: ${id}`);
    }
  }
  if (plan.isSchool) {
    for (const id of COMMERCIAL_SCHOOL_SECTIONS) {
      if (!plan.requiredSections.includes(id)) {
        errors.push(`school proposal missing section: ${id}`);
      }
    }
  } else {
    for (const id of COMMERCIAL_SCHOOL_SECTIONS) {
      if (plan.requiredSections.includes(id)) {
        errors.push(`non-school proposal must not include: ${id}`);
      }
    }
  }
  if (plan.estimatedPageCount < 11) {
    errors.push(`page count too low: ${plan.estimatedPageCount}`);
  }
  return errors;
}
