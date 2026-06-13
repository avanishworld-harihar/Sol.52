import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["execution"];
};

export function EpExecutionPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">05 / Execution & Settlement</div>
      <h1 className="ep-gl-h1">Installation Process.</h1>
      <p className="ep-gl-lead">We handle all the paperwork and hard work so you can simply enjoy free electricity.</p>

      <div className="ep-gl-grid-2">
        <div className="ep-gl-col-half ep-gl-col-left">
          {data.steps.map((step, i) => (
            <div
              key={step.num}
              className="ep-gl-exec-step"
              style={i === data.steps.length - 1 ? { marginBottom: 0 } : undefined}
            >
              <span className="ep-gl-exec-num">{step.num}</span>
              <p className="ep-gl-exec-title">{step.title}</p>
              <p className="ep-gl-exec-desc">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="ep-gl-col-half ep-gl-col-right">
          <div className="ep-gl-receipt-card">
            <p className="ep-gl-receipt-title">Payment Schedule</p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
              <tbody>
                {data.payments.map((p, i) => {
                  const isLast = p.is_total;
                  const borderBottom = i === data.payments.length - 2 ? "1px solid #e2e8f0" : undefined;
                  const padding = isLast ? "10px 0 0 0" : "6px 0";
                  return (
                    <tr key={p.label}>
                      <td
                        style={{
                          padding,
                          borderBottom,
                          fontSize: isLast ? "10pt" : "9.5pt",
                          fontWeight: isLast ? 600 : 400,
                          color: "#4a5568",
                          paddingBottom: i === data.payments.length - 2 ? "10px" : undefined,
                        }}
                      >
                        {p.label}{" "}
                        <span style={{ fontSize: "8pt", color: "#a0aec0", fontWeight: 400 }}>({p.pct_label})</span>
                      </td>
                      <td
                        style={{
                          padding,
                          borderBottom,
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontSize: isLast ? "12pt" : "11pt",
                          fontWeight: 600,
                          color: isLast ? "#b59a57" : "#111e38",
                          paddingBottom: i === data.payments.length - 2 ? "10px" : undefined,
                        }}
                      >
                        {fmtInrSpaced(p.amount_inr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="ep-gl-receipt-title">Secure Routing Details</p>
            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "15px" }}>
              <p style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 2px 0" }}>
                Beneficiary
              </p>
              <p style={{ fontSize: "11pt", color: "#111e38", fontFamily: "Georgia, serif", margin: "0 0 10px 0" }}>
                {data.company}
              </p>
              <p style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 2px 0" }}>
                Account No.
              </p>
              <p style={{ fontSize: "11pt", color: "#111e38", fontFamily: "monospace", fontWeight: 600, margin: "0 0 10px 0" }}>
                {data.account_number}
              </p>
              <p style={{ fontSize: "7.5pt", color: "#718096", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 2px 0" }}>
                IFSC Code
              </p>
              <p style={{ fontSize: "11pt", color: "#111e38", fontFamily: "monospace", fontWeight: 600, margin: 0 }}>
                {data.ifsc}
              </p>
            </div>

            <div
              style={{
                marginTop: "15px",
                border: "1px dashed #b59a57",
                padding: "12px",
                textAlign: "center",
                backgroundColor: "#fffaf0",
              }}
            >
              <p
                style={{
                  fontSize: "8pt",
                  color: "#b59a57",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: 600,
                  margin: "0 0 5px 0",
                }}
              >
                Express UPI Payment
              </p>
              <p style={{ fontSize: "12pt", color: "#111e38", fontFamily: "monospace", fontWeight: 600, margin: 0 }}>
                {data.upi_id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
