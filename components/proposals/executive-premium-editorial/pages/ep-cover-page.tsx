"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import { formatEditorialTitleCase } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: Pick<
    ExecutivePremiumEditorialModel,
    "brand_display" | "brand_logo_url" | "brand_tagline" | "customer_name" | "location_line" | "asset_profile_line"
  >;
  showLogo?: boolean;
  showName?: boolean;
  showTagline?: boolean;
};

export function EpCoverPage({
  data,
  showLogo = true,
  showName = false,
  showTagline = false,
}: Props) {
  const { copy } = useEpGoldenLang();
  const logoUrl = showLogo ? data.brand_logo_url?.trim() : undefined;
  const brandName = showName ? data.brand_display?.trim() : undefined;
  const tagline = showTagline ? data.brand_tagline?.trim() : undefined;
  const customerName = formatEditorialTitleCase(data.customer_name);
  const locationLine = formatEditorialTitleCase(data.location_line);

  return (
    <EpLuxuryPage cover>
      <div className="ep-gl-cover-inner">
        <div className="ep-gl-cover-hero">
          {logoUrl || brandName ? (
            <div className="ep-gl-cover-brand-lockup">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={brandName || "Company logo"} className="ep-gl-cover-logo" />
              ) : null}
              {brandName ? <p className="ep-gl-cover-brand">{brandName}</p> : null}
              {tagline ? <p className="ep-gl-cover-tagline">{tagline}</p> : null}
            </div>
          ) : null}

          <h1 className="ep-gl-cover-title">
            {copy.cover.titleLine1}
            <br />
            {copy.cover.titleLine2}
          </h1>
          <div className="ep-gl-cover-divider" aria-hidden />

          <div className="ep-gl-cover-client-block">
            <p className="ep-gl-prepared-for">{copy.cover.preparedFor}</p>
            <p className="ep-gl-client-name">{customerName}</p>
          </div>
        </div>

        <div className="ep-gl-cover-meta-grid">
          <div className="ep-gl-cover-meta-item">
            <p className="ep-gl-label-upper">{copy.cover.estateLocation}</p>
            <p className="ep-gl-cover-location">{locationLine}</p>
          </div>
          <div className="ep-gl-cover-meta-item">
            <p className="ep-gl-label-upper">{copy.cover.assetProfile}</p>
            <p className="ep-gl-cover-asset-profile">{data.asset_profile_line}</p>
          </div>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
