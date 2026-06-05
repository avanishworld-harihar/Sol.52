/**
 * Company Profile — structured settings schema (Phase 1: storage + More UI only).
 * Proposal rendering reads legacy flat fields until Phase 2 integration.
 */

import type { ProposalBrandSurface, ProposalThemePreset } from "@/lib/proposal-branding-settings";

export const COMPANY_PROFILE_SCHEMA_VERSION = 2;

/** UI preference per surface — includes nameOnly (not yet applied to live proposals). */
export type BrandSectionDisplayPreference = "logoOnly" | "logoAndName" | "nameOnly";

export type BrandSectionRules = Record<ProposalBrandSurface, BrandSectionDisplayPreference>;

export type CompanyProfileCore = {
  legalName: string;
  contactPerson: string;
  address: string;
  website: string;
};

export type CompanyCredentials = {
  yearsInBusiness: string;
  installedCapacityMw: string;
  projectsCompleted: string;
  serviceCoverageAreas: string;
  teamSize: string;
  certifications: string;
  awards: string;
  oemPartnerships: string;
};

export type PortfolioProject = {
  id: string;
  projectName: string;
  capacity: string;
  location: string;
  description: string;
  photoUrl: string;
};

export type ProposalColorStyle = "greenBlueClassic" | "greenBlueVivid" | "neutralSlate";

export type ProposalTypographyPreset = "montserrat" | "inter" | "system";

export type ProposalAppearanceSettings = {
  /** Mirrors themePreset for structured access; kept in sync on save. */
  themePreset: ProposalThemePreset;
  colorStyle: ProposalColorStyle;
  typographyPreset: ProposalTypographyPreset;
};

export const DEFAULT_COMPANY_PROFILE_CORE: CompanyProfileCore = {
  legalName: "",
  contactPerson: "",
  address: "",
  website: "",
};

export const DEFAULT_COMPANY_CREDENTIALS: CompanyCredentials = {
  yearsInBusiness: "",
  installedCapacityMw: "",
  projectsCompleted: "",
  serviceCoverageAreas: "",
  teamSize: "",
  certifications: "",
  awards: "",
  oemPartnerships: "",
};

export const DEFAULT_BRAND_SECTION_RULES: BrandSectionRules = {
  cover: "logoOnly",
  header: "logoOnly",
  footer: "logoOnly",
  closing: "logoAndName",
};

export const DEFAULT_PROPOSAL_APPEARANCE: ProposalAppearanceSettings = {
  themePreset: "greenBlueClassic",
  colorStyle: "greenBlueClassic",
  typographyPreset: "montserrat",
};

export function newPortfolioProjectId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyPortfolioProject(): PortfolioProject {
  return {
    id: newPortfolioProjectId(),
    projectName: "",
    capacity: "",
    location: "",
    description: "",
    photoUrl: "",
  };
}
