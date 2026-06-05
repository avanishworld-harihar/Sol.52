/**
 * Company Profile — structured settings schema (Phase 1: storage + More UI only).
 * Proposal rendering reads legacy flat fields until Phase 2 integration.
 */

import type { ProposalBrandSurface, ProposalThemePreset } from "@/lib/proposal-branding-settings";

export const COMPANY_PROFILE_SCHEMA_VERSION = 3;

/** UI preference per surface — includes nameOnly (not yet applied to live proposals). */
export type BrandSectionDisplayPreference = "logoOnly" | "logoAndName" | "nameOnly";

export type BrandSectionRules = Record<ProposalBrandSurface, BrandSectionDisplayPreference>;

export type CompanyProfileCore = {
  /** Marketing line under company name (Phase 2 proposals). */
  tagline: string;
  legalName: string;
  contactPerson: string;
  /** e.g. Director, Proprietor */
  contactPersonDesignation: string;
  address: string;
  website: string;
  /** Canonical GSTIN — `companyGstNumber` is a read/write alias for proposals. */
  gstNumber: string;
  pan: string;
  registrationNumber: string;
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
  mnreEmpanelmentNo: string;
};

export type PortfolioSector = "residential" | "commercial" | "school" | "industrial";

export type PortfolioProject = {
  id: string;
  projectName: string;
  capacity: string;
  location: string;
  description: string;
  photoUrl: string;
  sector: PortfolioSector | "";
  completedYear: string;
};

export type ProposalColorStyle = "greenBlueClassic" | "greenBlueVivid" | "neutralSlate";

export type ProposalTypographyPreset = "montserrat" | "inter" | "system";

export type ProposalAppearanceSettings = {
  /** Canonical theme — top-level `themePreset` is derived from this on read/write. */
  themePreset: ProposalThemePreset;
  colorStyle: ProposalColorStyle;
  typographyPreset: ProposalTypographyPreset;
};

export const DEFAULT_COMPANY_PROFILE_CORE: CompanyProfileCore = {
  tagline: "",
  legalName: "",
  contactPerson: "",
  contactPersonDesignation: "",
  address: "",
  website: "",
  gstNumber: "",
  pan: "",
  registrationNumber: "",
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
  mnreEmpanelmentNo: "",
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
    sector: "",
    completedYear: "",
  };
}

/** True when a portfolio record has content worth showing in a future template. */
export function portfolioProjectHasContent(project: PortfolioProject): boolean {
  return (
    project.projectName.trim().length > 0 ||
    project.photoUrl.trim().length > 0 ||
    project.capacity.trim().length > 0 ||
    project.location.trim().length > 0 ||
    project.description.trim().length > 0
  );
}

/** Phase 2 templates should only consume non-empty portfolio records. */
export function filterPortfolioProjectsForDisplay(projects: PortfolioProject[]): PortfolioProject[] {
  return projects.filter(portfolioProjectHasContent);
}

const CREDENTIAL_KEYS = [
  "yearsInBusiness",
  "installedCapacityMw",
  "projectsCompleted",
  "serviceCoverageAreas",
  "teamSize",
  "certifications",
  "awards",
  "oemPartnerships",
  "mnreEmpanelmentNo",
] as const satisfies readonly (keyof CompanyCredentials)[];

/** Non-empty credential fields for conditional Phase 2 rendering. */
export function nonEmptyCredentialFields(
  credentials: CompanyCredentials
): Partial<Record<(typeof CREDENTIAL_KEYS)[number], string>> {
  const out: Partial<Record<(typeof CREDENTIAL_KEYS)[number], string>> = {};
  for (const key of CREDENTIAL_KEYS) {
    const v = credentials[key]?.trim() ?? "";
    if (v) out[key] = v;
  }
  return out;
}

export function credentialsHasContent(credentials: CompanyCredentials): boolean {
  return Object.keys(nonEmptyCredentialFields(credentials)).length > 0;
}
