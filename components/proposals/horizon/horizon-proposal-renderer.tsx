"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="hz-page">
      <div className="hz-page-inner">{children}</div>
    </div>
  );
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
  const paybackLabel = m.economics.payback_years
    ? `${m.economics.payback_years} Yrs`
    : "—";

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

  const bom = m.architecture.bom_rows;
  const panelRow = bom.find(
    (r) => r.name.toLowerCase().includes("panel") || r.name.toLowerCase().includes("module")
  );
  const inverterRow = bom.find((r) => r.name.toLowerCase().includes("inverter"));
  const structureRow = bom.find(
    (r) => r.name.toLowerCase().includes("mount") || r.name.toLowerCase().includes("structure")
  );
  const engMetrics = m.engineering.metrics_rows;
  const loadCoverage = metricValue(engMetrics, "load");

  const defaultSteps = [
    "Site Survey",
    "Design & Engineering",
    "Subsidy Approval",
    "Installation",
    "Testing & Commissioning",
    "Go Live",
  ];

  return (
    <div className="hz-proposal">
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

      {/* P1 — Cover */}
      <Page>
        <div className="hz-cover">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="hz-cover-logo" />
          ) : (
            <p className="hz-cover-brand">{brandName}</p>
          )}
          <div className="hz-cover-hero">
            <h1 className="hz-h1">
              SOLAR
              <br />
              MASTER
              <br />
              PLAN
            </h1>
            <p className="hz-subtitle">
              Precision engineering for {customerName}, {cityLabel}
            </p>
          </div>
        </div>
      </Page>

      {/* P2 — Philosophy */}
      <Page>
        <div className="hz-philosophy-grid">
          <h2 className="hz-h2--italic">
            Energy
            <br />
            is an
            <br />
            Asset.
          </h2>
          <p className="hz-lead">
            We redefine how you perceive power. Moving from an endless bill cycle
            to a 25-year wealth-generation machine — engineered for {cityLabel}
            with {systemKw} kW of premium grid-architecture and{" "}
            {loadCoverage || "100%"} annual load coverage.
          </p>
        </div>
      </Page>

      {/* P3 — The Return Journey */}
      <Page>
        <p className="hz-section-tag">Financial Intelligence</p>
        <h2 className="hz-h2">The Return Journey</h2>
        <div className="hz-wealth-hero">
          <span className="hz-wealth-hero-label">Lifetime Profit</span>
          <p className="hz-wealth-hero-value">
            {fmtLifetimeBenefitInr(m.economics.lifetime_profit_inr)}
          </p>
        </div>
        <div className="hz-wealth-duo">
          <div>
            <span className="hz-wealth-stat-label">Payback Period</span>
            <p className="hz-wealth-stat-value">{paybackLabel}</p>
          </div>
          <div>
            <span className="hz-wealth-stat-label">Monthly Savings</span>
            <p className="hz-wealth-stat-value">
              {fmtInr(m.economics.monthly_savings_inr)}
            </p>
          </div>
        </div>
        <div className="hz-fin-rows">
          <div className="hz-fin-row">
            <span className="hz-fin-row-label">Total Out-of-Pocket</span>
            <span className="hz-fin-row-value">
              {fmtInr(m.economics.net_cost_inr)}
            </span>
          </div>
        </div>
      </Page>

      {/* P4 — Analysis */}
      <Page>
        <p className="hz-section-tag">Consumption Audit</p>
        <h2 className="hz-h2">The Wealth Leak</h2>
        <div className="hz-callout">
          <p>
            Your current electricity consumption pattern is an unoptimized asset.
            {hasBillData
              ? ` You are spending ${fmtInr(summary.yearlyBill)} per year on grid power — a cost that rises every year. We convert this recurring expense into long-term wealth.`
              : " We convert this recurring expense into long-term wealth through precision solar engineering."}
          </p>
        </div>
        {hasBillData && (
          <div className="hz-stat-row">
            <div>
              <span className="hz-stat-item-label">Current Annual Bill</span>
              <p className="hz-stat-item-value">{fmtInr(summary.yearlyBill)}</p>
            </div>
            <div>
              <span className="hz-stat-item-label">Bill Reduction</span>
              <p className="hz-stat-item-value hz-stat-item-value--teal">
                {m.bill.solar_savings_pct ?? "—"}
              </p>
            </div>
            <div>
              <span className="hz-stat-item-label">Monthly Savings</span>
              <p className="hz-stat-item-value">
                {fmtInr(m.economics.monthly_savings_inr)}
              </p>
            </div>
          </div>
        )}
      </Page>

      {/* P5 — Architecture */}
      <Page>
        <p className="hz-section-tag">System Design</p>
        <h2 className="hz-h2">{systemKw} kW Premium Grid-Architecture</h2>
        <ul className="hz-arch-list">
          {panelRow ? (
            <li className="hz-arch-item">
              <span className="hz-arch-name">Solar Panels</span>
              <span className="hz-arch-detail">
                {panelRow.brand || "Tier-1"} ·{" "}
                {panelRow.warranty || "25 Year Performance"}
              </span>
            </li>
          ) : (
            <li className="hz-arch-item">
              <span className="hz-arch-name">DCR Tier-1 Solar Modules</span>
              <span className="hz-arch-detail">25 Year Performance Guarantee</span>
            </li>
          )}
          {inverterRow ? (
            <li className="hz-arch-item">
              <span className="hz-arch-name">{systemKw} kW String Inverter</span>
              <span className="hz-arch-detail">
                {inverterRow.brand || "MPPT"} ·{" "}
                {inverterRow.warranty || "10 Year Warranty"}
              </span>
            </li>
          ) : (
            <li className="hz-arch-item">
              <span className="hz-arch-name">{systemKw} kW String Inverter (MPPT)</span>
              <span className="hz-arch-detail">10 Year Warranty</span>
            </li>
          )}
          {structureRow ? (
            <li className="hz-arch-item">
              <span className="hz-arch-name">Mounting Structure</span>
              <span className="hz-arch-detail">
                {structureRow.brand || "Hot-Dip Galvanized"} · Wind & Seismic Rated
              </span>
            </li>
          ) : (
            <li className="hz-arch-item">
              <span className="hz-arch-name">Hot-Dip Galvanized Structure</span>
              <span className="hz-arch-detail">Wind & Seismic Rated</span>
            </li>
          )}
          {bom
            .filter((r) => r !== panelRow && r !== inverterRow && r !== structureRow)
            .slice(0, 3)
            .map((r, i) => (
              <li key={i} className="hz-arch-item">
                <span className="hz-arch-name">{r.name}</span>
                <span className="hz-arch-detail">
                  {r.brand ? `${r.brand} · ` : ""}
                  {r.warranty || "Premium Grade"}
                </span>
              </li>
            ))}
        </ul>
      </Page>

      {/* P6 — Engineering */}
      <Page>
        <p className="hz-section-tag">Performance Engineering</p>
        <h2 className="hz-h2">
          {m.engineering.city_label || cityLabel} Optimized Design
        </h2>
        <div className="hz-eng-duo">
          <div>
            <span className="hz-eng-metric-label">Optimal Tilt Angle</span>
            <p className="hz-eng-metric-value">
              {m.engineering.tilt_deg ? `${m.engineering.tilt_deg}°` : "—"}
            </p>
          </div>
          <div>
            <span className="hz-eng-metric-label">Annual Generation</span>
            <p className="hz-eng-metric-value">
              {summary.annualUse
                ? `${summary.annualUse.toLocaleString("en-IN")} units`
                : "—"}
            </p>
          </div>
        </div>
        <div className="hz-eng-rows">
          {engMetrics.map((row, i) => (
            <div key={i} className="hz-eng-row">
              <span className="hz-eng-row-label">{row.label}</span>
              <span className="hz-eng-row-value">{row.value}</span>
            </div>
          ))}
          {m.engineering.tilt_note && (
            <div className="hz-eng-row">
              <span className="hz-eng-row-label">Tilt Note</span>
              <span className="hz-eng-row-value">{m.engineering.tilt_note}</span>
            </div>
          )}
        </div>
      </Page>

      {/* P7 — Subsidy */}
      <Page>
        <p className="hz-section-tag">Government Incentive</p>
        <h2 className="hz-h2">PM Surya Ghar</h2>
        <p className="hz-subsidy-hero">
          {m.economics.subsidy_inr > 0
            ? fmtInr(m.economics.subsidy_inr)
            : "₹0"}
        </p>
        <p className="hz-subsidy-caption">
          Government subsidy applied to your net investment.
        </p>
        <div className="hz-fin-rows">
          <div className="hz-fin-row">
            <span className="hz-fin-row-label">Gross System Cost</span>
            <span className="hz-fin-row-value">
              {fmtInr(m.economics.gross_cost_inr)}
            </span>
          </div>
          <div className="hz-fin-row">
            <span className="hz-fin-row-label">PM Surya Ghar Subsidy</span>
            <span className="hz-fin-row-value hz-fin-row-value--teal">
              -{fmtInr(m.economics.subsidy_inr)}
            </span>
          </div>
          <div className="hz-fin-row">
            <span className="hz-fin-row-label">Final Investment</span>
            <span className="hz-fin-row-value">
              {fmtInr(m.economics.net_cost_inr)}
            </span>
          </div>
        </div>
      </Page>

      {/* P8 — Ecology */}
      <Page>
        <p className="hz-section-tag">Environmental Impact</p>
        <h2 className="hz-h2">Eco-Retention</h2>
        <div className="hz-eco-duo">
          <div>
            <p className="hz-eco-value">
              {m.impact.trees?.toLocaleString("en-IN") ?? "—"}
            </p>
            <span className="hz-eco-label">Trees equivalent</span>
            <p className="hz-eco-desc">
              Carbon sequestration equivalent over 25 years of clean energy
              generation.
            </p>
          </div>
          <div>
            <p className="hz-eco-value">
              {m.impact.co2_tons?.toLocaleString("en-IN") ?? "—"}
            </p>
            <span className="hz-eco-label">Tonnes CO₂ offset</span>
            <p className="hz-eco-desc">
              Greenhouse gas emissions avoided over the system lifetime.
            </p>
          </div>
        </div>
        <div className="hz-callout" style={{ marginTop: "3rem" }}>
          <p>
            Every unit generated by your {systemKw} kW system displaces fossil
            fuel grid electricity — creating measurable environmental impact for{" "}
            {cityLabel}.
          </p>
        </div>
      </Page>

      {/* P9 — Hardware */}
      <Page>
        <p className="hz-section-tag">Component Manifest</p>
        <h2 className="hz-h2">Tier-1 Components</h2>
        <div className="hz-hw-list">
          {bom.length > 0 ? (
            bom.map((row, i) => (
              <div key={i} className="hz-hw-item">
                <div>
                  {row.brand && <p className="hz-hw-brand">{row.brand}</p>}
                  <p className="hz-hw-name">{row.name}</p>
                  {row.warranty && (
                    <span className="hz-hw-badge">{row.warranty} Warranty</span>
                  )}
                </div>
                <div>
                  {row.spec && <p className="hz-hw-spec">{row.spec}</p>}
                  {row.technical_points && row.technical_points.length > 0 && (
                    <ul className="hz-hw-points">
                      {row.technical_points.slice(0, 3).map((pt, j) => (
                        <li key={j}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="hz-hw-item">
                <div>
                  <p className="hz-hw-brand">Waaree / Adani / Vikram</p>
                  <p className="hz-hw-name">Solar Panels</p>
                  <span className="hz-hw-badge">30 Year Performance</span>
                </div>
                <div>
                  <p className="hz-hw-spec">DCR Tier-1 · {systemKw} kW</p>
                </div>
              </div>
              <div className="hz-hw-item">
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
      </Page>

      {/* P10 — Roadmap */}
      <Page>
        <p className="hz-section-tag">Project Delivery</p>
        <h2 className="hz-h2">Execution Roadmap</h2>
        <div className="hz-roadmap">
          {m.execution.steps.length > 0
            ? m.execution.steps.map((step, i) => (
                <div key={i} className="hz-roadmap-step">
                  <span className="hz-roadmap-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="hz-roadmap-title">{step.title}</p>
                    {step.description && (
                      <p className="hz-roadmap-desc">{step.description}</p>
                    )}
                  </div>
                </div>
              ))
            : defaultSteps.map((title, i) => (
                <div key={i} className="hz-roadmap-step">
                  <span className="hz-roadmap-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="hz-roadmap-title">{title}</p>
                  </div>
                </div>
              ))}
        </div>
      </Page>

      {/* P11 — Commitment */}
      <Page>
        <p className="hz-section-tag">Final Acceptance</p>
        <h2 className="hz-h2">Commitment</h2>
        <p className="hz-commit-lead">
          This proposal for a {systemKw} kW solar system for {customerName} is
          valid for 30 days. By signing below, you confirm acceptance of the
          scope, pricing, and terms outlined in this document.
        </p>
        <div className="hz-sign-grid">
          <div>
            <span className="hz-sign-label">Customer Acceptance</span>
            <span className="hz-sign-line">{customerName}</span>
            <span className="hz-sign-label" style={{ marginTop: "1.5rem" }}>
              Signature
            </span>
            <span className="hz-sign-line">&nbsp;</span>
          </div>
          <div>
            <span className="hz-sign-label">Date of Acceptance</span>
            <span className="hz-sign-line">&nbsp;</span>
            <span className="hz-sign-label" style={{ marginTop: "1.5rem" }}>
              Prepared by
            </span>
            <span className="hz-sign-line">{brandName}</span>
          </div>
        </div>
      </Page>
    </div>
  );
}
