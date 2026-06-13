import { EpSplitPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-split-page";
import { fmtInr } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["execution"];
};

export function EpExecutionPage({ data }: Props) {
  return (
    <EpSplitPage
      sidebar={
        <>
          <h2>05. Next Steps</h2>
          <div style={{ marginTop: "40px" }}>
            <p
              style={{
                fontSize: "8pt",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "1px",
                margin: "0 0 5px 0",
              }}
            >
              Company
            </p>
            <p style={{ fontSize: "11pt", color: "#FFF", fontWeight: 600, margin: "0 0 25px 0" }}>{data.company}</p>

            <p
              style={{
                fontSize: "8pt",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "1px",
                margin: "0 0 5px 0",
              }}
            >
              Account Number
            </p>
            <p style={{ fontSize: "12pt", color: "#FFF", fontFamily: "monospace", margin: "0 0 25px 0" }}>
              {data.account_number}
            </p>

            <p
              style={{
                fontSize: "8pt",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "1px",
                margin: "0 0 5px 0",
              }}
            >
              IFSC Code
            </p>
            <p style={{ fontSize: "12pt", color: "#FFF", fontFamily: "monospace", margin: "0 0 25px 0" }}>
              {data.ifsc}
            </p>

            <div style={{ borderTop: "1px solid #333", paddingTop: "20px" }}>
              <p
                style={{
                  fontSize: "8pt",
                  color: "#B87333",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  margin: "0 0 5px 0",
                }}
              >
                UPI ID
              </p>
              <p style={{ fontSize: "10pt", color: "#FFF", margin: 0 }}>{data.upi_id}</p>
            </div>
          </div>
        </>
      }
    >
      <h1 className="ep-ed-h1">Installation Process.</h1>
      <p className="ep-ed-subtitle">We handle all the paperwork and hard work for you.</p>

      <div style={{ marginTop: "50px" }}>
        {data.steps.map((step) => (
          <div key={step.num} className="ep-ed-process-item">
            <div className="ep-ed-process-num">{step.num}</div>
            <div className="ep-ed-process-content">
              <p className="ep-ed-process-title">{step.title}</p>
              <p className="ep-ed-process-desc">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <table className="ep-ed-clean-receipt">
        <thead>
          <tr>
            <th colSpan={2}>Payment Schedule</th>
          </tr>
        </thead>
        <tbody>
          {data.payments.map((p) => (
            <tr key={p.label} className={p.is_total ? "ep-ed-total-tr" : undefined}>
              <td style={p.is_total ? { color: "#1A1A1A" } : undefined}>{p.label}</td>
              <td>{fmtInr(p.amount_inr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </EpSplitPage>
  );
}
