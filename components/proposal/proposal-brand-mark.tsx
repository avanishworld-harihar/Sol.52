"use client";

import type { ReactNode } from "react";
import {
  installerLogoAlt,
  resolveProposalBrandPresentation,
  type ProposalBrandConfig,
  type ProposalBrandSurface,
} from "@/lib/proposal-branding-settings";

type Props = {
  surface: ProposalBrandSurface;
  brandConfig: ProposalBrandConfig;
  installerName: string;
  logoUrl?: string;
  tagline?: string;
  includeTagline?: boolean;
  layout?: "row" | "stack";
  logoClassName?: string;
  nameClassName?: string;
  taglineClassName?: string;
  className?: string;
  fallbackIcon?: ReactNode;
};

/**
 * Centralized installer logo + company name rendering for all proposal surfaces.
 * Behavior is driven only by ProposalBrandConfig — never hardcoded per page.
 */
export function ProposalBrandMark({
  surface,
  brandConfig,
  installerName,
  logoUrl,
  tagline,
  includeTagline = true,
  layout = "row",
  logoClassName = "h-9 w-auto max-w-[140px] object-contain object-left",
  nameClassName = "truncate text-sm font-bold text-slate-900",
  taglineClassName = "text-[10px] text-slate-500",
  className = "",
  fallbackIcon,
}: Props) {
  const pres = resolveProposalBrandPresentation(
    brandConfig,
    surface,
    { installerName, logoUrl, tagline },
    { includeTagline }
  );

  const showFallback = !pres.showLogo && (pres.showName || surface === "cover" || surface === "header");
  if (!pres.showLogo && !pres.showName && !pres.showTagline && !showFallback) return null;

  const logoNode = pres.showLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pres.logoUrl}
      alt={installerLogoAlt(pres.installerName)}
      className={logoClassName}
    />
  ) : showFallback ? (
    fallbackIcon
  ) : null;

  const textNode =
    pres.showName || pres.showTagline ? (
      <div className="min-w-0">
        {pres.showName ? <p className={nameClassName}>{pres.installerName}</p> : null}
        {pres.showTagline ? <p className={taglineClassName}>{pres.tagline}</p> : null}
      </div>
    ) : null;

  if (layout === "stack") {
    return (
      <div className={`flex flex-col items-start gap-2 ${className}`}>
        {logoNode}
        {textNode}
      </div>
    );
  }

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      {logoNode}
      {textNode}
    </div>
  );
}

/** Text-only brand line (footer / closing strips without logo). */
export function ProposalBrandTextLine({
  surface,
  brandConfig,
  installerName,
  parts,
  className = "",
}: {
  surface: ProposalBrandSurface;
  brandConfig: ProposalBrandConfig;
  installerName: string;
  parts: string[];
  className?: string;
}) {
  const pres = resolveProposalBrandPresentation(brandConfig, surface, { installerName });
  const filtered = pres.showName
    ? parts.filter(Boolean)
    : parts.filter((p) => p !== installerName.trim()).filter(Boolean);
  if (filtered.length === 0) return null;
  return <span className={className}>{filtered.join(" · ")}</span>;
}
