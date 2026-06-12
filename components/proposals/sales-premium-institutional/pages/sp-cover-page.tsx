"use client";

import type { InstitutionalCoverPage } from "@/lib/sales-premium-institutional/types";

type Props = {
  data: InstitutionalCoverPage;
  pageNum: number;
  pageTotal: number;
};

export function SpCoverPage({ data, pageNum, pageTotal }: Props) {
  return (
    <section className="sp-page sp-cover-page">
      <div className="sp-cover-content">
        <div className="sp-brand-name">
          {data.brand_primary}
          {data.brand_secondary ? (
            <>
              {" "}
              <span className="sp-brand-sub">{data.brand_secondary}</span>
            </>
          ) : null}
        </div>
        <div className="sp-section-tag" style={{ marginBottom: 12 }}>
          Energy Masterplan Prepared For
        </div>
        <h1 className="sp-h1" style={{ fontSize: "52pt", marginBottom: 30 }}>
          {data.customer_name}
        </h1>
        <div className="sp-cover-rule" />
        <p className="sp-cover-tagline">
          A comprehensive architectural blueprint for transitioning your estate to independent,
          zero-bill renewable energy.
        </p>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0 }}>
        <p className="sp-cover-footer-label">Location</p>
        <p className="sp-cover-footer-value">{data.location_line}</p>
      </div>
      <div style={{ position: "absolute", bottom: 0, right: 0, textAlign: "right" }}>
        <p className="sp-cover-footer-label">System Profile</p>
        <p className="sp-cover-footer-value">{data.system_profile}</p>
      </div>

      <p className="sp-page-num">
        {pageNum} / {pageTotal}
      </p>
    </section>
  );
}
