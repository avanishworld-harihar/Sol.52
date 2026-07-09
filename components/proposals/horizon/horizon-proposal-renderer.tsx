"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import {
  fmtInr,
  fmtLifetimeBenefitInr,
} from "@/lib/executive-premium-editorial/format";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import "./horizon-proposal.css";

export type HorizonProposalRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
  installerLogoUrl?: string;
};

function cityFromLocation(line: string): string {
  const t = line.trim();
  if (!t) return "your home";
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[0] || t;
}

function metricValue(
  rows: { label: string; value: string }[],
  needle: string
): string {
  const row = rows.find((r) =>
    r.label.toLowerCase().includes(needle.toLowerCase())
  );
  return row?.value ?? "—";
}


export function HorizonProposalRenderer({
  pptInput,
  summary,
  installerLogoUrl: installerLogoUrlProp,
}: HorizonProposalRendererProps) {
  const m = useMemo(() => transformToEditorialModel(pptInput, summary), [pptInput, summary]);

  const [logoUrl, setLogoUrl] = useState<string | undefined>(() =>
    installerLogoUrlProp?.trim() ||
    pptInput.installerLogoUrl?.trim() ||
    m.brand_logo_url?.trim() ||
    undefined
  );

  const brandName = m.brand_display || summary.installer || "Harihar Solar";
  const cityLabel = cityFromLocation(m.location_line || pptInput.location || "");
  const customerName = m.customer_name || pptInput.customerName || "Valued Customer";
  const systemKw = summary.systemKw;
  const hasBillData = m.bill.months.some((mo) => mo.units > 0 || mo.net_inr > 0);

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

  /** Shared page header */
  const PageHeader = ({ label }: { label: string }) => (
    <div className="hz-page-header">
      <span className="hz-page-label">{label}</span>
      {logoUrl ? (
        <img src={logoUrl} alt={brandName} className="hz-page-logo" />
      ) : null}
    </div>
  );

  /** Shared page footer */
  const PageFooter = () => (
    <div className="hz-page-footer">
      {brandName.toUpperCase()} | PROPOSAL 2026
    </div>
  );

  // ── BOM helpers ─────────────────────────────────────────────────────────
  const bom = m.architecture.bom_rows;
  const panelRow = bom.find(
    (r) => r.name.toLowerCase().includes("panel") || r.name.toLowerCase().includes("module")
  );
  const inverterRow = bom.find((r) => r.name.toLowerCase().includes("inverter"));
  const structureRow = bom.find(
    (r) => r.name.toLowerCase().includes("mount") || r.name.toLowerCase().includes("structure")
  );

  // ── Engineering helpers ─────────────────────────────────────────────────
  const engMetrics = m.engineering.metrics_rows;
  const loadCoverage = metricValue(engMetrics, "load");

  return (
    <div className="hz-proposal">
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="hz-toolbar hz-no-print">
        <button
          className="hz-toolbar-btn"
          onClick={() => window.print()}
          aria-label="Print proposal"
        >
          <Printer size={14} />
          Print / Save PDF
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P1 — Cover
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Cover" />
        <div className="hz-page-body">
          <div className="hz-cover-hero">
            <h1 className="hz-cover-title">
              ENERGY
              <br />
              FREEDOM
            </h1>
            <p className="hz-cover-sub">
              Masterplan for {customerName},{" "}
              {cityLabel}
            </p>
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P2 — Vision
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Vision" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">The {brandName} Vision</h2>
          <p className="hz-vision-text">
            We don&apos;t just install panels; we build energy-independent
            futures. Every system we design is engineered for maximum
            performance, lifetime savings, and the confidence that comes from
            true energy sovereignty.
          </p>

          <div className="hz-stat-trio" style={{ marginTop: "3rem" }}>
            <div className="hz-stat-cell hz-stat-cell--teal">
              <p className="hz-stat-value hz-stat-value--teal">
                {systemKw} kW
              </p>
              <span className="hz-stat-label">Proposed System Size</span>
            </div>
            <div className="hz-stat-cell">
              <p className="hz-stat-value">{loadCoverage || "100%"}</p>
              <span className="hz-stat-label">Annual Load Coverage</span>
            </div>
            <div className="hz-stat-cell">
              <p className="hz-stat-value">25 Yr</p>
              <span className="hz-stat-label">Performance Guarantee</span>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P3 — Analysis / The Wealth Leak
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Analysis" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">The Wealth Leak</h2>
          <div className="hz-callout-box">
            <p>
              Your current electricity consumption pattern is an unoptimized
              asset. {hasBillData
                ? `You are spending ${fmtInr(summary.yearlyBill)} per year on grid power — a cost that rises every year. We convert this recurring expense into long-term wealth.`
                : "We convert this recurring expense into long-term wealth through precision solar engineering."}
            </p>
          </div>

          {hasBillData && (
            <div className="hz-stat-trio">
              <div className="hz-stat-cell">
                <p className="hz-stat-value">
                  {fmtInr(summary.yearlyBill)}
                </p>
                <span className="hz-stat-label">Current Annual Bill</span>
              </div>
              <div className="hz-stat-cell hz-stat-cell--teal">
                <p className="hz-stat-value hz-stat-value--teal">
                  {m.bill.solar_savings_pct ?? "—"}
                </p>
                <span className="hz-stat-label">Bill Reduction via Solar</span>
              </div>
              <div className="hz-stat-cell">
                <p className="hz-stat-value">
                  {fmtInr(m.economics.monthly_savings_inr)}/mo
                </p>
                <span className="hz-stat-label">Monthly Savings</span>
              </div>
            </div>
          )}
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P4 — Architecture
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Architecture" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">
            {systemKw} kW Premium Grid-Architecture
          </h2>
          <ul className="hz-bom-list">
            {panelRow ? (
              <li className="hz-bom-item">
                <span className="hz-bom-item-name">
                  Solar Panels
                </span>
                <span className="hz-bom-item-detail">
                  {panelRow.brand || "Tier-1"} ·{" "}
                  {panelRow.warranty
                    ? `${panelRow.warranty} Warranty`
                    : "25 Year Performance"}
                </span>
              </li>
            ) : (
              <li className="hz-bom-item">
                <span className="hz-bom-item-name">
                  DCR Tier-1 Solar Modules
                </span>
                <span className="hz-bom-item-detail">
                  25 Year Performance Guarantee
                </span>
              </li>
            )}
            {inverterRow ? (
              <li className="hz-bom-item">
                <span className="hz-bom-item-name">
                  {systemKw} kW String Inverter
                </span>
                <span className="hz-bom-item-detail">
                  {inverterRow.brand || "MPPT"} ·{" "}
                  {inverterRow.warranty
                    ? `${inverterRow.warranty} Warranty`
                    : "10 Year Warranty"}
                </span>
              </li>
            ) : (
              <li className="hz-bom-item">
                <span className="hz-bom-item-name">
                  {systemKw} kW String Inverter (MPPT)
                </span>
                <span className="hz-bom-item-detail">10 Year Warranty</span>
              </li>
            )}
            {structureRow ? (
              <li className="hz-bom-item">
                <span className="hz-bom-item-name">Mounting Structure</span>
                <span className="hz-bom-item-detail">
                  {structureRow.brand || "Hot-Dip Galvanized"} · Wind & Seismic Rated
                </span>
              </li>
            ) : (
              <li className="hz-bom-item">
                <span className="hz-bom-item-name">
                  Hot-Dip Galvanized Structure
                </span>
                <span className="hz-bom-item-detail">
                  Wind & Seismic Rated
                </span>
              </li>
            )}
            {bom
              .filter(
                (r) =>
                  r !== panelRow && r !== inverterRow && r !== structureRow
              )
              .slice(0, 3)
              .map((r, i) => (
                <li key={i} className="hz-bom-item">
                  <span className="hz-bom-item-name">{r.name}</span>
                  <span className="hz-bom-item-detail">
                    {r.brand ? `${r.brand} · ` : ""}
                    {r.warranty ? `${r.warranty} Warranty` : "Premium Grade"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P5 — Engineering
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Engineering" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">
            {m.engineering.city_label || cityLabel} Optimized Design
          </h2>
          <div className="hz-eng-grid">
            <div className="hz-eng-cell">
              <span className="hz-eng-cell-label">Optimal Tilt Angle</span>
              <p className="hz-eng-cell-value">
                {m.engineering.tilt_deg
                  ? `${m.engineering.tilt_deg}°`
                  : "—"}
              </p>
            </div>
            <div className="hz-eng-cell">
              <span className="hz-eng-cell-label">Annual Generation</span>
              <p className="hz-eng-cell-value">
                {summary.annualUse
                  ? `${summary.annualUse.toLocaleString("en-IN")} u`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="hz-eng-metrics">
            {engMetrics.map((row, i) => (
              <div key={i} className="hz-eng-row">
                <span className="hz-eng-row-label">{row.label}</span>
                <span className="hz-eng-row-value">{row.value}</span>
              </div>
            ))}
            {m.engineering.tilt_note && (
              <div className="hz-eng-row">
                <span className="hz-eng-row-label">Tilt Note</span>
                <span className="hz-eng-row-value">
                  {m.engineering.tilt_note}
                </span>
              </div>
            )}
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P6 — Financials / The Wealth Map
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Financials" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">The Wealth Map</h2>

          <div className="hz-fin-hero">
            <p className="hz-fin-hero-value">
              {fmtLifetimeBenefitInr(m.economics.lifetime_profit_inr)}
            </p>
            <p className="hz-fin-hero-caption">
              Lifetime wealth created over 25 years
            </p>
          </div>

          <div className="hz-fin-row-list">
            <div className="hz-fin-row">
              <span className="hz-fin-row-label">Total Out-of-Pocket</span>
              <span className="hz-fin-row-value">
                {fmtInr(m.economics.net_cost_inr)}
              </span>
            </div>
            <div className="hz-fin-row">
              <span className="hz-fin-row-label">Monthly Savings</span>
              <span className="hz-fin-row-value">
                {fmtInr(m.economics.monthly_savings_inr)}
              </span>
            </div>
            <div className="hz-fin-row">
              <span className="hz-fin-row-label">Payback Period</span>
              <span className="hz-fin-row-value">
                {m.economics.payback_years
                  ? `${m.economics.payback_years} Yr`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P7 — Subsidy
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Subsidy" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">PM Surya Ghar</h2>

          <p className="hz-subsidy-hero">
            {m.economics.subsidy_inr > 0
              ? fmtInr(m.economics.subsidy_inr)
              : "₹0"}
          </p>
          <p className="hz-subsidy-caption">
            Government subsidy — applied to your net cost.
          </p>

          <div className="hz-fin-row-list" style={{ marginTop: "3rem" }}>
            <div className="hz-fin-row">
              <span className="hz-fin-row-label">Gross System Cost</span>
              <span className="hz-fin-row-value">
                {fmtInr(m.economics.gross_cost_inr)}
              </span>
            </div>
            <div className="hz-fin-row">
              <span className="hz-fin-row-label">PM Surya Ghar Subsidy</span>
              <span className="hz-fin-row-value" style={{ color: "#0d7a70" }}>
                -{fmtInr(m.economics.subsidy_inr)}
              </span>
            </div>
            <div className="hz-fin-row">
              <span className="hz-fin-row-label" style={{ fontWeight: 700 }}>
                Final Investment
              </span>
              <span
                className="hz-fin-row-value"
                style={{ fontSize: "2.5rem" }}
              >
                {fmtInr(m.economics.net_cost_inr)}
              </span>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P8 — Ecology / Eco-Retention
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Impact" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">Eco-Retention</h2>

          <div className="hz-eco-grid">
            <div>
              <p className="hz-eco-number">
                {m.impact.trees?.toLocaleString("en-IN") ?? "—"}
              </p>
              <span className="hz-eco-unit">Trees equivalent</span>
              <p className="hz-eco-desc">
                Carbon sequestration equivalent over 25 years of clean energy
                generation.
              </p>
            </div>
            <div>
              <p className="hz-eco-number">
                {m.impact.co2_tons?.toLocaleString("en-IN") ?? "—"}
              </p>
              <span className="hz-eco-unit">Tonnes CO₂ offset</span>
              <p className="hz-eco-desc">
                Greenhouse gas emissions avoided over the system lifetime.
              </p>
            </div>
          </div>

          <div className="hz-callout-box" style={{ marginTop: "3rem" }}>
            <p>
              Every unit of solar power generated by your {systemKw} kW system
              directly displaces grid electricity produced from fossil fuels —
              creating measurable, lasting environmental impact for{" "}
              {cityLabel}.
            </p>
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P9 — Hardware / Tier-1 Components
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Hardware" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">Tier-1 Components</h2>

          <div className="hz-hw-list">
            {bom.map((row, i) => (
              <div key={i} className="hz-hw-row">
                <div>
                  {row.brand && (
                    <p className="hz-hw-brand">{row.brand}</p>
                  )}
                  <p className="hz-hw-name">{row.name}</p>
                  {row.warranty && (
                    <span className="hz-hw-badge">{row.warranty} Warranty</span>
                  )}
                </div>
                <div>
                  {row.spec && (
                    <p className="hz-hw-spec">{row.spec}</p>
                  )}
                  {row.technical_points && row.technical_points.length > 0 && (
                    <ul className="hz-hw-points">
                      {row.technical_points.slice(0, 3).map((pt: string, j: number) => (
                        <li key={j}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {bom.length === 0 && (
              <>
                <div className="hz-hw-row">
                  <div>
                    <p className="hz-hw-brand">Waaree / Adani / Vikram</p>
                    <p className="hz-hw-name">Solar Panels</p>
                    <span className="hz-hw-badge">30 Year Performance</span>
                  </div>
                  <div>
                    <p className="hz-hw-spec">DCR Tier-1 · {systemKw} kW</p>
                  </div>
                </div>
                <div className="hz-hw-row">
                  <div>
                    <p className="hz-hw-brand">Havells / Growatt / Solis</p>
                    <p className="hz-hw-name">String Inverter</p>
                    <span className="hz-hw-badge">10 Year Warranty</span>
                  </div>
                  <div>
                    <p className="hz-hw-spec">MPPT · Grid-Tie</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P10 — Roadmap
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Roadmap" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">Execution Roadmap</h2>

          <div className="hz-roadmap-steps">
            {m.execution.steps.length > 0
              ? m.execution.steps.map((step, i) => (
                  <div key={i} className="hz-roadmap-step">
                    <div className="hz-roadmap-num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="hz-roadmap-title">{step.title}</p>
                      {step.description && (
                        <p className="hz-roadmap-desc">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))
              : [
                  "Site Survey",
                  "Design & Engineering",
                  "Subsidy Approval",
                  "Installation",
                  "Testing & Commissioning",
                  "Go Live",
                ].map((s, i) => (
                  <div key={i} className="hz-roadmap-step">
                    <div className="hz-roadmap-num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="hz-roadmap-title">{s}</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
        <PageFooter />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          P11 — Commitment
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hz-page">
        <PageHeader label="Commitment" />
        <div className="hz-page-body">
          <h2 className="hz-section-title">Final Acceptance</h2>
          <p style={{ color: "#64748b", marginBottom: "2rem" }}>
            This proposal for a {systemKw} kW solar system for{" "}
            {customerName} is valid for 30 days. By signing below, you
            confirm acceptance of the scope, pricing, and terms outlined in
            this document.
          </p>

          <div className="hz-acceptance-grid">
            <div>
              <span className="hz-sign-label">Customer Acceptance</span>
              <span className="hz-sign-line">
                {customerName}
              </span>
              <span
                className="hz-sign-label"
                style={{ marginTop: "1.5rem", marginBottom: "3rem" }}
              >
                Signature
              </span>
              <span className="hz-sign-line">&nbsp;</span>
            </div>
            <div>
              <span className="hz-sign-label">Date of Acceptance</span>
              <span className="hz-sign-line">&nbsp;</span>
              <span
                className="hz-sign-label"
                style={{ marginTop: "1.5rem", marginBottom: "3rem" }}
              >
                Prepared by
              </span>
              <span className="hz-sign-line">{brandName}</span>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>
    </div>
  );
}
