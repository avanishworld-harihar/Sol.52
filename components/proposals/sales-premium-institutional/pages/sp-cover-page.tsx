"use client";

import type { InstitutionalCoverPage } from "@/lib/sales-premium-institutional/types";

type Props = {
  data: InstitutionalCoverPage;
};

export function SpCoverPage({ data }: Props) {
  return (
    <section className="sp-page bg-gray">
      <div className="sp-cover-container">
        <div className="sp-cover-content">
          <p className="sp-logo-text">{data.brand_display.toUpperCase()}</p>
          <h1 className="sp-hero-title">Your home will generate its own electricity.</h1>
          <p className="sp-cover-sub">For the next 25 years.</p>
          <p className="sp-cover-savings">
            Saving you over ₹{data.savings_lakhs} Lakhs, starting this year.
          </p>

          <div className="sp-client-box">
            <div className="sp-cb-left">
              <p className="sp-field-label">Prepared For</p>
              <p className="sp-field-value">{data.customer_name}</p>
              <p className="sp-field-sub">{data.location_line}</p>
            </div>
            <div className="sp-cb-right">
              <p className="sp-field-label">System Profile</p>
              <p className="sp-field-value sp-system-kw">{data.system_kw_line}</p>
              <p className="sp-field-sub">{data.system_architecture_line}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
