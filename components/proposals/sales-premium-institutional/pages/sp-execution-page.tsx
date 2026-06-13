"use client";

import type { InstitutionalExecutionPage } from "@/lib/sales-premium-institutional/types";

type Props = {
  data: InstitutionalExecutionPage;
};

export function SpExecutionPage({ data }: Props) {
  return (
    <section className="sp-page bg-gray">
      <p className="sp-eyebrow">Next Steps</p>
      <h1>Seamless integration.</h1>
      <p className="sp-lead">We handle all permissions, paperwork, and installation.</p>

      <div className="sp-grid-2">
        <div className="sp-col-half sp-col-left">
          <div className="sp-checkout-flow">
            {data.steps.map((step) => (
              <div key={step.num} className="sp-step-item">
                <div className="sp-step-icon">
                  <div className="sp-circle">{step.num}</div>
                </div>
                <div className="sp-step-content">
                  <p className={`sp-step-title${step.highlight_title ? " blue" : ""}`}>
                    {step.title}
                  </p>
                  <p className="sp-step-desc">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sp-col-half sp-col-right">
          <div className="sp-bank-box">
            <p className="sp-bank-heading">Secure Bank Routing</p>

            <p className="sp-bank-lbl">Company Name</p>
            <p className="sp-bank-val sans">{data.bank.beneficiary}</p>

            <p className="sp-bank-lbl">Account Number</p>
            <p className="sp-bank-val">{data.bank.account_number}</p>

            <p className="sp-bank-lbl">IFSC Code</p>
            <p className="sp-bank-val" style={{ marginBottom: 25 }}>
              {data.bank.ifsc}
            </p>

            {data.bank.upi_id !== "—" ? (
              <div className="sp-upi-box">
                <p className="sp-upi-label">Express UPI Payment</p>
                <p className="sp-upi-val">{data.bank.upi_id}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
