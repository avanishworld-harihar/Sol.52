"use client";

import { fmtInrPlain } from "@/lib/sales-premium-institutional/format";
import type { InstitutionalBillPage } from "@/lib/sales-premium-institutional/types";
import { SpBillBarChart } from "@/components/proposals/sales-premium-institutional/primitives/sp-bill-bar-chart";

type Props = {
  data: InstitutionalBillPage;
  pageNum: number;
  pageTotal: number;
};

export function SpBillIntelligencePage({ data, pageNum, pageTotal }: Props) {
  const t = data.totals;

  return (
    <section className="sp-page">
      <div className="sp-section-tag">01 / Bill Intelligence</div>
      <h1 className="sp-h1">Electricity Bill Audit.</h1>
      <div className="sp-subtitle">{data.billing_caption}</div>

      <SpBillBarChart months={data.months} />

      <table className="sp-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Units</th>
            <th>Energy (₹)</th>
            <th>Fixed (₹)</th>
            <th>Duty+Fuel (₹)</th>
            <th>Net Bill (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.months.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{fmtInrPlain(row.units)}</td>
              <td>{fmtInrPlain(row.energy_inr)}</td>
              <td>{fmtInrPlain(row.fixed_inr)}</td>
              <td>{fmtInrPlain(row.duty_fuel_inr)}</td>
              <td className={row.is_summer_peak ? "sp-text-red" : undefined}>
                {fmtInrPlain(row.net_inr)}
              </td>
            </tr>
          ))}
          <tr className="sp-total-row">
            <td>{t.label}</td>
            <td>{fmtInrPlain(t.units)}</td>
            <td>{fmtInrPlain(t.energy_inr)}</td>
            <td>{fmtInrPlain(t.fixed_inr)}</td>
            <td>{fmtInrPlain(t.duty_fuel_inr)}</td>
            <td>{fmtInrPlain(t.net_inr)}</td>
          </tr>
        </tbody>
      </table>

      <div className="sp-insights-grid">
        <div className="sp-insight-box">
          <div className="sp-insight-label">Summer Trap</div>
          <div className="sp-insight-value sp-text-red">{data.summer_trap_pct}%</div>
          <div className="sp-insight-note">Annual bill share (Apr-Jul).</div>
        </div>
        <div className="sp-insight-box">
          <div className="sp-insight-label">Fixed Liability</div>
          <div className="sp-insight-value">{data.fixed_liability_display}</div>
          <div className="sp-insight-note">Mandatory baseline cost.</div>
        </div>
        <div className="sp-insight-box">
          <div className="sp-insight-label">Surcharges</div>
          <div className="sp-insight-value">{data.surcharges_display}</div>
          <div className="sp-insight-note">Duty &amp; FPPAS tax.</div>
        </div>
        <div className="sp-insight-box sp-insight-box--lead">
          <div className="sp-insight-label sp-text-green">Offset Potential</div>
          <div className="sp-insight-value sp-text-green">{data.offset_potential_pct}%</div>
          <div className="sp-insight-note">{data.offset_retention_display}</div>
        </div>
      </div>

      <p className="sp-page-num">
        {pageNum} / {pageTotal}
      </p>
    </section>
  );
}
