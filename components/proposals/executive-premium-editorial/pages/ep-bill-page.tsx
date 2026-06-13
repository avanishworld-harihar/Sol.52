import { EpSplitPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-split-page";
import { fmtInr } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["bill"];
};

export function EpBillPage({ data }: Props) {
  return (
    <EpSplitPage
      sidebar={
        <>
          <h2>01. Your Bill Audit</h2>
          <p className="ep-ed-huge-data">
            {data.summer_trap_pct}
            <span>%</span>
          </p>
          <p className="ep-ed-data-label">The Summer Bill</p>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: "-20px", marginBottom: "40px", lineHeight: 1.4 }}>
            You pay more than 35% of your yearly bill in just 4 months (Apr-Jul).
          </p>
          <p className="ep-ed-huge-data">
            ₹{data.fixed_charges_display}
            <span>k</span>
          </p>
          <p className="ep-ed-data-label">Fixed Charges</p>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: "-20px", marginBottom: "40px", lineHeight: 1.4 }}>
            The amount you must pay to the electricity board even if you use no power.
          </p>
          <p className="ep-ed-huge-data ep-ed-copper-text">
            {data.solar_savings_pct}
            <span>%</span>
          </p>
          <p className="ep-ed-data-label ep-ed-copper-text">Solar Savings</p>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: "-20px", lineHeight: 1.4 }}>
            How much of your current bill will be completely wiped out by solar.
          </p>
        </>
      }
    >
      <h1 className="ep-ed-h1">Electricity Bill Analysis.</h1>
      <p className="ep-ed-subtitle">A clear breakdown of what you paid for electricity last year.</p>

      <div className="ep-ed-chart-container ep-ed-clearfix">
        {data.months.map((m) => (
          <div key={m.label} className="ep-ed-thin-bar-wrapper">
            <div
              className={`ep-ed-thin-bar${m.is_summer_peak ? " alert" : ""}`}
              style={{ height: `${m.bar_height_pct}%` }}
            />
            <div className="ep-ed-chart-label">{m.label}</div>
          </div>
        ))}
      </div>

      <table className="ep-ed-invoice-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Units</th>
            <th>Energy</th>
            <th>Fixed</th>
            <th>Tax</th>
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
              <td>{fmtInr(m.tax_inr)}</td>
              <td className={m.is_summer_peak ? "ep-ed-red-text" : undefined} style={m.is_summer_peak ? { fontWeight: "bold" } : undefined}>
                {fmtInr(m.net_inr)}
              </td>
            </tr>
          ))}
          <tr className="ep-ed-total-row">
            <td>Total</td>
            <td>{data.totals.units}</td>
            <td>{fmtInr(data.totals.energy_inr)}</td>
            <td>{fmtInr(data.totals.fixed_inr)}</td>
            <td>{fmtInr(data.totals.tax_inr)}</td>
            <td className="ep-ed-copper-text">{fmtInr(data.totals.net_inr)}</td>
          </tr>
        </tbody>
      </table>
    </EpSplitPage>
  );
}
