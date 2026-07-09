"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import { fmtInrSpaced, fmtLifetimeBenefitInr } from "@/lib/executive-premium-editorial/format";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import "./energy-freedom-proposal.css";

export type EnergyFreedomProposalRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
  installerLogoUrl?: string;
};

function metricValue(rows: { label: string; value: string }[], needle: string): string {
  const row = rows.find((r) => r.label.toLowerCase().includes(needle.toLowerCase()));
  return row?.value ?? "—";
}

function cityFromLocation(line: string): string {
  const t = line.trim();
  if (!t) return "your home";
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[0] || t;
}

function splitBrandName(name: string): { line1: string; line2: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { line1: "HARIHAR", line2: "SOLAR" };
  if (parts.length === 1) return { line1: parts[0]!.toUpperCase(), line2: "SOLAR" };
  return {
    line1: parts[0]!.toUpperCase(),
    line2: parts.slice(1).join(" ").toUpperCase(),
  };
}

export function EnergyFreedomProposalRenderer({
  pptInput,
  summary,
  installerLogoUrl: installerLogoUrlProp,
}: EnergyFreedomProposalRendererProps) {
  const m = useMemo(() => transformToEditorialModel(pptInput, summary), [pptInput, summary]);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return (
      installerLogoUrlProp?.trim() ||
      pptInput.installerLogoUrl?.trim() ||
      m.brand_logo_url?.trim() ||
      undefined
    );
  });

  const brandName = m.brand_display || summary.installer || "Harihar Solar";
  const brand = splitBrandName(brandName);
  const cityLabel = cityFromLocation(m.location_line || pptInput.location || "");
  const loadCoverage = metricValue(m.engineering.metrics_rows, "load coverage");

  useEffect(() => {
    const syncLogo = () => {
      const fromProp = installerLogoUrlProp?.trim() ?? "";
      const fromPpt = pptInput.installerLogoUrl?.trim() ?? "";
      const fromModel = m.brand_logo_url?.trim() ?? "";
      const fromLocal = readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      setLogoUrl(fromProp || fromModel || fromPpt || fromLocal || undefined);
    };
    syncLogo();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, syncLogo);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, syncLogo);
  }, [installerLogoUrlProp, m.brand_logo_url, pptInput.installerLogoUrl]);

  return (
    <div className="ef-proposal">
      <div className="ef-toolbar ef-no-print">
        <button type="button" className="ef-toolbar-btn" onClick={() => window.print()}>
          <Download className="h-4 w-4" aria-hidden />
          Print / PDF
        </button>
      </div>

      <div className="ef-doc">
        {/* P1: Cover — ultra minimal */}
        <section className="ef-page ef-cover-page">
          <div className="ef-cover-top">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="ef-cover-brand-logo" />
            ) : (
              <h1 className="ef-cover-brand">
                {brand.line1}
                <br />
                {brand.line2}
              </h1>
            )}
            <div className="ef-cover-client-block">
              <p className="ef-cover-client-kicker">Proposal for</p>
              <p className="ef-cover-client-name">{m.customer_name}</p>
            </div>
          </div>
          <div className="ef-cover-hero">
            <p className="ef-cover-energy-bg">ENERGY</p>
            <p className="ef-cover-reimagined">REIMAGINED.</p>
          </div>
        </section>

        {/* P2: The Story — asymmetrical layout */}
        <section className="ef-page ef-story-page">
          <div className="ef-story-grid">
            <div className="ef-story-left">
              <h2 className="ef-story-kicker">01. Perspective</h2>
              <p className="ef-story-headline">Your roof is not just shelter. It&apos;s a power plant.</p>
            </div>
            <div className="ef-story-right">
              <p className="ef-story-lead">
                The shift to solar isn&apos;t just a financial decision; it&apos;s a transition to energy
                sovereignty for your home{cityLabel ? ` in ${cityLabel}` : ""}.
              </p>
              <div className="ef-story-stat-box">
                <span className="ef-story-stat-value">{loadCoverage}</span>
                <p className="ef-story-stat-caption">
                  Estimated annual load coverage via our premium grid-architecture.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* P3: Financial Wealth Map */}
        <section className="ef-page ef-invest-page">
          <h2 className="ef-invest-title">
            Investment <span>Matrix</span>
          </h2>
          <div className="ef-invest-rows">
            <div className="ef-invest-row">
              <span className="ef-invest-row-label">Total Out-of-Pocket</span>
              <span className="ef-invest-row-value">{fmtInrSpaced(m.economics.net_cost_inr)}</span>
            </div>
            <div className="ef-invest-row">
              <span className="ef-invest-row-label">Payback Period</span>
              <span className="ef-invest-row-value">{m.economics.payback_years} Years</span>
            </div>
            <div className="ef-invest-hero-box">
              <p className="ef-invest-hero-kicker">25-Year Cumulative Profit</p>
              <p className="ef-invest-hero-value">{fmtLifetimeBenefitInr(m.economics.lifetime_profit_inr)}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
