"use client";

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveInstallerDisplayName,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
  type ProposalBrandPresentation,
  type ProposalBrandSurface,
} from "@/lib/proposal-branding-settings";

/** Empty on purpose — never invent a company name. */
export const EMERALD_DEFAULT_BRAND = "";

const PLACEHOLDER =
  /^(solar\s*partner|सोलर\s*पार्टनर|vendor|installer|your\s*solar\s*partner|—|-|n\/a|na)$/i;

function clean(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || PLACEHOLDER.test(v)) return "";
  return v;
}

export function resolveEmeraldBrand(data: ProposalData): string {
  if (typeof window !== "undefined") {
    try {
      const settings = readProposalBrandingSettings();
      const fromMore =
        clean(resolveInstallerDisplayName(settings)) ||
        clean(settings.companyProfile?.legalName);
      if (fromMore) return fromMore;
    } catch {
      /* ignore */
    }
  }

  for (const raw of [
    data.closing?.installerName,
    data.meta?.brandName,
    data.execution?.bank?.company,
  ]) {
    const v = clean(raw);
    if (v) return v;
  }
  return EMERALD_DEFAULT_BRAND;
}

export function useEmeraldBrand(data: ProposalData): string {
  const [name, setName] = useState(() => resolveEmeraldBrand(data));

  useEffect(() => {
    const sync = () => setName(resolveEmeraldBrand(data));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data]);

  return name;
}

/** Logo from proposal snapshot → adapter prop → More → Brand & proposals. */
export function resolveEmeraldLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const fromData = data.meta?.brandLogoUrl?.trim() ?? "";
  const fromProp = installerLogoUrl?.trim() ?? "";
  if (fromData) return fromData;
  if (fromProp) return fromProp;
  if (typeof window !== "undefined") {
    try {
      const fromLocal =
        readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      if (fromLocal) return fromLocal;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export function useEmeraldLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const [logoUrl, setLogoUrl] = useState(() =>
    resolveEmeraldLogoUrl(data, installerLogoUrl)
  );

  useEffect(() => {
    const sync = () => setLogoUrl(resolveEmeraldLogoUrl(data, installerLogoUrl));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data, installerLogoUrl]);

  return logoUrl;
}

export function useEmeraldSurfaceBrand(
  data: ProposalData,
  surface: ProposalBrandSurface,
  installerLogoUrl?: string
): ProposalBrandPresentation {
  const installerName = useEmeraldBrand(data);
  const logoUrl = useEmeraldLogoUrl(data, installerLogoUrl);

  const config = resolveProposalBrandConfig({
    pptInput: {
      brandDisplayMode: data.meta.brandDisplayMode,
      brandSectionConfig: data.meta.brandSectionConfig,
    },
  });

  return resolveProposalBrandPresentation(config, surface, {
    installerName,
    logoUrl,
    tagline: data.meta.brandTagline,
  });
}

export function splitEmeraldWordmark(brandName: string): {
  primary: string;
  secondary: string;
} {
  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  const primary = (parts[0] || "").toUpperCase();
  const secondary = parts.slice(1).join(" ").toUpperCase();
  return { primary, secondary };
}

export function formatEmeraldKw(kw: number, digits = 2): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(digits);
}

export function formatEmeraldDocNo(proposalId?: string, generatedAt?: string): string {
  const year = generatedAt
    ? new Date(generatedAt).getFullYear()
    : new Date().getFullYear();
  const tail = (proposalId ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  return tail ? `EM-${year}-${tail}` : `EM-${year}`;
}

export function formatEmeraldIssueDate(
  generatedAt?: string,
  locale: "en" | "hi" = "en"
): string {
  const d = generatedAt ? new Date(generatedAt) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  const formatted = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(safe);
  return locale === "hi" ? formatted : formatted.toUpperCase();
}
