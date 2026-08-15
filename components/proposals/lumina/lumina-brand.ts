"use client";

/**
 * Lumina branding — More → Brand & proposals, then proposal snapshot, then adapter prop.
 * Never invent a company name or logo.
 */

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

const PLACEHOLDER =
  /^(solar\s*partner|सोलर\s*पार्टनर|vendor|installer|your\s*solar\s*partner|sol\.?52|—|-|n\/a|na)$/i;

function clean(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || PLACEHOLDER.test(v)) return "";
  return v;
}

export function resolveLuminaBrand(data: ProposalData): string {
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
  return "";
}

export function useLuminaBrand(data: ProposalData): string {
  const [name, setName] = useState(() => resolveLuminaBrand(data));

  useEffect(() => {
    const sync = () => setName(resolveLuminaBrand(data));
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
export function resolveLuminaLogoUrl(
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

export function useLuminaLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const [logoUrl, setLogoUrl] = useState(() =>
    resolveLuminaLogoUrl(data, installerLogoUrl)
  );

  useEffect(() => {
    const sync = () => setLogoUrl(resolveLuminaLogoUrl(data, installerLogoUrl));
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

export function useLuminaSurfaceBrand(
  data: ProposalData,
  surface: ProposalBrandSurface,
  installerLogoUrl?: string
): ProposalBrandPresentation {
  const installerName = useLuminaBrand(data);
  const logoUrl = useLuminaLogoUrl(data, installerLogoUrl);
  const [brandTick, setBrandTick] = useState(0);

  useEffect(() => {
    const sync = () => setBrandTick((n) => n + 1);
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const liveSettings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;
  // More-tab save should update this browser's preview immediately.
  // Shared links (empty local settings) still use the frozen snapshot.
  const hasLiveBrand = Boolean(
    liveSettings &&
      (liveSettings.installerLogoUrl?.trim() || liveSettings.installerName?.trim())
  );
  const config = resolveProposalBrandConfig({
    settings: liveSettings,
    pptInput: hasLiveBrand
      ? undefined
      : {
          brandDisplayMode: data.meta.brandDisplayMode,
          brandSectionConfig: data.meta.brandSectionConfig,
        },
  });
  void brandTick;

  return resolveProposalBrandPresentation(config, surface, {
    installerName,
    logoUrl,
    tagline: data.meta.brandTagline,
  });
}

export function splitLuminaWordmark(brandName: string): {
  head: string;
  tail: string;
} {
  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { head: brandName.trim(), tail: "" };
  return { head: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
}
