"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import {
  fmtInr,
  fmtInrSpaced,
  fmtLifetimeBenefitInr,
} from "@/lib/executive-premium-editorial/format";
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

  return (
    <div className="ef-proposal">
      <div className="ef-toolbar ef-no-print">
        <button type="button" className="ef-toolbar-btn" onClick={() => window.print()}>
          <Download className="h-4 w-4" aria-hidden />
          Print / PDF
        </button>
      </div>

      <div className="ef-doc">

        {/* ── P1: Cover ── */}
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

        {/* ── P2: Perspective — story ── */}
        <section className="ef-page">
          <div className="ef-story-grid">
            <div className="ef-story-left">
              <h2 className="ef-story-kicker">01. Perspective</h2>
              <p className="ef-story-headline">
                Your roof is not just shelter. It&apos;s a power plant.
              </p>
            </div>
            <div className="ef-story-right">
              <p className="ef-story-lead">
                The shift to solar isn&apos;t just a financial decision; it&apos;s a transition to
                energy sovereignty for your home{cityLabel ? ` in ${cityLabel}` : ""}.
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

        {/* ── P3: Electrical Audit (only if bill data exists) ── */}
        {hasBillData && (
          <section className="ef-page">
            <span className="ef-section-tag">01 / Electrical Audit</span>
            <h1 className="ef-h1">Your Energy Audit.</h1>
            <p className="ef-lead">
              A clear breakdown of what you paid for electricity based on your billing usage.
            </p>

            <div className="ef-audit-metrics">
              <div className="ef-audit-metric-box ef-audit-metric-box--teal">
                <span className="ef-audit-big ef-audit-big--teal">{m.bill.summer_trap_pct}%</span>
                <span className="ef-audit-metric-label">The Summer Bill</span>
                <span className="ef-audit-metric-caption">Paid in 4 months (Apr–Jul)</span>
              </div>
              <div className="ef-audit-metric-box">
                <span className="ef-audit-big">₹{m.bill.fixed_charges_display}</span>
                <span className="ef-audit-metric-label">Fixed Liability</span>
                <span className="ef-audit-metric-caption">Mandatory baseline cost</span>
              </div>
              <div className="ef-audit-metric-box ef-audit-metric-box--green">
                <span className="ef-audit-big ef-audit-big--green">{m.bill.solar_savings_pct}%</span>
                <span className="ef-audit-metric-label">Solar Savings</span>
                <span className="ef-audit-metric-caption">Estimated bill reduction</span>
              </div>
            </div>

            <table className="ef-bill-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Units</th>
                  <th>Energy (₹)</th>
                  <th>Fixed (₹)</th>
                  <th>Duty (₹)</th>
                  <th>Net Bill (₹)</th>
                </tr>
              </thead>
              <tbody>
                {m.bill.months.map((mo) => (
                  <tr key={mo.label}>
                    <td>{mo.label}</td>
                    <td>{mo.units.toLocaleString("en-IN")}</td>
                    <td>{fmtInr(mo.energy_inr)}</td>
                    <td>{fmtInr(mo.fixed_inr)}</td>
                    <td>{fmtInr(mo.duty_inr)}</td>
                    <td>{fmtInr(mo.net_inr)}</td>
                  </tr>
                ))}
                <tr>
                  <td>Total</td>
                  <td>{m.bill.totals.units.toLocaleString("en-IN")}</td>
                  <td>{fmtInr(m.bill.totals.energy_inr)}</td>
                  <td>{fmtInr(m.bill.totals.fixed_inr)}</td>
                  <td>{fmtInr(m.bill.totals.duty_inr)}</td>
                  <td>{fmtInr(m.bill.totals.net_inr)}</td>
                </tr>
              </tbody>
            </table>
            <p className="ef-bill-footnote">*(Subsidy) adjusted before Net Bill</p>
          </section>
        )}

        {/* ── P4: Investment Matrix ── */}
        <section className="ef-page">
          <h2 className="ef-invest-title">
            Investment <span>Matrix</span>
          </h2>

          {/* ROI journey steps */}
          <div className="ef-roi-steps">
            <div className="ef-roi-step">
              <span className="ef-roi-step-label">Invest</span>
              <span className="ef-roi-step-value">{fmtInrSpaced(m.economics.net_cost_inr)}</span>
            </div>
            <div className="ef-roi-step">
              <span className="ef-roi-step-label">Monthly Save</span>
              <span className="ef-roi-step-value">₹{fmtInr(m.economics.monthly_savings_inr)}</span>
              <span className="ef-roi-step-unit">/ month</span>
            </div>
            <div className="ef-roi-step">
              <span className="ef-roi-step-label">Recover</span>
              <span className="ef-roi-step-value">{m.economics.payback_years.toFixed(1)}</span>
              <span className="ef-roi-step-unit">Years</span>
            </div>
            <div className="ef-roi-step">
              <span className="ef-roi-step-label">25 Year Profit</span>
              <span className="ef-roi-step-value">
                {fmtLifetimeBenefitInr(m.economics.lifetime_profit_inr)}
              </span>
            </div>
          </div>

          <div className="ef-invest-2col">
            {/* Cost breakdown */}
            <div className="ef-cost-rows">
              <div className="ef-cost-row">
                <span className="ef-cost-row-label">Total System Cost</span>
                <span className="ef-cost-row-value">{fmtInrSpaced(m.economics.gross_cost_inr)}</span>
              </div>
              {m.economics.subsidy_inr > 0 && (
                <div className="ef-cost-row">
                  <span className="ef-cost-row-label">PM Surya Ghar Subsidy</span>
                  <span className="ef-cost-row-value" style={{ color: "#276749" }}>
                    − {fmtInrSpaced(m.economics.subsidy_inr)}
                  </span>
                </div>
              )}
              <div className="ef-cost-row ef-cost-row--final">
                <span className="ef-cost-row-label">Final Amount You Pay</span>
                <span className="ef-cost-row-value">{fmtInrSpaced(m.economics.net_cost_inr)}</span>
              </div>
            </div>

            {/* EMI options */}
            <div className="ef-emi-box">
              <p className="ef-emi-box-title">Financing Options</p>
              {m.economics.emi_rows.length > 0 ? (
                <table className="ef-emi-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th style={{ textAlign: "right" }}>Interest</th>
                      <th style={{ textAlign: "right" }}>EMI / mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.economics.emi_rows.map((row) => (
                      <tr key={row.tenure_label}>
                        <td>{row.tenure_label}</td>
                        <td style={{ textAlign: "right" }}>{fmtInrSpaced(row.interest_paid_inr)}</td>
                        <td>{fmtInrSpaced(row.monthly_emi_inr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#718096" }}>
                  Financing options available on request.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── P5: Green Legacy ── */}
        <section className="ef-page">
          <span className="ef-section-tag">03 / Ecological Impact</span>
          <h1 className="ef-h1">A Gift Beyond Electricity.</h1>
          <p className="ef-lead">
            Solar is not only a bill saver — it is cleaner air, greener land, and a safer planet
            for the next generation.
          </p>

          <div className="ef-eco-grid">
            <div className="ef-eco-block">
              <div className="ef-eco-number">{fmtInr(m.impact.co2_tons)}</div>
              <span className="ef-eco-unit">Tons CO₂ Avoided</span>
              <p className="ef-eco-desc">
                Every unit from your roof is power without chimney smoke — cleaner skies for the
                family you are building for.
              </p>
            </div>
            <div className="ef-eco-block">
              <div className="ef-eco-number">{fmtInr(m.impact.trees)}</div>
              <span className="ef-eco-unit">Tree Equivalent</span>
              <p className="ef-eco-desc">
                Nature would need a small woodland to do what your solar system achieves quietly,
                year after year.
              </p>
            </div>
          </div>
        </section>

        {/* ── P6: Engineering ── */}
        <section className="ef-page">
          <span className="ef-section-tag">05 / Engineering Design</span>
          <h1 className="ef-h1">Design &amp; Performance.</h1>
          <p className="ef-lead">
            Engineering parameters for your rooftop system — site latitude, tilt angle, and Indian
            standards compliance.
          </p>

          <div className="ef-eng-layout">
            <div>
              {m.engineering.metrics_rows.map((row) => (
                <div key={row.label} className={`ef-eng-row${row.highlight ? " ef-eng-row--hi" : ""}`}>
                  <span className="ef-eng-row-label">{row.label}</span>
                  <span className="ef-eng-row-value">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="ef-tilt-box">
              <p className="ef-tilt-kicker">
                Panel Tilt{m.engineering.city_label ? ` — ${m.engineering.city_label}` : ""}
              </p>
              <p className="ef-tilt-deg">
                {m.engineering.tilt_deg}°
              </p>
              <p className="ef-tilt-note">{m.engineering.tilt_note}</p>
              {m.engineering.cable_note ? (
                <p className="ef-tilt-note" style={{ marginTop: "0.5rem" }}>
                  {m.engineering.cable_note}
                </p>
              ) : null}
            </div>
          </div>

          {m.engineering.standards.length > 0 && (
            <>
              <p className="ef-eng-subhead">Standards Compliance</p>
              <div className="ef-standards-chips">
                {m.engineering.standards.map((s) => (
                  <span key={s} className="ef-standards-chip">{s}</span>
                ))}
              </div>
            </>
          )}

          {m.engineering.install_phases.length > 0 && (
            <>
              <p className="ef-eng-subhead">Installation Process</p>
              <div className="ef-phases-grid">
                {m.engineering.install_phases.map((p) => (
                  <div key={p.num} className="ef-phase-card">
                    <span className="ef-phase-num">{p.num}</span>
                    <p className="ef-phase-title">{p.title}</p>
                    <p className="ef-phase-detail">{p.detail}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── P7: System Parts (BOM) ── */}
        <section className="ef-page">
          <span className="ef-section-tag">06 / Hardware Intelligence</span>
          <h1 className="ef-h1">System Parts.</h1>
          <p className="ef-lead">
            Tier-1 components with full engineering specification — make, standards, and warranty
            as quoted for your system.
          </p>

          <div className="ef-bom-manifest">
            {m.architecture.bom_rows.map((row, i) => (
              <div
                key={row.name}
                className="ef-bom-row"
                style={i === m.architecture.bom_rows.length - 1 ? { borderBottom: "none" } : undefined}
              >
                <div className="ef-bom-left">
                  <p className="ef-bom-comp">{row.name}</p>
                  <p className="ef-bom-brand">{row.brand}</p>
                  {row.warranty ? <span className="ef-bom-warr">{row.warranty}</span> : null}
                </div>
                <div className="ef-bom-right">
                  <p className="ef-bom-spec">{row.spec}</p>
                  {row.technical_points.length > 0 && (
                    <ul className="ef-bom-tech">
                      {row.technical_points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  )}
                  {row.description ? <p className="ef-bom-desc">{row.description}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── P8: Warranty Matrix ── */}
        <section className="ef-page">
          <span className="ef-section-tag">07 / Warranty &amp; Assurance</span>
          <h1 className="ef-h1">Warranty Matrix.</h1>
          <p className="ef-lead">{m.warranty.intro}</p>

          {m.warranty.highlights.length > 0 && (
            <div className="ef-warranty-hero">
              {m.warranty.highlights.map((h) => (
                <div key={h.label} className="ef-warranty-card">
                  <div className="ef-warranty-card-value">
                    {h.value}
                    <span className="ef-warranty-card-unit">{h.unit}</span>
                  </div>
                  <span className="ef-warranty-card-label">{h.label}</span>
                </div>
              ))}
            </div>
          )}

          <table className="ef-warranty-table">
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
                  <td className={row.coverage.toLowerCase().includes("installation") || row.coverage.toLowerCase().includes("structur") ? "ef-green" : ""}>
                    {row.coverage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="ef-warranty-notes">
            <strong>Claims:</strong> Contact our service desk for manufacturer defects. Physical
            damage, vandalism, or misuse is excluded.
          </p>
          <p className="ef-warranty-notes">
            <strong>Your care:</strong> Routine panel cleaning, safe roof access, and internet for
            remote monitoring where applicable.
          </p>
        </section>

        {/* ── P9: Execution & Settlement ── */}
        <section className="ef-page">
          <span className="ef-section-tag">08 / Execution &amp; Settlement</span>
          <h1 className="ef-h1">Installation Process.</h1>
          <p className="ef-lead">
            We handle all the paperwork and hard work so you can simply enjoy free electricity.
          </p>

          <div className="ef-exec-layout">
            <div className="ef-steps-list">
              {m.execution.steps.map((step) => (
                <div key={step.num} className="ef-exec-step">
                  <span className="ef-exec-step-num">{step.num}</span>
                  <p className="ef-exec-step-title">{step.title}</p>
                  <p className="ef-exec-step-desc">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="ef-settlement-col">
              <div className="ef-payment-box">
                <p className="ef-payment-box-title">Payment Schedule</p>
                <table className="ef-payment-table">
                  <tbody>
                    {m.execution.payments.map((p) => (
                      <tr
                        key={p.label}
                        className={p.is_total ? "ef-payment-final" : undefined}
                      >
                        <td>
                          {p.label}{" "}
                          <span style={{ color: "#718096", fontWeight: 400 }}>
                            ({p.pct_label})
                          </span>
                        </td>
                        <td>{fmtInrSpaced(p.amount_inr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ef-bank-box">
                <p className="ef-bank-box-title">Secure Routing Details</p>
                <p className="ef-bank-row">
                  Beneficiary: <span>{m.execution.company}</span>
                </p>
                <p className="ef-bank-row">
                  Account No.: <span>{m.execution.account_number}</span>
                </p>
                <p className="ef-bank-row">
                  IFSC Code: <span>{m.execution.ifsc}</span>
                </p>
                {m.execution.upi_id && m.execution.upi_id !== "—" ? (
                  <p className="ef-bank-row">
                    UPI: <span>{m.execution.upi_id}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ── P10: Closing ── */}
        <section className="ef-page ef-closing-page">
          <p className="ef-closing-eyebrow">
            Congratulations, {m.closing.customer_name}
          </p>
          <h2 className="ef-closing-title">
            Your family is now ready to generate clean power.
          </h2>

          <div className="ef-closing-stats">
            <div>
              <span className="ef-closing-stat-label">Annual Generation</span>
              <span className="ef-closing-stat-value">
                {Math.round(m.closing.annual_units).toLocaleString("en-IN")} Units
              </span>
            </div>
            <div>
              <span className="ef-closing-stat-label">Lifetime Wealth Created</span>
              <span className="ef-closing-stat-value">
                {fmtLifetimeBenefitInr(m.closing.lifetime_wealth_inr)}
              </span>
            </div>
          </div>

          <div className="ef-closing-footer">
            <div>
              <p className="ef-closing-company">{m.closing.installer_name}</p>
              {m.closing.contact_line ? (
                <p className="ef-closing-contact">{m.closing.contact_line}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="ef-closing-print-btn ef-no-print"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4" aria-hidden />
              Download PDF
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
