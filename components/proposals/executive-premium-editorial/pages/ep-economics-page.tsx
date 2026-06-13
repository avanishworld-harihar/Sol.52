import { EpSplitPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-split-page";
import { fmtInr, fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["economics"];
};

export function EpEconomicsPage({ data }: Props) {
  return (
    <EpSplitPage
      sidebar={
        <>
          <h2>02. Costs & Returns</h2>
          <p className="ep-ed-huge-data">
            {data.payback_years}
            <span>yr</span>
          </p>
          <p className="ep-ed-data-label">Payback Period</p>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: "-20px", marginBottom: "40px", lineHeight: 1.4 }}>
            The time it takes for the solar system to pay for itself.
          </p>
          <p className="ep-ed-huge-data ep-ed-copper-text">
            {data.savings_25yr_lakhs}
            <span>L</span>
          </p>
          <p className="ep-ed-data-label ep-ed-copper-text">25-Year Savings</p>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: "-20px", lineHeight: 1.4 }}>
            Total money you will save over the lifetime of the solar plant.
          </p>
        </>
      }
    >
      <h1 className="ep-ed-h1">Your Investment.</h1>
      <p className="ep-ed-subtitle">How the government subsidy makes this highly profitable.</p>

      <div style={{ marginTop: "50px" }}>
        <div className="ep-ed-waterfall-row">
          <div className="ep-ed-waterfall-label">Total System Cost</div>
          <div className="ep-ed-waterfall-value" style={{ fontSize: "24pt" }}>
            {fmtInrSpaced(data.gross_cost_inr)}
          </div>
          <div className="ep-ed-waterfall-sub">Includes premium panels, inverter, and full installation.</div>
        </div>

        <div className="ep-ed-waterfall-line" />

        <div className="ep-ed-waterfall-row">
          <div className="ep-ed-waterfall-label ep-ed-green-text">PM Surya Ghar Subsidy</div>
          <div className="ep-ed-waterfall-value ep-ed-green-text" style={{ fontSize: "24pt" }}>
            - {fmtInrSpaced(data.subsidy_inr)}
          </div>
          <div className="ep-ed-waterfall-sub">Government discount given directly to you.</div>
        </div>

        <div className="ep-ed-waterfall-line" />

        <div className="ep-ed-waterfall-row" style={{ marginTop: "40px", marginBottom: "50px" }}>
          <div className="ep-ed-waterfall-label ep-ed-copper-text">Final Amount You Pay</div>
          <div className="ep-ed-waterfall-value ep-ed-copper-text" style={{ fontSize: "34pt" }}>
            {fmtInrSpaced(data.net_cost_inr)}
          </div>
          <div className="ep-ed-waterfall-sub">Your total out-of-pocket cost.</div>
        </div>
      </div>

      <table className="ep-ed-emi-table">
        <thead>
          <tr>
            <th>EMI Options (Solar Loan)</th>
            <th>Interest Paid</th>
            <th style={{ textAlign: "right" }}>Monthly Payment</th>
          </tr>
        </thead>
        <tbody>
          {data.emi_rows.map((row, i) => {
            const isLast = i === data.emi_rows.length - 1;
            const borderStyle = isLast ? { borderBottom: "none" } : undefined;
            return (
              <tr key={row.tenure_label}>
                <td style={borderStyle}>{row.tenure_label}</td>
                <td style={borderStyle}>₹ {fmtInr(row.interest_paid_inr)}</td>
                <td style={borderStyle}>₹ {fmtInr(row.monthly_emi_inr)} / mo</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </EpSplitPage>
  );
}
