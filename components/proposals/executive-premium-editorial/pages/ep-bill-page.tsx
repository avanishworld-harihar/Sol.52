"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import { fmtInr } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["bill"];
};

export function EpBillPage({ data }: Props) {
  const { copy } = useEpGoldenLang();

  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">{copy.bill.tag}</div>
      <h1 className="ep-gl-h1">{copy.bill.title}</h1>
      <p className="ep-gl-lead" style={{ marginBottom: "20px" }}>
        {copy.bill.lead}
      </p>

      <div className="ep-gl-audit-metrics-row">
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number gold">{data.summer_trap_pct}%</p>
          <p className="ep-gl-huge-label">{copy.bill.summerBill}</p>
          <p className="ep-gl-metric-caption">{copy.bill.summerCaption}</p>
        </div>
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number">₹{data.fixed_charges_display}</p>
          <p className="ep-gl-huge-label">{copy.bill.fixedLiability}</p>
          <p className="ep-gl-metric-caption">{copy.bill.fixedCaption}</p>
        </div>
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number green">{data.solar_savings_pct}%</p>
          <p className="ep-gl-huge-label">{copy.bill.solarSavings}</p>
          <p className="ep-gl-metric-caption">{copy.bill.solarCaption}</p>
        </div>
      </div>

      <div className="ep-gl-chart-container ep-gl-clearfix">
        {data.months.map((m) => (
          <div key={m.label} className="ep-gl-thin-bar-wrapper">
            <div
              className={`ep-gl-thin-bar${m.is_summer_peak ? " highlight" : ""}`}
              style={{ height: `${m.bar_height_pct}%` }}
            />
            <div className="ep-gl-chart-label">{m.label}</div>
          </div>
        ))}
      </div>

      <table className="ep-gl-invoice-table">
        <thead>
          <tr>
            <th>{copy.bill.month}</th>
            <th>{copy.bill.units}</th>
            <th>{copy.bill.energy}</th>
            <th>{copy.bill.fixed}</th>
            <th>{copy.bill.duty}</th>
            <th>{copy.bill.netBill}</th>
          </tr>
        </thead>
        <tbody>
          {data.months.map((m) => (
            <tr key={m.label}>
              <td>{m.label}</td>
              <td>{m.units}</td>
              <td>{fmtInr(m.energy_inr)}</td>
              <td>{fmtInr(m.fixed_inr)}</td>
              <td>{fmtInr(m.duty_inr)}</td>
              <td className={m.highlight_net ? "ep-gl-net-gold" : undefined}>{fmtInr(m.net_inr)}</td>
            </tr>
          ))}
          <tr className="ep-gl-total-row">
            <td>{copy.bill.total}</td>
            <td>{data.totals.units}</td>
            <td>{fmtInr(data.totals.energy_inr)}</td>
            <td>{fmtInr(data.totals.fixed_inr)}</td>
            <td>{fmtInr(data.totals.duty_inr)}</td>
            <td className="ep-gl-net-gold">{fmtInr(data.totals.net_inr)}</td>
          </tr>
        </tbody>
      </table>
      <p className="ep-gl-footnote">{copy.bill.footnote}</p>
    </EpLuxuryPage>
  );
}
