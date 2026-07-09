import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import {
  fmtInr,
  fmtInrSpaced,
  fmtLifetimeBenefitInr,
} from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["economics"];
};

const ROI_STEPS = [
  { key: "invest", label: "Invest" },
  { key: "save", label: "Monthly Save" },
  { key: "recover", label: "Recover" },
  { key: "profit", label: "25 Year Profit" },
] as const;

export function EpEconomicsPage({ data }: Props) {
  const roiValues: Record<(typeof ROI_STEPS)[number]["key"], string> = {
    invest: fmtInrSpaced(data.net_cost_inr),
    save: fmtInr(data.monthly_savings_inr),
    recover: `${data.payback_years.toFixed(1)} Years`,
    profit: fmtLifetimeBenefitInr(data.lifetime_profit_inr),
  };

  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">02 / Capital Allocation</div>
      <h1 className="ep-gl-h1">Your Investment.</h1>
      <p className="ep-gl-lead">
        See how your rooftop pays you back — then keeps earning for 25 years.
      </p>

      <div className="ep-gl-roi-journey" aria-label="Return on investment journey">
        <p className="ep-gl-roi-journey-kicker">Your return journey</p>
        <div className="ep-gl-roi-journey-steps">
          {ROI_STEPS.map((step, index) => (
            <div key={step.key} className="ep-gl-roi-journey-step-wrap">
              <div
                className={`ep-gl-roi-journey-step ${step.key === "profit" ? "ep-gl-roi-journey-step--highlight" : ""} ${step.key === "save" ? "ep-gl-roi-journey-step--save" : ""}`}
              >
                <p className="ep-gl-roi-journey-label">{step.label}</p>
                {step.key === "save" ? (
                  <div className="ep-gl-roi-journey-value-stack">
                    <p className="ep-gl-roi-journey-value">₹{roiValues.save}</p>
                    <p className="ep-gl-roi-journey-value-unit">/ month</p>
                  </div>
                ) : (
                  <p className="ep-gl-roi-journey-value">{roiValues[step.key]}</p>
                )}
              </div>
              {index < ROI_STEPS.length - 1 ? (
                <div className="ep-gl-roi-journey-arrow" aria-hidden>
                  →
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <p className="ep-gl-roi-journey-foot">
          Invest once · save every month · recover in {data.payback_years.toFixed(1)} years · profit for decades.
        </p>
      </div>

      <div className="ep-gl-grid-2 ep-gl-economics-detail">
        <div className="ep-gl-col-half ep-gl-col-left">
          <p className="ep-gl-economics-detail-title">Cost breakdown</p>
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
