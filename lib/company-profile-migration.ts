/**
 * Parse + migrate company profile v2 fields from localStorage payloads.
 */

import {
  DEFAULT_PROPOSAL_APPEARANCE,
  COMPANY_PROFILE_SCHEMA_VERSION,
  type BrandSectionDisplayPreference,
  type BrandSectionRules,
  type CompanyCredentials,
  type CompanyProfileCore,
  type PortfolioProject,
  type ProposalAppearanceSettings,
  type ProposalColorStyle,
  type ProposalTypographyPreset,
} from "@/lib/company-profile-schema";
import type {
  BrandSectionDisplayMode,
  ProposalBrandSectionConfig,
  ProposalBrandDisplayMode,
  ProposalThemePreset,
} from "@/lib/proposal-branding-settings";

export const STORAGE_KEY_V1 = "ss_proposal_branding_settings_v1";

function str(raw: unknown, max = 500): string {
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function parsePreference(value: unknown): BrandSectionDisplayPreference | null {
  return value === "logoOnly" || value === "logoAndName" || value === "nameOnly" ? value : null;
}

export function parseBrandSectionRules(raw: unknown, fallback: ProposalBrandSectionConfig): BrandSectionRules {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    cover: parsePreference(o.cover) ?? fallback.cover,
    header: parsePreference(o.header) ?? fallback.header,
    footer: parsePreference(o.footer) ?? fallback.footer,
    closing: parsePreference(o.closing) ?? fallback.closing,
  };
}

/** Proposal-active config — nameOnly coerced to logoAndName until Phase 2. */
export function proposalActiveSectionConfig(rules: BrandSectionRules): ProposalBrandSectionConfig {
  const coerce = (p: BrandSectionDisplayPreference): BrandSectionDisplayMode =>
    p === "nameOnly" ? "logoAndName" : p;
  return {
    cover: coerce(rules.cover),
    header: coerce(rules.header),
    footer: coerce(rules.footer),
    closing: coerce(rules.closing),
  };
}

export function parseCompanyProfileCore(raw: unknown): CompanyProfileCore {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    legalName: str(o.legalName, 200),
    contactPerson: str(o.contactPerson, 120),
    address: str(o.address, 600),
    website: str(o.website, 300),
  };
}

export function parseCompanyCredentials(raw: unknown): CompanyCredentials {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    yearsInBusiness: str(o.yearsInBusiness, 40),
    installedCapacityMw: str(o.installedCapacityMw, 40),
    projectsCompleted: str(o.projectsCompleted, 40),
    serviceCoverageAreas: str(o.serviceCoverageAreas, 400),
    teamSize: str(o.teamSize, 40),
    certifications: str(o.certifications, 600),
    awards: str(o.awards, 600),
    oemPartnerships: str(o.oemPartnerships, 600),
  };
}

export function parsePortfolioProjects(raw: unknown): PortfolioProject[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id = str(o.id, 80);
      const projectName = str(o.projectName, 200);
      const photoUrl = str(o.photoUrl, 600_000);
      if (!id && !projectName && !photoUrl) return null;
      return {
        id: id || `legacy-${Math.random().toString(36).slice(2, 9)}`,
        projectName,
        capacity: str(o.capacity, 80),
        location: str(o.location, 200),
        description: str(o.description, 800),
        photoUrl,
      };
    })
    .filter((p): p is PortfolioProject => p !== null)
    .slice(0, 24);
}

export function migratePortfolioFromLegacySiteImages(urls: string[]): PortfolioProject[] {
  return urls.map((photoUrl, i) => ({
    id: `legacy-site-${i}`,
    projectName: urls.length === 1 ? "Installation" : `Project ${i + 1}`,
    capacity: "",
    location: "",
    description: "",
    photoUrl,
  }));
}

function parseColorStyle(raw: unknown, theme: ProposalThemePreset): ProposalColorStyle {
  if (raw === "greenBlueClassic" || raw === "greenBlueVivid" || raw === "neutralSlate") return raw;
  return theme === "greenBlueVivid" ? "greenBlueVivid" : "greenBlueClassic";
}

function parseTypography(raw: unknown): ProposalTypographyPreset {
  return raw === "inter" || raw === "system" || raw === "montserrat" ? raw : "montserrat";
}

export function parseProposalAppearance(
  raw: unknown,
  themePreset: ProposalThemePreset
): ProposalAppearanceSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const theme =
    o.themePreset === "greenBlueVivid" || o.themePreset === "greenBlueClassic"
      ? o.themePreset
      : themePreset;
  return {
    themePreset: theme,
    colorStyle: parseColorStyle(o.colorStyle, theme),
    typographyPreset: parseTypography(o.typographyPreset),
  };
}

export function parseGlobalBrandPreference(raw: unknown): ProposalBrandDisplayMode | "nameOnly" | null {
  return raw === "logoOnly" || raw === "logoAndName" || raw === "customPerSection" || raw === "nameOnly"
    ? raw
    : null;
}

/** Active proposal brand mode — nameOnly not applied until Phase 2. */
export function proposalActiveBrandDisplayMode(
  pref: ProposalBrandDisplayMode | "nameOnly"
): ProposalBrandDisplayMode {
  if (pref === "nameOnly") return "logoAndName";
  return pref;
}

export function defaultProposalAppearance(themePreset: ProposalThemePreset): ProposalAppearanceSettings {
  return {
    ...DEFAULT_PROPOSAL_APPEARANCE,
    themePreset,
    colorStyle: themePreset === "greenBlueVivid" ? "greenBlueVivid" : "greenBlueClassic",
  };
}

export function parseStoredSchemaVersion(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : COMPANY_PROFILE_SCHEMA_VERSION;
}
