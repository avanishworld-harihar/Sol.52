"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import {
  fmtInr,
  fmtInrSpaced,
  fmtLifetimeBenefitInr,
} from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["economics"];
};

export function EpEconomicsPage({ data }: Props) {
  const { copy } = useEpGoldenLang();
  const roiSteps = [
    { key: "invest" as const, label: copy.economics.invest },
    { key: "save" as const, label: copy.economics.monthlySave },
    { key: "recover" as const, label: copy.economics.recover },
    { key: "profit" as const, label: copy.economics.profit25 },
  ];

  const roiValues = {
    invest: fmtInrSpaced(data.net_cost_inr),
    save: fmtInr(data.monthly_savings_inr),
    recover: `${data.payback_years.toFixed(1)} ${copy.economics.years}`,
    profit: fmtLifetimeBenefitInr(data.lifetime_profit_inr),
  };

  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">{copy.economics.tag}</div>
      <h1 className="ep-gl-h1">{copy.economics.title}</h1>
      <p className="ep-gl-lead">{copy.economics.lead}</p>

      <div className="ep-gl-roi-journey" aria-label="Return on investment journey">
        <p className="ep-gl-roi-journey-kicker">{copy.economics.roiKicker}</p>
        <div className="ep-gl-roi-journey-steps">
          {roiSteps.map((step, index) => (
            <div key={step.key} className="ep-gl-roi-journey-step-wrap">
              <div
                className={`ep-gl-roi-journey-step ${step.key === "profit" ? "ep-gl-roi-journey-step--highlight" : ""} ${step.key === "save" ? "ep-gl-roi-journey-step--save" : ""}`}
              >
                <p className="ep-gl-roi-journey-label">{step.label}</p>
                {step.key === "save" ? (
                  <div className="ep-gl-roi-journey-value-stack">
                    <p className="ep-gl-roi-journey-value">₹{roiValues.save}</p>
                    <p className="ep-gl-roi-journey-value-unit">{copy.economics.perMonth}</p>
                  </div>
                ) : (
                  <p className="ep-gl-roi-journey-value">{roiValues[step.key]}</p>
                )}
              </div>
              {index < roiSteps.length - 1 ? (
                <div className="ep-gl-roi-journey-arrow" aria-hidden>
                  →
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <p className="ep-gl-roi-journey-foot">
          {copy.economics.roiFoot(data.payback_years.toFixed(1))}
        </p>
      </div>

      <div className="ep-gl-grid-2 ep-gl-economics-detail">
        <div className="ep-gl-col-half ep-gl-col-left">
          <p className="ep-gl-economics-detail-title">{copy.economics.costBreakdown}</p>
          <div className="ep-gl-waterfall-row">
            <div className="ep-gl-waterfall-label">{copy.economics.totalSystemCost}</div>
            <div className="ep-gl-waterfall-value">{fmtInrSpaced(data.gross_cost_inr)}</div>
            <div className="ep-gl-waterfall-sub">{copy.economics.totalSystemSub}</div>
          </div>
          <div className="ep-gl-waterfall-line" />
          <div className="ep-gl-waterfall-row">
            <div className="ep-gl-waterfall-label">{copy.economics.subsidy}</div>
            <div className="ep-gl-waterfall-value green">- {fmtInrSpaced(data.subsidy_inr)}</div>
            <div className="ep-gl-waterfall-sub">{copy.economics.subsidySub}</div>
          </div>
          <div className="ep-gl-waterfall-line" />
          <div className="ep-gl-waterfall-row" style={{ marginTop: "30px" }}>
            <div className="ep-gl-waterfall-label gold">{copy.economics.finalPay}</div>
            <div className="ep-gl-waterfall-value large">{fmtInrSpaced(data.net_cost_inr)}</div>
            <div className="ep-gl-waterfall-sub">{copy.economics.finalPaySub}</div>
          </div>
        </div>

        <div className="ep-gl-col-half ep-gl-col-right">
          <div className="ep-gl-emi-container">
            <h3 className="ep-gl-emi-title">{copy.economics.financing}</h3>
            <table className="ep-gl-emi-table">
              <thead>
                <tr>
                  <th>{copy.economics.plan}</th>
                  <th>{copy.economics.interest}</th>
                  <th>{copy.economics.emi}</th>
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
