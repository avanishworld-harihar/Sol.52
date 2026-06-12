"use client";

import { fmtInrPlain } from "@/lib/sales-premium-institutional/format";
import type { InstitutionalCapitalPage } from "@/lib/sales-premium-institutional/types";

type Props = {
  data: InstitutionalCapitalPage;
  pageNum: number;
  pageTotal: number;
};

export function SpCapitalBreakdownPage({ data, pageNum, pageTotal }: Props) {
  return (
    <section className="sp-page">
      <div className="sp-section-tag">02 / Financial Architecture</div>
      <h1 className="sp-h1">The Capital Breakdown.</h1>
      <div className="sp-subtitle">Leveraging the PM Surya Ghar Yojana for rapid ROI.</div>

      <div className="sp-box">
        <table className="sp-table" style={{ marginBottom: 0 }}>
          <tbody>
            <tr>
              <td style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", paddingBottom: 15 }}>
                <strong style={{ color: "#111827", fontSize: "10pt", fontFamily: "inherit" }}>
                  Gross Infrastructure Cost
                </strong>
                <br />
                <span style={{ fontSize: "8pt", color: "#6b7280", fontFamily: "inherit" }}>
                  Tier-1 Panels, Inverter &amp; Turnkey Installation
                </span>
              </td>
              <td
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "14pt",
                  color: "#111827",
                  paddingBottom: 15,
                }}
              >
                {fmtInrPlain(data.gross_cost_inr)}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "15px 0" }}>
                <strong style={{ color: "#111827", fontSize: "10pt", fontFamily: "inherit" }}>
                  Government Grant (PM Surya Ghar)
                </strong>
                <br />
                <span style={{ fontSize: "8pt", color: "#059669", fontFamily: "inherit" }}>
                  Direct subsidy applied to your project
                </span>
              </td>
              <td
                className="sp-text-green"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "14pt",
                  padding: "15px 0",
                }}
              >
                - {fmtInrPlain(data.subsidy_inr)}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: "left", borderBottom: "none", paddingTop: 15 }}>
                <strong style={{ color: "#111827", fontSize: "11pt", fontFamily: "inherit" }}>
                  Net Capital Requirement
                </strong>
                <br />
                <span style={{ fontSize: "8pt", color: "#6b7280", fontFamily: "inherit" }}>
                  Final out-of-pocket investment
                </span>
              </td>
              <td
                style={{
                  borderBottom: "none",
                  fontSize: "20pt",
                  color: "#2563eb",
                  fontWeight: 600,
                  paddingTop: 15,
                }}
              >
                {fmtInrPlain(data.net_cost_inr)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sp-grid-2">
        <div className="sp-col-half">
          <div className="sp-data-block">
            <p className="sp-data-value">
              {data.payback_years}{" "}
              <span
                style={{
                  fontSize: "12pt",
                  color: "#6b7280",
                  fontFamily: "inherit",
                  fontWeight: 400,
                }}
              >
                Yrs
              </span>
            </p>
            <p className="sp-data-label">Break-Even Period</p>
            <p style={{ fontSize: "9.5pt", color: "#4b5563", marginTop: 8 }}>
              Your investment pays for itself entirely within{" "}
              {Math.round(data.payback_years * 12)} months through bill savings.
            </p>
          </div>
        </div>
        <div className="sp-col-half">
          <div className="sp-data-block">
            <p className="sp-data-value">
              {data.wealth_25yr_lakhs}{" "}
              <span
                style={{
                  fontSize: "12pt",
                  color: "#6b7280",
                  fontFamily: "inherit",
                  fontWeight: 400,
                }}
              >
                Lakhs
              </span>
            </p>
            <p className="sp-data-label">25-Yr Wealth Generation</p>
            <p style={{ fontSize: "9.5pt", color: "#4b5563", marginTop: 8 }}>
              The total capital retained in your estate over the lifetime of the solar asset.
            </p>
          </div>
        </div>
      </div>

      <p className="sp-page-num">
        {pageNum} / {pageTotal}
      </p>
    </section>
  );
}
