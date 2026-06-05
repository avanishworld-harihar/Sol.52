/**
 * Parse + migrate company profile fields from localStorage payloads.
 * Canonical sources: companyProfile.gstNumber, proposalAppearance, brandDisplayPreference + brandSectionRules.
 */

import {
  DEFAULT_PROPOSAL_APPEARANCE,
  COMPANY_PROFILE_SCHEMA_VERSION,
  type BrandSectionDisplayPreference,
  type BrandSectionRules,
  type CompanyCredentials,
  type CompanyProfileCore,
  type PortfolioProject,
  type PortfolioSector,
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

function parsePortfolioSector(raw: unknown): PortfolioSector | "" {
  return raw === "residential" || raw === "commercial" || raw === "school" || raw === "industrial"
    ? raw
    : "";
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

export function parseCompanyProfileCore(raw: unknown, legacyFlatGst?: unknown): CompanyProfileCore {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fromProfile = str(o.gstNumber, 40).toUpperCase();
  const fromFlat =
    typeof legacyFlatGst === "string" ? legacyFlatGst.trim().toUpperCase().slice(0, 40) : "";
  return {
    tagline: str(o.tagline, 160),
    legalName: str(o.legalName, 200),
    contactPerson: str(o.contactPerson, 120),
    contactPersonDesignation: str(o.contactPersonDesignation, 80),
    address: str(o.address, 600),
    website: str(o.website, 300),
    gstNumber: fromProfile || fromFlat,
    pan: str(o.pan, 20).toUpperCase(),
    registrationNumber: str(o.registrationNumber, 40).toUpperCase(),
  };
}

/** Sync canonical GST on profile and legacy flat alias. */
export function syncCanonicalGst(
  profile: CompanyProfileCore,
  legacyFlatGst?: string
): { companyProfile: CompanyProfileCore; companyGstNumber: string } {
  const gst = profile.gstNumber.trim().toUpperCase() || (legacyFlatGst?.trim().toUpperCase() ?? "");
  return {
    companyProfile: { ...profile, gstNumber: gst },
    companyGstNumber: gst,
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
    mnreEmpanelmentNo: str(o.mnreEmpanelmentNo, 80),
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
        sector: parsePortfolioSector(o.sector),
        completedYear: str(o.completedYear, 8),
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
    sector: "" as const,
    completedYear: "",
  }));
}

function parseColorStyle(raw: unknown, theme: ProposalThemePreset): ProposalColorStyle {
  if (raw === "greenBlueClassic" || raw === "greenBlueVivid" || raw === "neutralSlate") return raw;
  return theme === "greenBlueVivid" ? "greenBlueVivid" : "greenBlueClassic";
}

function parseTypography(raw: unknown): ProposalTypographyPreset {
  return raw === "inter" || raw === "system" || raw === "montserrat" ? raw : "montserrat";
}

function parseThemePreset(raw: unknown): ProposalThemePreset | null {
  return raw === "greenBlueClassic" || raw === "greenBlueVivid" ? raw : null;
}

/** Canonical appearance — legacy top-level themePreset is fallback only. */
export function parseProposalAppearance(
  raw: unknown,
  legacyThemeFallback: ProposalThemePreset
): ProposalAppearanceSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const theme = parseThemePreset(o.themePreset) ?? legacyThemeFallback;
  return {
    themePreset: theme,
    colorStyle: parseColorStyle(o.colorStyle, theme),
    typographyPreset: parseTypography(o.typographyPreset),
  };
}

/** Derive legacy top-level theme from canonical appearance. */
export function syncCanonicalTheme(
  appearance: ProposalAppearanceSettings,
  legacyThemeFallback?: ProposalThemePreset
): { proposalAppearance: ProposalAppearanceSettings; themePreset: ProposalThemePreset } {
  const theme =
    parseThemePreset(appearance.themePreset) ??
    legacyThemeFallback ??
    DEFAULT_PROPOSAL_APPEARANCE.themePreset;
  return {
    proposalAppearance: { ...appearance, themePreset: theme },
    themePreset: theme,
  };
}

export function parseGlobalBrandPreference(raw: unknown): ProposalBrandDisplayMode | "nameOnly" | null {
  return raw === "logoOnly" || raw === "logoAndName" || raw === "customPerSection" || raw === "nameOnly"
    ? raw
    : null;
}

/** Infer global preference from per-surface rules when not explicitly stored. */
export function inferBrandDisplayPreference(
  rules: BrandSectionRules
): ProposalBrandDisplayMode | "nameOnly" {
  const surfaces = [rules.cover, rules.header, rules.footer, rules.closing];
  if (surfaces.every((s) => s === "nameOnly")) return "nameOnly";
  if (surfaces.every((s) => s === "logoOnly")) return "logoOnly";
  if (surfaces.every((s) => s === "logoAndName")) return "logoAndName";
  return "customPerSection";
}

/** Apply global preference to all surfaces (UI helper). */
export function brandSectionRulesFromPreference(
  pref: ProposalBrandDisplayMode | "nameOnly"
): BrandSectionRules {
  if (pref === "customPerSection") {
    return {
      cover: "logoOnly",
      header: "logoOnly",
      footer: "logoOnly",
      closing: "logoAndName",
    };
  }
  const mode: BrandSectionDisplayPreference =
    pref === "nameOnly" ? "nameOnly" : pref === "logoAndName" ? "logoAndName" : "logoOnly";
  return { cover: mode, header: mode, footer: mode, closing: mode };
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
