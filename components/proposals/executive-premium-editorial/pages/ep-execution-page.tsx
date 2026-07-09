"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import { fmtInrSpaced } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["execution"];
};

export function EpExecutionPage({ data }: Props) {
  const { copy } = useEpGoldenLang();

  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">{copy.execution.tag}</div>
      <h1 className="ep-gl-h1">{copy.execution.title}</h1>
      <p className="ep-gl-lead">{copy.execution.lead}</p>

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
            <p className="ep-gl-receipt-title">{copy.execution.paymentSchedule}</p>
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

            <p className="ep-gl-receipt-title">{copy.execution.bankDetails}</p>
            <div className="ep-gl-bank-box">
              <p className="ep-gl-bank-label">{copy.execution.beneficiary}</p>
              <p className="ep-gl-bank-value serif">{data.company}</p>
              <p className="ep-gl-bank-label">{copy.execution.accountNo}</p>
              <p className="ep-gl-bank-value mono">{data.account_number}</p>
              <p className="ep-gl-bank-label">{copy.execution.ifsc}</p>
              <p className="ep-gl-bank-value mono">{data.ifsc}</p>
            </div>

            <div className="ep-gl-upi-box">
              <p className="ep-gl-upi-label">{copy.execution.upi}</p>
              <p className="ep-gl-upi-id">{data.upi_id}</p>
            </div>
          </div>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
