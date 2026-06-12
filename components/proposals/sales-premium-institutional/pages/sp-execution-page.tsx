"use client";

import { fmtInrPlain } from "@/lib/sales-premium-institutional/format";
import type { InstitutionalExecutionPage } from "@/lib/sales-premium-institutional/types";
import { SpExecutionTimeline } from "@/components/proposals/sales-premium-institutional/primitives/sp-execution-timeline";

type Props = {
  data: InstitutionalExecutionPage;
  pageNum: number;
  pageTotal: number;
};

export function SpExecutionPage({ data, pageNum, pageTotal }: Props) {
  return (
    <section className="sp-page">
      <div className="sp-section-tag">04 / Execution Protocol</div>
      <h1 className="sp-h1">The Path to Independence.</h1>
      <div className="sp-subtitle">
        From approval to grid-connection, our {data.team_city} team handles everything.
      </div>

      <SpExecutionTimeline steps={data.timeline} />

      <div className="sp-grid-2">
        <div className="sp-col-half">
          <h3 style={{ fontSize: "11pt", fontWeight: 600, color: "#111827", marginBottom: 15 }}>
            Remittance Tranches
          </h3>
          <table className="sp-table" style={{ border: "none", fontSize: "9pt" }}>
            <tbody>
              {data.payments.map((row) => (
                <tr key={row.label} className={row.is_total ? "sp-total-row" : undefined}>
                  <td style={{ textAlign: "left", padding: "6px 0", fontFamily: "inherit" }}>
                    {row.label}
                  </td>
                  <td style={{ padding: "6px 0" }}>{fmtInrPlain(row.amount_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sp-col-half">
          <div className="sp-banking-box">
            <h3
              style={{
                fontSize: "9pt",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginTop: 0,
                marginBottom: 15,
              }}
            >
              Secure Banking
            </h3>

            <p style={{ fontSize: "8pt", color: "#6b7280", marginBottom: 2 }}>Beneficiary</p>
            <p style={{ fontSize: "12pt", fontWeight: 600, color: "#111827", marginTop: 0, marginBottom: 12 }}>
              {data.bank.beneficiary}
            </p>

            <p style={{ fontSize: "8pt", color: "#6b7280", marginBottom: 2 }}>Account Number</p>
            <p
              style={{
                fontSize: "12pt",
                fontFamily: "ui-monospaced, monospace",
                color: "#111827",
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              {data.bank.account_number}
            </p>

            <p style={{ fontSize: "8pt", color: "#6b7280", marginBottom: 2 }}>IFSC Routing</p>
            <p
              style={{
                fontSize: "12pt",
                fontFamily: "ui-monospaced, monospace",
                color: "#111827",
                marginTop: 0,
                marginBottom: 15,
              }}
            >
              {data.bank.ifsc}
            </p>

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
              <p
                style={{
                  fontSize: "8pt",
                  color: "#2563eb",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 2,
                }}
              >
                Express UPI
              </p>
              <p style={{ fontSize: "11pt", fontWeight: 500, color: "#111827", margin: 0 }}>
                {data.bank.upi_id}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="sp-page-num">
        {pageNum} / {pageTotal}
      </p>
    </section>
  );
}
