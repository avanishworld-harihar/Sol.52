"use client";

import { fmtInrSpaced } from "@/lib/sales-premium-institutional/format";
import type { InstitutionalCapitalPage } from "@/lib/sales-premium-institutional/types";

type Props = {
  data: InstitutionalCapitalPage;
};

export function SpCapitalBreakdownPage({ data }: Props) {
  return (
    <section className="sp-page bg-gray">
      <p className="sp-eyebrow">The Investment</p>
      <h1>The path to wealth.</h1>
      <p className="sp-lead">A secure investment protected from utility inflation for 25 years.</p>

      <div className="sp-value-flow">
        <div className="sp-v-node">
          <p className="sp-v-num">₹{data.net_investment_lakhs}L</p>
          <p className="sp-v-lbl">Net Investment</p>
        </div>
        <div className="sp-v-arrow">➔</div>
        <div className="sp-v-node">
          <p className="sp-v-num green">₹{data.lifetime_returns_lakhs}L</p>
          <p className="sp-v-lbl">Lifetime Returns</p>
        </div>
        <div className="sp-v-arrow">➔</div>
        <div className="sp-v-node">
          <p className="sp-v-num blue">25 Yrs</p>
          <p className="sp-v-lbl">Energy Protection</p>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <div className="sp-calc-row">
          <div className="sp-calc-left">
            Gross System Cost
            <span className="sp-calc-desc">Tier-1 hardware &amp; turnkey installation.</span>
          </div>
          <div className="sp-calc-right">{fmtInrSpaced(data.gross_cost_inr)}</div>
        </div>
        <div className="sp-calc-row">
          <div className="sp-calc-left">
            PM Surya Ghar Subsidy
            <span className="sp-calc-desc">Government grant applied directly.</span>
          </div>
          <div className="sp-calc-right green">- {fmtInrSpaced(data.subsidy_inr)}</div>
        </div>
        <div className="sp-calc-row" style={{ borderBottom: "none" }}>
          <div className="sp-calc-left" style={{ fontWeight: 700 }}>
            Final Amount To Pay
          </div>
          <div className="sp-calc-right large">{fmtInrSpaced(data.net_cost_inr)}</div>
        </div>
      </div>

      {data.emi_rows.length > 0 ? (
        <div className="sp-apple-card">
          <h3 className="sp-card-title">Flexible Financing (Solar Loan)</h3>
          {data.emi_rows.map((row) => (
            <div key={row.tenure_label} className="sp-emi-row">
              <div className="sp-emi-col1">{row.tenure_label}</div>
              <div className="sp-emi-col2">Total Interest: {fmtInrSpaced(row.interest_inr)}</div>
              <div className="sp-emi-col3">{fmtInrSpaced(row.monthly_inr)} /mo</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
