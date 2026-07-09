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

type WowPageVariant = "white" | "gray" | "dark";

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

function shortWarranty(warranty: string): string {
  const t = warranty.trim();
  if (!t) return "—";
  const yrMatch = t.match(/(\d+)\s*(?:year|yr)/i);
  if (yrMatch) return `${yrMatch[1]} Yrs`;
  return t.length > 12 ? t.slice(0, 12) : t;
}

function WowPage({
  children,
  variant = "white",
}: {
  children: ReactNode;
  variant?: WowPageVariant;
}) {
  const cls =
    variant === "gray"
      ? "hz-page hz-page--gray"
      : variant === "dark"
        ? "hz-page hz-page--dark"
        : "hz-page";
  return (
    <div className={cls}>
      <div className="hz-page-inner">{children}</div>
    </div>
  );
}

function archRowsFromBom(
  bom: {
    name: string;
    brand: string;
    warranty: string;
  }[],
  systemKw: number
) {
  if (bom.length === 0) {
    return [
      { item: "Panels", detail: "Waaree TOPCon", war: "30 Yrs" },
      { item: "Inverter", detail: "Havells String", war: "10 Yrs" },
      { item: "Structure", detail: "JSW Galvanized", war: "10 Yrs" },
    ];
  }
  return bom.slice(0, 6).map((row) => {
    const key = row.name.toLowerCase();
    let item = row.name;
    if (key.includes("panel") || key.includes("module")) item = "Panels";
    else if (key.includes("inverter")) item = "Inverter";
    else if (key.includes("mount") || key.includes("structure")) item = "Structure";
    return {
      item,
      detail: row.brand || `${systemKw} kW System`,
      war: shortWarranty(row.warranty),
    };
  });
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

  const engMetrics = m.engineering.metrics_rows;
  const loadCoverage = metricValue(engMetrics, "load");
  const peakSun = metricValue(engMetrics, "peak sun");
  const tiltLabel = m.engineering.tilt_deg ? `${m.engineering.tilt_deg}°` : "—";
  const annualGen = summary.annualUse
    ? `${summary.annualUse.toLocaleString("en-IN")} Units`
    : "—";

  const archRows = archRowsFromBom(m.architecture.bom_rows, systemKw);

  const defaultSteps = [
    "Site Survey",
    "Design & SLD",
    "Net-Meter Application",
    "Installation",
    "Testing",
    "Go Live",
  ];

  const journeySteps =
    m.execution.steps.length > 0
      ? m.execution.steps.map((s) => ({ title: s.title, desc: s.description }))
      : defaultSteps.map((title) => ({ title, desc: "" }));

  const warrantyBoxes =
    m.warranty.highlights.length > 0
      ? m.warranty.highlights
      : m.warranty.rows.slice(0, 6).map((r) => ({
          value: r.duration.split(" ")[0] ?? r.duration,
          unit: r.duration.includes("Year") ? "Yrs" : "",
          label: r.item,
          icon: "shield" as const,
        }));

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
      <WowPage>
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
      </WowPage>

      {/* P2 — Philosophy */}
      <WowPage>
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
      </WowPage>

      {/* P3 — Return Journey */}
      <WowPage>
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
      </WowPage>

      {/* P4 — Engineering Precision */}
      <WowPage variant="gray">
        <p className="hz-wow-tag">04. Engineering</p>
        <div className="hz-eng-wow-grid">
          <h2 className="hz-eng-wow-title">
            Design
            <br />
            Parameters
          </h2>
          <div className="hz-eng-wow-metrics">
            <div>
              <p className="hz-eng-wow-metric-label">Peak Sun Hours</p>
              <p className="hz-eng-wow-metric-value">{peakSun}</p>
            </div>
            <div>
              <p className="hz-eng-wow-metric-label">Panel Tilt</p>
              <p className="hz-eng-wow-metric-value">{tiltLabel}</p>
            </div>
            <div>
              <p className="hz-eng-wow-metric-label">Annual Gen</p>
              <p className="hz-eng-wow-metric-value">{annualGen}</p>
            </div>
          </div>
        </div>
      </WowPage>

      {/* P5 — Hardware Intelligence */}
      <WowPage>
        <h2 className="hz-h2--wow">The Architecture</h2>
        <div className="hz-arch-table">
          {archRows.map((part, i) => (
            <div key={i} className="hz-arch-row">
              <span className="hz-arch-item">{part.item}</span>
              <span className="hz-arch-detail">{part.detail}</span>
              <span className="hz-arch-war">{part.war}</span>
            </div>
          ))}
        </div>
      </WowPage>

      {/* P6 — Subsidy Impact */}
      <WowPage variant="dark">
        <div className="hz-subsidy-dark">
          <p className="hz-subsidy-dark-kicker">Government Support</p>
          <h2 className="hz-subsidy-dark-title">
            PM SURYA
            <br />
            GHAR
          </h2>
          <p className="hz-subsidy-dark-amount">
            Subsidy Applied:{" "}
            <strong>
              {m.economics.subsidy_inr > 0
                ? fmtInr(m.economics.subsidy_inr)
                : "₹0"}
            </strong>
          </p>
        </div>
      </WowPage>

      {/* P7 — Journey / Roadmap */}
      <WowPage>
        <h2 className="hz-h2--wow">The Journey</h2>
        <div className="hz-journey">
          {journeySteps.map((step, i) => (
            <div key={i} className="hz-journey-step">
              <span className="hz-journey-num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="hz-journey-title">{step.title}</p>
                {step.desc ? <p className="hz-journey-desc">{step.desc}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </WowPage>

      {/* P8 — Warranty Matrix */}
      <WowPage variant="gray">
        <p className="hz-wow-tag">08. Warranty Matrix</p>
        <h2 className="hz-h2--mega">Assurance Grid</h2>
        {m.warranty.intro ? (
          <p className="hz-warranty-intro">{m.warranty.intro}</p>
        ) : null}

        <div className="hz-warranty-grid">
          {warrantyBoxes.map((box, i) => (
            <div key={i} className="hz-warranty-box">
              <span className="hz-warranty-box-value">
                {box.value}
                {box.unit ? (
                  <span className="hz-warranty-box-unit"> {box.unit}</span>
                ) : null}
              </span>
              <span className="hz-warranty-box-label">{box.label}</span>
            </div>
          ))}
        </div>

        {m.warranty.rows.length > 0 && (
          <table className="hz-warranty-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Duration</th>
                <th>By</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {m.warranty.rows.map((row) => (
                <tr key={row.item}>
                  <td>{row.item}</td>
                  <td>{row.duration}</td>
                  <td>{row.by}</td>
                  <td>{row.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </WowPage>

      {/* P9 — Terms (Legal Art) */}
      <WowPage>
        <p className="hz-wow-tag">09. Terms &amp; Conditions</p>
        <h2 className="hz-h2--mega">Legal Art</h2>
        <div className="hz-terms-art">
          <div className="hz-terms-columns">
            <div className="hz-terms-block">
              <h3 className="hz-terms-block-title">General Terms</h3>
              <ul className="hz-terms-list">
                {m.terms.terms_conditions.map((item, i) => (
                  <li key={i} className="hz-terms-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hz-terms-block">
              <h3 className="hz-terms-block-title">Documents Required</h3>
              <ul className="hz-terms-list">
                {m.terms.documents_required.map((item, i) => (
                  <li key={i} className="hz-terms-item">
                    {item}
                  </li>
                ))}
              </ul>
              {m.terms.amc_objective ? (
                <>
                  <h3
                    className="hz-terms-block-title"
                    style={{ marginTop: "2rem" }}
                  >
                    AMC Scope
                  </h3>
                  <p className="hz-terms-para">{m.terms.amc_objective}</p>
                  <ul className="hz-terms-list">
                    {m.terms.amc_scope.map((item, i) => (
                      <li key={i} className="hz-terms-item">
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </WowPage>

      {/* P10 — Eco-Retention */}
      <WowPage>
        <p className="hz-wow-tag">10. Environmental Impact</p>
        <h2 className="hz-h2--mega">Eco-Retention</h2>
        <div className="hz-eco-wow">
          <div>
            <p className="hz-eco-value">
              {m.impact.trees?.toLocaleString("en-IN") ?? "—"}
            </p>
            <span className="hz-eco-label">Trees equivalent</span>
          </div>
          <div>
            <p className="hz-eco-value">
              {m.impact.co2_tons?.toLocaleString("en-IN") ?? "—"}
            </p>
            <span className="hz-eco-label">Tonnes CO₂ offset</span>
          </div>
        </div>
      </WowPage>

      {/* P11 — Closing Statement */}
      <WowPage>
        <div className="hz-closing">
          <div>
            <p className="hz-closing-quote">
              Welcome to the
              <em>future of energy.</em>
            </p>
            <p className="hz-closing-meta">
              This {systemKw} kW proposal for {customerName} is valid for 30
              days. By signing below, you confirm acceptance of scope, pricing,
              and terms outlined in this document.
            </p>
          </div>
          <div className="hz-sign-area">
            <div className="hz-sign-grid">
              <div>
                <span className="hz-sign-label">Customer Signature</span>
                <span className="hz-sign-line">{customerName}</span>
              </div>
              <div>
                <span className="hz-sign-label">Date of Acceptance</span>
                <span className="hz-sign-line">&nbsp;</span>
              </div>
            </div>
            <div style={{ marginTop: "2.5rem" }}>
              <span className="hz-sign-label">Prepared by</span>
              <span className="hz-sign-line">{brandName}</span>
            </div>
          </div>
        </div>
      </WowPage>
    </div>
  );
}
