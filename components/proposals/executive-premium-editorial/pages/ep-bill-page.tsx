import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { fmtInr } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["bill"];
};

export function EpBillPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">01 / Electrical Audit</div>
      <h1 className="ep-gl-h1">Your Energy Audit.</h1>
      <p className="ep-gl-lead" style={{ marginBottom: "20px" }}>
        A clear breakdown of what you paid for electricity last year based on your MP Smart Billing usage.
      </p>

      <div className="ep-gl-audit-metrics-row">
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number gold">
            {data.summer_trap_pct}%
          </p>
          <p className="ep-gl-huge-label">The Summer Bill</p>
          <p style={{ fontSize: "8.5pt", color: "#4a5568", lineHeight: 1.3 }}>Paid in 4 months (Apr-Jul)</p>
        </div>
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number">₹{data.fixed_charges_display}</p>
          <p className="ep-gl-huge-label">Fixed Liability</p>
          <p style={{ fontSize: "8.5pt", color: "#4a5568", lineHeight: 1.3 }}>Mandatory baseline cost</p>
        </div>
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number green">{data.solar_savings_pct}%</p>
          <p className="ep-gl-huge-label">Solar Savings</p>
          <p style={{ fontSize: "8.5pt", color: "#4a5568", lineHeight: 1.3 }}>Estimated bill reduction</p>
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
              <td>{m.units}</td>
              <td>{fmtInr(m.energy_inr)}</td>
              <td>{fmtInr(m.fixed_inr)}</td>
              <td>{fmtInr(m.duty_inr)}</td>
              <td className={m.highlight_net ? "ep-gl-net-gold" : undefined}>{fmtInr(m.net_inr)}</td>
            </tr>
          ))}
          <tr className="ep-gl-total-row">
            <td>Total</td>
            <td>{data.totals.units}</td>
            <td>{fmtInr(data.totals.energy_inr)}</td>
            <td>{fmtInr(data.totals.fixed_inr)}</td>
            <td>{fmtInr(data.totals.duty_inr)}</td>
            <td className="ep-gl-net-gold">{fmtInr(data.totals.net_inr)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: "7.5pt", color: "#a0aec0", textAlign: "right", marginTop: "5px", fontStyle: "italic" }}>
        *(Subsidy) adjusted before Net Bill
      </p>
    </EpLuxuryPage>
  );
}
