import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["execution"];
};

export function EpExecutionPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">08 / Execution & Settlement</div>
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
            <table className="ep-gl-payment-table">
              <tbody>
                {data.payments.map((p, i) => {
                  const isLast = p.is_total;
                  const isDivider = i === data.payments.length - 2;
                  const rowClass = isDivider ? "ep-gl-payment-row-divider" : undefined;
                  return (
                    <tr key={p.label} className={rowClass}>
                      <td className={`ep-gl-payment-label${isLast ? " ep-gl-payment-final" : ""}`}>
                        {p.label}{" "}
                        <span className="ep-gl-payment-pct">({p.pct_label})</span>
                      </td>
                      <td className={`ep-gl-payment-amt${isLast ? " ep-gl-payment-final" : ""}`}>
                        {fmtInrSpaced(p.amount_inr)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="ep-gl-receipt-title">Secure Routing Details</p>
            <div className="ep-gl-bank-box">
              <p className="ep-gl-bank-label">Beneficiary</p>
              <p className="ep-gl-bank-value serif">{data.company}</p>
              <p className="ep-gl-bank-label">Account No.</p>
              <p className="ep-gl-bank-value mono">{data.account_number}</p>
              <p className="ep-gl-bank-label">IFSC Code</p>
              <p className="ep-gl-bank-value mono">{data.ifsc}</p>
            </div>

            <div className="ep-gl-upi-box">
              <p className="ep-gl-upi-label">Express UPI Payment</p>
              <p className="ep-gl-upi-id">{data.upi_id}</p>
            </div>
          </div>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
