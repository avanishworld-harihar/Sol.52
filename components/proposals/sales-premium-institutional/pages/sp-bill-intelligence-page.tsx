"use client";

import { fmtInrPlain } from "@/lib/sales-premium-institutional/format";
import type { InstitutionalBillPage } from "@/lib/sales-premium-institutional/types";

type Props = {
  data: InstitutionalBillPage;
};

export function SpBillIntelligencePage({ data }: Props) {
  return (
    <section className="sp-page">
      <p className="sp-eyebrow">The Baseline</p>
      <h1>The financial impact.</h1>
      <p className="sp-lead">A clear look at your current expenditure vs. your solar future.</p>

      <div className="sp-grid-3">
        <div className="sp-col-third">
          <p className="sp-audit-hero">₹{fmtInrPlain(data.current_annual_inr)}</p>
          <p className="sp-audit-lbl">Current Annual Cost</p>
        </div>
        <div className="sp-col-third">
          <p className="sp-audit-hero" style={{ color: "#0071e3" }}>
            ~₹{fmtInrPlain(data.cost_after_solar_inr)}
          </p>
          <p className="sp-audit-lbl">Cost After Solar</p>
        </div>
        <div className="sp-col-third sp-col-third-bordered">
          <p className="sp-audit-hero green">₹{fmtInrPlain(data.annual_savings_inr)}</p>
          <p className="sp-audit-lbl">Annual Savings</p>
        </div>
      </div>

      <div className="sp-chart-wrap">
        {data.months.map((m) => (
          <div key={m.label} className="sp-bar-wrap">
            <div
              className={`sp-bar-inner ${m.is_summer_peak ? "alert" : ""}`}
              style={{ height: `${m.bar_height_pct}%` }}
            />
            <div className="sp-bar-label">{m.label}</div>
          </div>
        ))}
      </div>

      <table className="sp-mac-table">
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
          {data.months.map((m) => (
            <tr key={m.label}>
              <td>{m.label}</td>
              <td>{fmtInrPlain(m.units)}</td>
              <td>{fmtInrPlain(m.energy_inr)}</td>
              <td>{fmtInrPlain(m.fixed_inr)}</td>
              <td>{fmtInrPlain(m.duty_inr)}</td>
              <td>{fmtInrPlain(m.net_inr)}</td>
            </tr>
          ))}
          <tr className="sp-total-row">
            <td>Total</td>
            <td>{fmtInrPlain(data.totals.units)}</td>
            <td>{fmtInrPlain(data.totals.energy_inr)}</td>
            <td>{fmtInrPlain(data.totals.fixed_inr)}</td>
            <td>{fmtInrPlain(data.totals.duty_inr)}</td>
            <td>{fmtInrPlain(data.totals.net_inr)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
