import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { fmtInr, fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["economics"];
};

export function EpEconomicsPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">02 / Capital Allocation</div>
      <h1 className="ep-gl-h1">Your Investment.</h1>
      <p className="ep-gl-lead">How the government subsidy makes this a highly profitable asset for your home.</p>

      <div className="ep-gl-grid-2">
        <div className="ep-gl-col-half ep-gl-col-left">
          <div className="ep-gl-waterfall-row">
            <div className="ep-gl-waterfall-label">Total System Cost</div>
            <div className="ep-gl-waterfall-value">{fmtInrSpaced(data.gross_cost_inr)}</div>
            <div className="ep-gl-waterfall-sub">Includes premium panels, inverter, and full installation.</div>
          </div>
          <div className="ep-gl-waterfall-line" />
          <div className="ep-gl-waterfall-row">
            <div className="ep-gl-waterfall-label">PM Surya Ghar Subsidy</div>
            <div className="ep-gl-waterfall-value green">- {fmtInrSpaced(data.subsidy_inr)}</div>
            <div className="ep-gl-waterfall-sub">Government discount applied directly to your project.</div>
          </div>
          <div className="ep-gl-waterfall-line" />
          <div className="ep-gl-waterfall-row" style={{ marginTop: "30px" }}>
            <div className="ep-gl-waterfall-label gold">Final Amount You Pay</div>
            <div className="ep-gl-waterfall-value large">{fmtInrSpaced(data.net_cost_inr)}</div>
            <div className="ep-gl-waterfall-sub">Your total out-of-pocket cost.</div>
          </div>
        </div>

        <div className="ep-gl-col-half ep-gl-col-right">
          <div style={{ marginBottom: "30px" }}>
            <p className="ep-gl-huge-number gold">
              {data.payback_years}{" "}
              <span style={{ fontSize: "14pt", fontFamily: "-apple-system, sans-serif" }}>Yrs</span>
            </p>
            <p className="ep-gl-huge-label">Payback Period</p>
            <p className="ep-gl-caption" style={{ fontSize: "10pt" }}>
              The time it takes for the solar system to pay for itself completely through bill savings.
            </p>
          </div>

          <div className="ep-gl-emi-container">
            <h3 className="ep-gl-emi-title">Financing Options</h3>
            <table className="ep-gl-emi-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Interest</th>
                  <th>EMI</th>
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
                      <td style={borderStyle}>₹ {fmtInr(row.monthly_emi_inr)}/mo</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
