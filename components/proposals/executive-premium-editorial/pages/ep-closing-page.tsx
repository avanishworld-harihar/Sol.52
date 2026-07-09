"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import type { EditorialClosingModel } from "@/lib/executive-premium-editorial/types";
import { fmtInr } from "@/lib/executive-premium-editorial/format";

type Props = {
  data: EditorialClosingModel;
};

export function EpClosingPage({ data }: Props) {
  const { copy } = useEpGoldenLang();
  const units = Math.round(data.annual_units).toLocaleString("en-IN");

  return (
    <EpLuxuryPage className="ep-gl-closing-page">
      <div className="ep-gl-closing-accent" aria-hidden />

      <div className="ep-gl-closing-hero">
        <p className="ep-gl-closing-eyebrow">{copy.closing.congrats(data.customer_name || undefined)}</p>
        <h1 className="ep-gl-closing-title">{copy.closing.heroTitle}</h1>

        <div className="ep-gl-closing-highlights">
          <div className="ep-gl-closing-highlight">
            <span className="ep-gl-closing-highlight-value">{units}</span>
            <span className="ep-gl-closing-highlight-label">{copy.closing.unitsYear}</span>
          </div>

          <div className="ep-gl-closing-highlight ep-gl-closing-highlight--wealth">
            <span className="ep-gl-closing-wealth-kicker">{copy.closing.lifetimeWealth}</span>
            <span className="ep-gl-closing-highlight-value ep-gl-closing-wealth-value">
              ₹{fmtInr(data.lifetime_wealth_inr)}
            </span>
          </div>
        </div>
      </div>

      <div className="ep-gl-closing-cta">
        <div className="ep-gl-closing-contact">
          <p className="ep-gl-closing-block-title">{copy.closing.reserveInstall}</p>
          <p className="ep-gl-closing-company">{data.installer_name}</p>
          <p className="ep-gl-closing-contact-line">{data.contact_line}</p>
        </div>
        {data.qr_url ? (
          <div className="ep-gl-closing-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qr_url} alt="Contact / payment QR" className="ep-gl-closing-qr-img" />
            <span className="ep-gl-closing-qr-caption">{copy.closing.scanConnect}</span>
          </div>
        ) : null}
      </div>

      <div className="ep-gl-closing-signoff">
        <div className="ep-gl-closing-sign">
          <div className="ep-gl-closing-sign-line" aria-hidden />
          <p className="ep-gl-closing-sign-role">{copy.closing.salesRep}</p>
          <p className="ep-gl-closing-sign-sub">{copy.closing.nameSign}</p>
        </div>
        <div className="ep-gl-closing-sign">
          <div className="ep-gl-closing-sign-line" aria-hidden />
          <p className="ep-gl-closing-sign-role">{copy.closing.customerAccept}</p>
          <p className="ep-gl-closing-sign-sub">
            {(data.customer_name || "Signature")} &amp; {copy.closing.signDate.includes("तिथि") ? "तिथि" : "Date"}
          </p>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
