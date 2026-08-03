"use client";

/**
 * Premium Luxe — live branding from More → Brand settings.
 * Surfaces: cover / header / footer / closing (same contract as Atelier / Golden).
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  installerLogoAlt,
  readProposalBrandingSettings,
  resolveInstallerDisplayName,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
  type ProposalBrandConfig,
  type ProposalBrandPresentation,
  type ProposalBrandSurface,
} from "@/lib/proposal-branding-settings";
import {
  luxeVendorOrFallback,
  resolveLuxeVendorName,
} from "./luxe-vendor";
import { useLuxeLang } from "./luxe-lang-context";
import styles from "./luxe.module.css";

export type LuxeBrandBundle = {
  logoUrl: string;
  brandConfig: ProposalBrandConfig;
  vendorName: string;
  tagline: string;
  cover: ProposalBrandPresentation;
  header: ProposalBrandPresentation;
  footer: ProposalBrandPresentation;
  closing: ProposalBrandPresentation;
};

const LuxeBrandContext = createContext<LuxeBrandBundle | null>(null);

function resolveLogoUrl(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null,
  installerLogoUrl?: string | null
): string {
  const settings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;
  return (
    data.meta.brandLogoUrl?.trim() ||
    installerLogoUrl?.trim() ||
    pptInput?.installerLogoUrl?.trim() ||
    settings?.installerLogoUrl?.trim() ||
    ""
  );
}

function buildBundle(
  data: ProposalData,
  pptInput: PremiumProposalPptInput | null | undefined,
  installerLogoUrl: string | null | undefined,
  isHi: boolean
): LuxeBrandBundle {
  const settings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;
  const logoUrl = resolveLogoUrl(data, pptInput, installerLogoUrl);
  const brandConfig = resolveProposalBrandConfig({ pptInput, settings });
  const fromMore = settings
    ? resolveInstallerDisplayName(settings).trim()
    : "";
  const vendorName = luxeVendorOrFallback(
    fromMore || resolveLuxeVendorName(data, pptInput),
    isHi
  );
  const tagline =
    data.meta.brandTagline?.trim() ||
    settings?.companyProfile?.tagline?.trim() ||
    "";
  const identity = { installerName: vendorName, logoUrl, tagline };
  return {
    logoUrl,
    brandConfig,
    vendorName,
    tagline,
    cover: resolveProposalBrandPresentation(brandConfig, "cover", identity),
    header: resolveProposalBrandPresentation(brandConfig, "header", identity, {
      includeTagline: false,
    }),
    footer: resolveProposalBrandPresentation(brandConfig, "footer", identity, {
      includeTagline: false,
    }),
    closing: resolveProposalBrandPresentation(brandConfig, "closing", identity),
  };
}

export function LuxeBrandProvider({
  data,
  pptInput,
  installerLogoUrl,
  children,
}: {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
  installerLogoUrl?: string | null;
  children: ReactNode;
}) {
  const { isHi } = useLuxeLang();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const value = useMemo(() => {
    void tick;
    return buildBundle(data, pptInput, installerLogoUrl, isHi);
  }, [data, pptInput, installerLogoUrl, isHi, tick]);

  return (
    <LuxeBrandContext.Provider value={value}>{children}</LuxeBrandContext.Provider>
  );
}

export function useLuxeBrand(): LuxeBrandBundle {
  const ctx = useContext(LuxeBrandContext);
  if (!ctx) {
    throw new Error("useLuxeBrand must be used within LuxeBrandProvider");
  }
  return ctx;
}

type MarkProps = {
  surface: ProposalBrandSurface;
  size?: "cover" | "header" | "footer" | "closing";
  className?: string;
};

/** Logo / name mark driven by More → Brand section rules. */
export function LuxeBrandMark({
  surface,
  size = "header",
  className = "",
}: MarkProps) {
  const brand = useLuxeBrand();
  const pres =
    surface === "cover"
      ? brand.cover
      : surface === "header"
        ? brand.header
        : surface === "footer"
          ? brand.footer
          : brand.closing;

  const showNameFallback =
    !pres.showLogo && (pres.showName || surface === "cover" || surface === "header");
  if (!pres.showLogo && !pres.showName && !showNameFallback) return null;

  const sizeClass =
    size === "cover"
      ? styles.luxeBrandCover
      : size === "closing"
        ? styles.luxeBrandClosing
        : size === "footer"
          ? styles.luxeBrandFooter
          : styles.luxeBrandHeader;

  return (
    <div className={`${styles.luxeBrandMark} ${sizeClass} ${className}`.trim()}>
      {pres.showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- print A4 brand asset
        <img
          src={pres.logoUrl}
          alt={installerLogoAlt(pres.installerName || brand.vendorName)}
          className={styles.luxeBrandLogo}
        />
      ) : null}
      {pres.showName || showNameFallback ? (
        <div className={styles.luxeBrandText}>
          <span className={styles.luxeBrandName}>
            {(pres.installerName || brand.vendorName).toUpperCase()}
          </span>
          {pres.showTagline && brand.tagline ? (
            <span className={styles.luxeBrandTagline}>{brand.tagline}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Shared page footer — logo/name per footer branding rule + page number. */
export function LuxePageFooter({ pageLabel }: { pageLabel: string }) {
  const brand = useLuxeBrand();
  const showName = brand.footer.showName || !brand.footer.showLogo;
  return (
    <footer className={styles.impactPageFooter}>
      <div className={styles.luxeFooterBrand}>
        {brand.footer.showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.footer.logoUrl}
            alt={installerLogoAlt(brand.vendorName)}
            className={styles.luxeFooterLogo}
          />
        ) : null}
        {showName ? (
          <span>{(brand.footer.installerName || brand.vendorName).toUpperCase()}</span>
        ) : null}
      </div>
      <span>{pageLabel}</span>
    </footer>
  );
}

/** Compact header brand for interior pages (gold tag row). */
export function LuxeHeaderBrand() {
  return <LuxeBrandMark surface="header" size="header" />;
}
