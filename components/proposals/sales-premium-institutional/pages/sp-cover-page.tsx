"use client";

import type { InstitutionalCoverPage } from "@/lib/sales-premium-institutional/types";
import type { SalesPremiumInstitutionalVariant } from "@/lib/sales-premium-styles";

type Props = {
  data: InstitutionalCoverPage;
  variant?: SalesPremiumInstitutionalVariant;
};

export function SpCoverPage({ data, variant = "slate" }: Props) {
  if (variant === "pearl") {
    return (
      <section className="sp-page sp-page-pearl">
        <p className="sp-pearl-brand">{data.brand_display}</p>
        <div className="sp-pearl-accent" aria-hidden />
        <h1 className="sp-pearl-title">{data.customer_name}</h1>
        <p className="sp-pearl-lead">
          {data.system_kw_line} · {data.location_line}
        </p>
        <p className="sp-pearl-savings">
          Estimated 25-year savings: ₹{data.savings_lakhs} Lakhs
        </p>
        <div className="sp-pearl-meta">
          <div>
            <p className="sp-field-label">Prepared for</p>
            <p className="sp-field-value">{data.customer_name}</p>
          </div>
          <div>
            <p className="sp-field-label">System</p>
            <p className="sp-field-value">{data.system_kw_line}</p>
            <p className="sp-field-sub">{data.system_architecture_line}</p>
          </div>
        </div>
      </section>
    );
  }

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
