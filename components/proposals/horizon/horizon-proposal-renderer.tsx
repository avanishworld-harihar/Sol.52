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

type MonolithVariant = "white" | "obsidian" | "cobalt";

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

function MonolithPage({
  children,
  variant = "white",
}: {
  children: ReactNode;
  variant?: MonolithVariant;
}) {
  const cls =
    variant === "obsidian"
      ? "hz-page hz-page--obsidian"
      : variant === "cobalt"
        ? "hz-page hz-page--cobalt"
        : "hz-page";
  return (
    <div className={cls}>
      <div className="hz-page-inner">{children}</div>
    </div>
  );
}

function blueprintLayers(
  bom: { name: string; brand: string; spec: string }[],
  systemKw: number
) {
  const panel = bom.find(
    (r) =>
      r.name.toLowerCase().includes("panel") ||
      r.name.toLowerCase().includes("module")
  );
  const inverter = bom.find((r) => r.name.toLowerCase().includes("inverter"));
  const structure = bom.find(
    (r) =>
      r.name.toLowerCase().includes("mount") ||
      r.name.toLowerCase().includes("structure")
  );

  const layers = [
    panel
      ? { name: "Solar Array", spec: panel.brand || panel.spec || "Tier-1 DCR" }
      : { name: "Solar Array", spec: "DCR Tier-1 Modules" },
    inverter
      ? {
          name: "Power Core",
          spec: inverter.brand || `${systemKw} kW String Inverter`,
        }
      : { name: "Power Core", spec: `${systemKw} kW MPPT Inverter` },
    structure
      ? { name: "Mounting Grid", spec: structure.brand || "Galvanized Structure" }
      : { name: "Mounting Grid", spec: "Hot-Dip Galvanized" },
    { name: "Protection Layer", spec: "AC/DC Safety & Net Metering" },
    { name: "Grid Interface", spec: `${systemKw} kW On-Grid Architecture` },
  ];
  return layers;
}

function dnaRows(
  bom: { name: string; brand: string; warranty: string; spec: string }[],
  systemKw: number
) {
  if (bom.length === 0) {
    return [
      { label: "Panel Make", value: "Waaree TOPCon" },
      { label: "Panel Warranty", value: "30 Year Performance" },
      { label: "Inverter", value: "Havells String · 10 Yr" },
      { label: "Structure", value: "JSW Galvanized" },
      { label: "System Size", value: `${systemKw} kW` },
    ];
  }
  return bom.slice(0, 6).map((row) => ({
    label: row.name,
    value: [row.brand, row.warranty || row.spec].filter(Boolean).join(" · "),
  }));
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
  const latitude = metricValue(engMetrics, "latitude");
  const tiltLabel = m.engineering.tilt_deg ? `${m.engineering.tilt_deg}°` : "—";
  const engCity = m.engineering.city_label || cityLabel;

  const layers = blueprintLayers(m.architecture.bom_rows, systemKw);
  const hardwareDna = dnaRows(m.architecture.bom_rows, systemKw);

  const defaultSteps = [
    "Site Survey",
    "Design & SLD",
    "Net-Meter Application",
    "Installation",
    "Testing",
    "Go Live",
  ];

  const processSteps =
    m.execution.steps.length > 0
      ? m.execution.steps.map((s) => s.title)
      : defaultSteps;

  const termsLeft = m.terms.terms_conditions;
  const termsRight = [
    ...m.terms.documents_required,
    ...(m.terms.amc_objective ? [m.terms.amc_objective] : []),
    ...m.terms.amc_scope,
    ...m.terms.amc_terms,
  ];

  const midTerms = Math.ceil(termsLeft.length / 2);
  const col1Terms = termsLeft.slice(0, midTerms);
  const col2Terms = [...termsLeft.slice(midTerms), ...termsRight];

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

      {/* 01 — Title Page */}
      <MonolithPage variant="obsidian">
        <div className="hz-cover">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="hz-cover-logo" />
          ) : (
            <span className="hz-kicker hz-kicker--cobalt">
              {brandName}
              {" // Masterplan"}
            </span>
          )}
          <h1 className="hz-hero hz-hero--xl hz-serif">
            ENERGY
            <br />
            ARCHITECT
          </h1>
          <p className="hz-body-light">
            Precision proposal for {customerName}, {cityLabel}.
          </p>
        </div>
      </MonolithPage>

      {/* 02 — The Manifesto */}
      <MonolithPage>
        <p className="hz-kicker">02 · The Manifesto</p>
        <div className="hz-manifesto">
          <h2 className="hz-hero hz-hero--lg hz-serif hz-hero--italic">
            Why Solar.
            <br />
            Why You.
          </h2>
          <p className="hz-manifesto-lead">
            Energy is not a bill — it is an asset. We architect independence for
            your roof in {cityLabel}, converting sunlight into a 25-year wealth
            machine at {systemKw} kW scale.
          </p>
        </div>
      </MonolithPage>

      {/* 03 — Wealth Map */}
      <MonolithPage>
        <div className="hz-wealth-grid">
          <p className="hz-kicker">03 · Financial Intelligence</p>
          <div className="hz-wealth-mid">
            <h2 className="hz-hero hz-hero--lg hz-serif hz-hero--italic">
              The
              <br />
              Wealth Map
            </h2>
            <div style={{ textAlign: "right" }}>
              <p className="hz-wealth-profit">
                {fmtLifetimeBenefitInr(m.economics.lifetime_profit_inr)}
              </p>
              <p className="hz-wealth-profit-label">25-Yr Profit</p>
            </div>
          </div>
          <div className="hz-wealth-foot">
            <div>
              <p className="hz-wealth-stat-label">Payback</p>
              <p className="hz-wealth-stat-value">{paybackLabel}</p>
            </div>
            <div>
              <p className="hz-wealth-stat-label">Monthly Savings</p>
              <p className="hz-wealth-stat-value">
                {fmtInr(m.economics.monthly_savings_inr)}
              </p>
            </div>
            <div>
              <p className="hz-wealth-stat-label">Net Investment</p>
              <p className="hz-wealth-stat-value">
                {fmtInr(m.economics.net_cost_inr)}
              </p>
            </div>
          </div>
        </div>
      </MonolithPage>

      {/* 04 — System Blueprint */}
      <MonolithPage>
        <p className="hz-kicker">04 · System Blueprint</p>
        <h2 className="hz-hero hz-hero--lg hz-serif">
          {systemKw} kW
          <br />
          Architecture
        </h2>
        <div className="hz-blueprint">
          {layers.map((layer, i) => (
            <div key={i} className="hz-blueprint-layer">
              <span className="hz-blueprint-num">{String(i + 1).padStart(2, "0")}</span>
              <p className="hz-blueprint-name">{layer.name}</p>
              <p className="hz-blueprint-spec">{layer.spec}</p>
            </div>
          ))}
        </div>
      </MonolithPage>

      {/* 05 — Latitude & Tilt */}
      <MonolithPage>
        <p className="hz-kicker">05 · Engineering Art</p>
        <div className="hz-eng-art">
          <h2 className="hz-hero hz-hero--lg hz-serif hz-hero--italic">
            {engCity}
          </h2>
          <div className="hz-eng-duo">
            <div>
              <p className="hz-eng-stat-label">Latitude</p>
              <p className="hz-eng-stat-value">{latitude}</p>
            </div>
            <div>
              <p className="hz-eng-stat-label">Optimal Tilt</p>
              <p className="hz-eng-stat-value">{tiltLabel}</p>
            </div>
          </div>
          {m.engineering.tilt_note ? (
            <p className="hz-eng-city">{m.engineering.tilt_note}</p>
          ) : (
            <p className="hz-eng-city">
              Precision-tuned for {engCity} solar geometry — maximum yield per
              square metre of rooftop.
            </p>
          )}
        </div>
      </MonolithPage>

      {/* 06 — Hardware DNA */}
      <MonolithPage>
        <p className="hz-kicker">06 · Hardware DNA</p>
        <h2 className="hz-hero hz-hero--lg hz-serif">Component Specs</h2>
        <div className="hz-dna-list">
          {hardwareDna.map((row, i) => (
            <div key={i} className="hz-dna-row">
              <span className="hz-dna-label">{row.label}</span>
              <span className="hz-dna-value">{row.value}</span>
            </div>
          ))}
        </div>
      </MonolithPage>

      {/* 07 — Fiscal Impact */}
      <MonolithPage variant="cobalt">
        <div className="hz-fiscal">
          <p className="hz-kicker">07 · Fiscal Impact</p>
          <h2 className="hz-hero hz-hero--lg hz-serif">
            Grant of
            <br />
            Independence
          </h2>
          <p className="hz-fiscal-amount">
            {m.economics.subsidy_inr > 0
              ? fmtInr(m.economics.subsidy_inr)
              : "₹0"}
          </p>
          <p className="hz-fiscal-caption">
            PM Surya Ghar — government subsidy applied to your net investment.
          </p>
        </div>
      </MonolithPage>

      {/* 08 — Carbon Legacy */}
      <MonolithPage>
        <div className="hz-carbon">
          <p className="hz-kicker">08 · Carbon Legacy</p>
          <p className="hz-carbon-num">
            {m.impact.trees?.toLocaleString("en-IN") ?? "—"}
          </p>
          <p className="hz-carbon-caption">
            Trees equivalent planted on your roof.
          </p>
        </div>
      </MonolithPage>

      {/* 09 — The Process */}
      <MonolithPage>
        <p className="hz-kicker">09 · The Process</p>
        <h2 className="hz-hero hz-hero--lg hz-serif hz-hero--italic">
          Steps to
          <br />
          Freedom
        </h2>
        <div className="hz-process">
          {processSteps.map((title, i) => (
            <div key={i} className="hz-process-step">
              <span className="hz-process-num">{String(i + 1).padStart(2, "0")}</span>
              <p className="hz-process-title">{title}</p>
            </div>
          ))}
        </div>
      </MonolithPage>

      {/* 10 — Terms as Art */}
      <MonolithPage>
        <p className="hz-kicker">10 · Terms as Art</p>
        <h2 className="hz-hero hz-hero--lg hz-serif">Legal Minimalism</h2>
        <div className="hz-terms-wrap">
          <div className="hz-terms-cols">
            <div className="hz-terms-block">
              <h3 className="hz-terms-col-title">General Terms</h3>
              {col1Terms.map((item, i) => (
                <p key={i} className="hz-terms-item">
                  {item}
                </p>
              ))}
            </div>
            <div className="hz-terms-block">
              <h3 className="hz-terms-col-title">Documents &amp; Scope</h3>
              {col2Terms.map((item, i) => (
                <p key={i} className="hz-terms-item">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </MonolithPage>

      {/* 11 — Signature */}
      <MonolithPage variant="obsidian">
        <div className="hz-finale">
          <div>
            <p className="hz-kicker hz-kicker--cobalt">11 · Finale</p>
            <h2 className="hz-finale-title hz-serif">
              Contract of Independence
            </h2>
            <p className="hz-finale-sub" style={{ color: "rgba(255,255,255,0.55)" }}>
              {systemKw} kW for {customerName} · Valid 30 days · {brandName}
            </p>
          </div>
          <div className="hz-sign-block">
            <div className="hz-sign-row">
              <div>
                <span className="hz-sign-label" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Signature
                </span>
                <span className="hz-sign-line" style={{ borderColor: "#fff", color: "#fff" }}>
                  {customerName}
                </span>
              </div>
              <div>
                <span className="hz-sign-label" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Date
                </span>
                <span className="hz-sign-line" style={{ borderColor: "#fff" }}>
                  &nbsp;
                </span>
              </div>
            </div>
            <span className="hz-sign-label" style={{ color: "rgba(255,255,255,0.45)" }}>
              Prepared by
            </span>
            <span className="hz-sign-line" style={{ borderColor: "#fff", color: "#fff" }}>
              {brandName}
            </span>
          </div>
        </div>
      </MonolithPage>
    </div>
  );
}
