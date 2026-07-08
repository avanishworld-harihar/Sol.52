import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { EditorialClosingModel } from "@/lib/executive-premium-editorial/types";
import { fmtInr } from "@/lib/executive-premium-editorial/format";

type Props = {
  data: EditorialClosingModel;
};

export function EpClosingPage({ data }: Props) {
  const units = Math.round(data.annual_units).toLocaleString("en-IN");

  return (
    <EpLuxuryPage className="ep-gl-closing-page">
      <div className="ep-gl-closing-accent" aria-hidden />

      <div className="ep-gl-closing-hero">
        <p className="ep-gl-closing-eyebrow">Congratulations{data.customer_name ? `, ${data.customer_name}` : ""}</p>
        <h1 className="ep-gl-closing-title">Your roof is ready to start generating.</h1>

        <div className="ep-gl-closing-stats">
          <div className="ep-gl-closing-stat">
            <span className="ep-gl-closing-stat-value">{units}</span>
            <span className="ep-gl-closing-stat-unit">Units / Year</span>
            <span className="ep-gl-closing-stat-label">Clean energy your home produces</span>
          </div>
          <div className="ep-gl-closing-stat-divider" aria-hidden />
          <div className="ep-gl-closing-stat">
            <span className="ep-gl-closing-stat-value">₹{fmtInr(data.annual_savings_inr)}</span>
            <span className="ep-gl-closing-stat-unit">Estimated Savings / Year</span>
            <span className="ep-gl-closing-stat-label">Money back in your pocket</span>
          </div>
        </div>
      </div>

      <div className="ep-gl-closing-cta">
        <div className="ep-gl-closing-contact">
          <p className="ep-gl-closing-block-title">Reserve Your Installation</p>
          <p className="ep-gl-closing-company">{data.installer_name}</p>
          <p className="ep-gl-closing-contact-line">{data.contact_line}</p>
        </div>
        {data.qr_url ? (
          <div className="ep-gl-closing-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qr_url} alt="Contact / payment QR" className="ep-gl-closing-qr-img" />
            <span className="ep-gl-closing-qr-caption">Scan to connect</span>
          </div>
        ) : null}
      </div>

      <div className="ep-gl-closing-signoff">
        <div className="ep-gl-closing-sign">
          <div className="ep-gl-closing-sign-line" aria-hidden />
          <p className="ep-gl-closing-sign-role">Sales Representative</p>
          <p className="ep-gl-closing-sign-sub">Name &amp; Signature</p>
        </div>
        <div className="ep-gl-closing-sign">
          <div className="ep-gl-closing-sign-line" aria-hidden />
          <p className="ep-gl-closing-sign-role">Customer Acceptance</p>
          <p className="ep-gl-closing-sign-sub">{data.customer_name || "Signature"} &amp; Date</p>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
