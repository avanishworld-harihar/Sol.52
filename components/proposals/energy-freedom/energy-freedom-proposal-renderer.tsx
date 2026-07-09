"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Sun } from "lucide-react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import { fmtInr, fmtInrSpaced, fmtLifetimeBenefitInr } from "@/lib/executive-premium-editorial/format";
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

function cityFromLocation(line: string): string {
  const t = line.trim();
  if (!t) return "your home";
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[0] || t;
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
  const cityLabel = cityFromLocation(m.location_line || summary.location || "");

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
    <div className="ef-proposal min-h-screen">
      <header className="ef-toolbar ef-no-print">
        <div className="ef-toolbar-inner">
          <span className="ef-toolbar-brand">Energy Freedom · {brandName}</span>
          <button type="button" className="ef-toolbar-btn" onClick={() => window.print()}>
            <Download className="h-4 w-4" aria-hidden />
            Print / PDF
          </button>
        </div>
      </header>

      <section className="ef-cover">
        <div className="ef-cover-glow ef-cover-glow--top" aria-hidden />
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={brandName}
            className="relative z-[1] mb-8 h-16 w-auto max-w-[180px] object-contain"
          />
        ) : (
          <div className="relative z-[1] mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#FFD700]/40 bg-white/5">
            <Sun className="h-8 w-8 text-[#FFD700]" aria-hidden />
          </div>
        )}
        <h1 className="ef-cover-title">ENERGY FREEDOM</h1>
        <p className="ef-cover-sub">
          Curated for <span className="text-white font-medium">{m.customer_name}</span>
          {cityLabel ? ` in ${cityLabel}.` : "."}
        </p>
        <div className="ef-cover-footer">
          <p>Prepared by {brandName}</p>
        </div>
      </section>

      <section className="ef-section">
        <div className="ef-section-inner">
          <p className="ef-kicker">01 / Capital Allocation</p>
          <h2 className="ef-section-heading">The Wealth Map</h2>
          <div className="ef-wealth-grid">
            <div className="ef-wealth-card">
              <p>Total Investment</p>
              <h3>{fmtInrSpaced(m.economics.net_cost_inr)}</h3>
            </div>
            <div className="ef-wealth-card">
              <p>Monthly Savings</p>
              <h3>{fmtInrSpaced(m.economics.monthly_savings_inr)}</h3>
            </div>
            <div className="ef-wealth-card">
              <p>25-Year Profit</p>
              <h3>{fmtLifetimeBenefitInr(m.economics.lifetime_profit_inr)}</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="ef-section">
        <div className="ef-section-inner">
          <div className="ef-stat-row">
            <div className="ef-stat-pill">
              <span>System Size</span>
              <strong>{summary.systemKw} kW</strong>
            </div>
            <div className="ef-stat-pill">
              <span>Annual Generation</span>
              <strong>{Math.round(m.closing.annual_units).toLocaleString("en-IN")} Units</strong>
            </div>
            <div className="ef-stat-pill">
              <span>Payback</span>
              <strong>{m.economics.payback_years} Yrs</strong>
            </div>
            <div className="ef-stat-pill">
              <span>Annual Savings</span>
              <strong>₹{fmtInr(m.closing.annual_savings_inr)}</strong>
            </div>
          </div>

          <div className="ef-invest-grid">
            <div className="ef-panel">
              <p className="ef-kicker">Cost Breakdown</p>
              <div className="ef-invest-line">
                <span>Total System Cost</span>
                <strong>{fmtInrSpaced(m.economics.gross_cost_inr)}</strong>
              </div>
              {m.economics.subsidy_inr > 0 ? (
                <div className="ef-invest-line">
                  <span>PM Surya Ghar Subsidy</span>
                  <strong>- {fmtInrSpaced(m.economics.subsidy_inr)}</strong>
                </div>
              ) : null}
              <div className="ef-invest-line">
                <span>Final Amount You Pay</span>
              </div>
              <p className="ef-invest-hero">{fmtInrSpaced(m.economics.net_cost_inr)}</p>
            </div>

            <div className="ef-panel">
              <p className="ef-kicker">Financing Options</p>
              {m.economics.emi_rows.length > 0 ? (
                <table className="ef-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Interest</th>
                      <th>EMI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.economics.emi_rows.map((row) => (
                      <tr key={row.tenure_label}>
                        <td>{row.tenure_label}</td>
                        <td>{fmtInrSpaced(row.interest_paid_inr)}</td>
                        <td>{fmtInrSpaced(row.monthly_emi_inr)}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-[#94a3b8]">Financing options available on request.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="ef-section">
        <div className="ef-section-inner">
          <p className="ef-kicker">02 / Ecological Impact</p>
          <h2 className="ef-section-heading">Your Green Legacy</h2>
          <div className="ef-eco-grid">
            <div>
              <div className="ef-eco-stat">{fmtInr(m.impact.co2_tons)}</div>
              <p className="mt-2 text-sm uppercase tracking-widest text-[#94a3b8]">Tons CO₂ Eliminated</p>
              <p className="mt-3 max-w-md text-[#94a3b8]">
                Clean power from your roof — no chimney smoke for the energy your family uses.
              </p>
            </div>
            <div>
              <div className="ef-eco-stat">{fmtInr(m.impact.trees)}</div>
              <p className="mt-2 text-sm uppercase tracking-widest text-[#94a3b8]">Trees Equivalent</p>
              <p className="mt-3 max-w-md text-[#94a3b8]">
                Nature would need a small woodland to match what your system achieves year after year.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ef-section">
        <div className="ef-section-inner">
          <p className="ef-kicker">03 / Engineering Design</p>
          <h2 className="ef-section-heading">Design &amp; Performance</h2>
          <div className="ef-tilt-box">
            <p className="ef-kicker">Panel Tilt{m.engineering.city_label ? ` — ${m.engineering.city_label}` : ""}</p>
            <p className="ef-tilt-deg">
              {m.engineering.tilt_deg}
              <span className="text-2xl">°</span>
            </p>
            <p className="mt-3 text-sm text-[#94a3b8]">{m.engineering.tilt_note}</p>
          </div>
          <div className="ef-panel">
            <div className="ef-metric-grid">
              {m.engineering.metrics_rows.map((row) => (
                <div key={row.label} className="ef-metric-cell">
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ef-section">
        <div className="ef-section-inner">
          <p className="ef-kicker">04 / Hardware Intelligence</p>
          <h2 className="ef-section-heading">System Parts</h2>
          <div className="ef-bom-grid">
            {m.architecture.bom_rows.map((row) => (
              <div key={`${row.name}-${row.brand}`} className="ef-bom-card">
                <h4>{row.brand || row.name}</h4>
                <p className="mt-1 text-sm text-[#94a3b8]">{row.spec}</p>
                {row.technical_points.length > 0 ? (
                  <p className="mt-2 text-xs text-[#64748b]">{row.technical_points.slice(0, 2).join(" · ")}</p>
                ) : null}
                {row.warranty ? <span className="ef-bom-badge">{row.warranty}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ef-section">
        <div className="ef-section-inner">
          <p className="ef-kicker">05 / Warranty &amp; Assurance</p>
          <h2 className="ef-section-heading">Warranty Matrix</h2>
          <div className="ef-panel overflow-x-auto">
            <table className="ef-table">
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
          </div>
        </div>
      </section>

      <section className="ef-section">
        <div className="ef-section-inner">
          <p className="ef-kicker">06 / Execution &amp; Settlement</p>
          <h2 className="ef-section-heading">Installation Process</h2>
          <div className="ef-steps-grid">
            {m.execution.steps.map((step) => (
              <div key={step.num} className="ef-step-card">
                <div className="ef-step-num">{step.num}</div>
                <p className="ef-step-title">{step.title}</p>
                <p className="ef-step-desc">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="ef-panel mt-6">
            <p className="ef-kicker">Payment Schedule</p>
            {m.execution.payments.map((p) => (
              <div key={p.label} className="ef-invest-line">
                <span>
                  {p.label} ({p.pct_label})
                </span>
                <strong>{fmtInrSpaced(p.amount_inr)}</strong>
              </div>
            ))}
            <div className="mt-4 border-t border-white/10 pt-4 text-sm text-[#94a3b8]">
              <div>
                <span className="text-[#64748b]">Beneficiary:</span> {m.execution.company}
              </div>
              <div>
                <span className="text-[#64748b]">A/c No:</span> {m.execution.account_number}
              </div>
              <div>
                <span className="text-[#64748b]">IFSC:</span> {m.execution.ifsc}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ef-closing">
        <p className="ef-kicker">Congratulations, {m.customer_name}</p>
        <h2>Your family is ready for energy independence.</h2>
        <div className="ef-closing-stats">
          <div className="ef-closing-stat">
            <span>Lifetime Wealth</span>
            <strong>{fmtLifetimeBenefitInr(m.closing.lifetime_wealth_inr)}</strong>
          </div>
          <div className="ef-closing-stat">
            <span>Annual Generation</span>
            <strong>{Math.round(m.closing.annual_units).toLocaleString("en-IN")} Units</strong>
          </div>
        </div>
        <button type="button" className="ef-toolbar-btn ef-no-print" onClick={() => window.print()}>
          <Download className="h-4 w-4" aria-hidden />
          Download Proposal as PDF
        </button>
      </section>

      <footer className="ef-footer">
        Prepared exclusively for {m.customer_name}
        {m.location_line ? ` · ${m.location_line}` : ""} · {brandName} © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
