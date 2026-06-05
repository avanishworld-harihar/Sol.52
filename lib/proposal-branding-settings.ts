export type ProposalThemePreset = "greenBlueClassic" | "greenBlueVivid";

/** Per-surface logo vs logo+name choice (used when brandDisplayMode is customPerSection). */
export type BrandSectionDisplayMode = "logoOnly" | "logoAndName";

/** Global brand display strategy for proposals (web, print/PDF, PPT). */
export type ProposalBrandDisplayMode = "logoOnly" | "logoAndName" | "customPerSection";

export type ProposalBrandSurface = "cover" | "header" | "footer" | "closing";

export type ProposalBrandSectionConfig = {
  cover: BrandSectionDisplayMode;
  header: BrandSectionDisplayMode;
  footer: BrandSectionDisplayMode;
  closing: BrandSectionDisplayMode;
};

export type ProposalBrandConfig = {
  brandDisplayMode: ProposalBrandDisplayMode;
  brandSectionConfig: ProposalBrandSectionConfig;
};

export const DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG: ProposalBrandSectionConfig = {
  cover: "logoOnly",
  header: "logoOnly",
  footer: "logoOnly",
  closing: "logoAndName",
};

export const DEFAULT_PROPOSAL_BRAND_CONFIG: ProposalBrandConfig = {
  brandDisplayMode: "customPerSection",
  brandSectionConfig: DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG,
};

/** Default AMC term shown on commercial / service slides when generating a proposal. */
export type ProposalAmcYears = 1 | 5 | 10;

export function parseProposalAmcYears(value: unknown): ProposalAmcYears {
  const n = Number(value);
  if (n === 5) return 5;
  if (n === 10) return 10;
  return 1;
}

export type ProposalBrandingSettings = {
  installerName: string;
  /** Phone / WhatsApp line (shown first on proposals). */
  installerContact: string;
  /** Email — combined with phone on web proposal & PPT as `phone · email`. */
  installerEmail: string;
  installerLogoUrl: string;
  personalizedBranding: boolean;
  themePreset: ProposalThemePreset;
  /** Payment QR code image URL (Supabase Storage). Shown on the Banking slide. */
  paymentQrCodeUrl: string;
  /** AMC plan term for generated proposals / PPT. */
  amcSelectedYears: ProposalAmcYears;
  /** Banking line items for proposal banking slide + UPI QR text. */
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  bankUpiId: string;
  /** Past installation photo URLs (max 6) for web proposal + deck. */
  proposalSiteImages: string[];
  /** GSTIN shown on proposal About / commercial slides (set in More → Company profile). */
  companyGstNumber: string;
  /** How installer logo/name appear across proposal surfaces. */
  brandDisplayMode: ProposalBrandDisplayMode;
  /** Per-section overrides when brandDisplayMode is customPerSection. */
  brandSectionConfig: ProposalBrandSectionConfig;
};

const STORAGE_KEY = "ss_proposal_branding_settings_v1";

/** Dispatched on `window` after `writeProposalBrandingSettings` updates localStorage. */
export const PROPOSAL_BRANDING_UPDATED_EVENT = "ss-proposal-branding-updated";

export const DEFAULT_INSTALLER_PHONE = "+91-9993322267";
export const DEFAULT_INSTALLER_EMAIL = "harihar@solar.com";

/** Single line for `PremiumProposalPptInput.installerContact` / DB `installer_contact`. */
export function formatInstallerContactLine(phoneRaw: string, emailRaw: string): string {
  const phone = phoneRaw.trim();
  const email = emailRaw.trim();
  if (!phone && !email) return `${DEFAULT_INSTALLER_PHONE} · ${DEFAULT_INSTALLER_EMAIL}`;
  if (phone && email) return `${phone} · ${email}`;
  return phone || email;
}

export const DEFAULT_PROPOSAL_BRANDING_SETTINGS: ProposalBrandingSettings = {
  installerName: "Harihar Solar",
  installerContact: DEFAULT_INSTALLER_PHONE,
  installerEmail: DEFAULT_INSTALLER_EMAIL,
  installerLogoUrl: "",
  personalizedBranding: true,
  themePreset: "greenBlueClassic",
  paymentQrCodeUrl: "",
  amcSelectedYears: 1,
  bankAccountName: "Harihar Solar",
  bankAccountNumber: "",
  bankIfsc: "",
  bankBranch: "",
  bankUpiId: "",
  proposalSiteImages: [],
  companyGstNumber: "",
  ...DEFAULT_PROPOSAL_BRAND_CONFIG,
};

function parseBrandSectionDisplayMode(value: unknown): BrandSectionDisplayMode | null {
  return value === "logoOnly" || value === "logoAndName" ? value : null;
}

function parseBrandSectionConfig(raw: unknown): ProposalBrandSectionConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    cover: parseBrandSectionDisplayMode(o.cover) ?? DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG.cover,
    header: parseBrandSectionDisplayMode(o.header) ?? DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG.header,
    footer: parseBrandSectionDisplayMode(o.footer) ?? DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG.footer,
    closing: parseBrandSectionDisplayMode(o.closing) ?? DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG.closing,
  };
}

function parseBrandDisplayMode(value: unknown): ProposalBrandDisplayMode | null {
  return value === "logoOnly" || value === "logoAndName" || value === "customPerSection" ? value : null;
}

/** Migrate legacy personalizedBranding when brandDisplayMode is absent. */
function migrateBrandConfig(parsed: Partial<ProposalBrandingSettings>): ProposalBrandConfig {
  const fromMode = parseBrandDisplayMode(parsed.brandDisplayMode);
  if (fromMode) {
    return {
      brandDisplayMode: fromMode,
      brandSectionConfig: parseBrandSectionConfig(parsed.brandSectionConfig),
    };
  }
  if (parsed.personalizedBranding === false) {
    return { brandDisplayMode: "logoOnly", brandSectionConfig: { ...DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG } };
  }
  return { ...DEFAULT_PROPOSAL_BRAND_CONFIG };
}

function parseSiteImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function readProposalBrandingSettings(): ProposalBrandingSettings {
  if (typeof window === "undefined") return { ...DEFAULT_PROPOSAL_BRANDING_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROPOSAL_BRANDING_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ProposalBrandingSettings>;
    return {
      installerName:
        typeof parsed.installerName === "string"
          ? parsed.installerName.trim()
          : DEFAULT_PROPOSAL_BRANDING_SETTINGS.installerName,
      installerContact: parsed.installerContact?.trim() || DEFAULT_PROPOSAL_BRANDING_SETTINGS.installerContact,
      installerEmail: typeof parsed.installerEmail === "string" ? parsed.installerEmail.trim() : "",
      installerLogoUrl: parsed.installerLogoUrl?.trim() || "",
      personalizedBranding:
        typeof parsed.personalizedBranding === "boolean"
          ? parsed.personalizedBranding
          : DEFAULT_PROPOSAL_BRANDING_SETTINGS.personalizedBranding,
      themePreset:
        parsed.themePreset === "greenBlueVivid" || parsed.themePreset === "greenBlueClassic"
          ? parsed.themePreset
          : DEFAULT_PROPOSAL_BRANDING_SETTINGS.themePreset,
      paymentQrCodeUrl: parsed.paymentQrCodeUrl?.trim() || "",
      amcSelectedYears: parseProposalAmcYears(parsed.amcSelectedYears),
      bankAccountName:
        typeof parsed.bankAccountName === "string"
          ? parsed.bankAccountName.trim()
          : DEFAULT_PROPOSAL_BRANDING_SETTINGS.bankAccountName,
      bankAccountNumber: typeof parsed.bankAccountNumber === "string" ? parsed.bankAccountNumber.trim() : "",
      bankIfsc: typeof parsed.bankIfsc === "string" ? parsed.bankIfsc.trim() : "",
      bankBranch: typeof parsed.bankBranch === "string" ? parsed.bankBranch.trim() : "",
      bankUpiId: typeof parsed.bankUpiId === "string" ? parsed.bankUpiId.trim() : "",
      proposalSiteImages: parseSiteImages(parsed.proposalSiteImages),
      companyGstNumber:
        typeof parsed.companyGstNumber === "string" ? parsed.companyGstNumber.trim().toUpperCase() : "",
      ...migrateBrandConfig(parsed),
    };
  } catch {
    return { ...DEFAULT_PROPOSAL_BRANDING_SETTINGS };
  }
}

export function writeProposalBrandingSettings(next: ProposalBrandingSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PROPOSAL_BRANDING_UPDATED_EVENT));
  } catch {
    /* ignore storage errors */
  }
}

/** Name shown on proposals — empty string allowed (logo-only branding). */
export function resolveInstallerDisplayName(settings: ProposalBrandingSettings): string {
  return settings.installerName.trim();
}

export function resolveInstallerNameForProposal(input: {
  installerName?: string | null;
}): string {
  return input.installerName?.trim() ?? "";
}

export function installerLogoAlt(name: string): string {
  return name.trim() || "Company logo";
}

export function resolveBrandSectionMode(
  config: ProposalBrandConfig,
  surface: ProposalBrandSurface
): BrandSectionDisplayMode {
  if (config.brandDisplayMode === "logoOnly") return "logoOnly";
  if (config.brandDisplayMode === "logoAndName") return "logoAndName";
  return config.brandSectionConfig[surface];
}

export function shouldShowInstallerName(config: ProposalBrandConfig, surface: ProposalBrandSurface): boolean {
  return resolveBrandSectionMode(config, surface) === "logoAndName";
}

export type ProposalBrandPresentation = {
  showLogo: boolean;
  showName: boolean;
  showTagline: boolean;
  installerName: string;
  logoUrl: string;
  tagline: string;
};

export function resolveProposalBrandPresentation(
  config: ProposalBrandConfig,
  surface: ProposalBrandSurface,
  identity: { installerName?: string; logoUrl?: string; tagline?: string },
  options?: { includeTagline?: boolean }
): ProposalBrandPresentation {
  const installerName = (identity.installerName ?? "").trim();
  const logoUrl = (identity.logoUrl ?? "").trim();
  const tagline = (identity.tagline ?? "").trim();
  const showName = shouldShowInstallerName(config, surface) && installerName.length > 0;
  const showLogo = logoUrl.length > 0;
  const showTagline =
    showName && (options?.includeTagline !== false) && tagline.length > 0;
  return { showLogo, showName, showTagline, installerName, logoUrl, tagline };
}

/** Resolve branding config from a frozen proposal snapshot (ppt_input) with settings fallback. */
export function resolveProposalBrandConfig(sources: {
  pptInput?: { brandDisplayMode?: unknown; brandSectionConfig?: unknown } | null;
  settings?: Partial<ProposalBrandingSettings> | null;
}): ProposalBrandConfig {
  const fromPptMode = parseBrandDisplayMode(sources.pptInput?.brandDisplayMode);
  if (fromPptMode) {
    return {
      brandDisplayMode: fromPptMode,
      brandSectionConfig: parseBrandSectionConfig(sources.pptInput?.brandSectionConfig),
    };
  }
  const settings = sources.settings ?? DEFAULT_PROPOSAL_BRANDING_SETTINGS;
  return {
    brandDisplayMode: settings.brandDisplayMode ?? DEFAULT_PROPOSAL_BRAND_CONFIG.brandDisplayMode,
    brandSectionConfig: settings.brandSectionConfig ?? DEFAULT_PROPOSAL_BRAND_SECTION_CONFIG,
  };
}

/** Sync legacy personalizedBranding flag from brand display mode. */
export function personalizedBrandingFromBrandConfig(config: ProposalBrandConfig): boolean {
  return config.brandDisplayMode !== "logoOnly";
}
