import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { formatEditorialTitleCase } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: Pick<
    ExecutivePremiumEditorialModel,
    "brand_display" | "brand_logo_url" | "customer_name" | "location_line" | "asset_profile_line"
  >;
};

export function EpCoverPage({ data }: Props) {
  const logoUrl = data.brand_logo_url?.trim();
  const brandName = data.brand_display?.trim();
  const customerName = formatEditorialTitleCase(data.customer_name);
  const locationLine = formatEditorialTitleCase(data.location_line);

  return (
    <EpLuxuryPage cover>
      <div className="ep-gl-cover-content">
        {logoUrl || brandName ? (
          <div className="ep-gl-cover-brand-lockup">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName || "Company logo"} className="ep-gl-cover-logo" />
            ) : brandName ? (
              <p className="ep-gl-cover-brand">{brandName}</p>
            ) : null}
          </div>
        ) : null}

        <h1 className="ep-gl-cover-title">
          Personalized Energy
          <br />
          Masterplan.
        </h1>
        <div className="ep-gl-cover-divider" aria-hidden />

        <div className="ep-gl-cover-client-block">
          <p className="ep-gl-prepared-for">Prepared Exclusively For</p>
          <p className="ep-gl-client-name">{customerName}</p>
        </div>

        <div className="ep-gl-cover-meta-grid">
          <div className="ep-gl-cover-meta-item">
            <p className="ep-gl-label-upper">Estate Location</p>
            <p className="ep-gl-cover-location">{locationLine}</p>
          </div>
          <div className="ep-gl-cover-meta-item">
            <p className="ep-gl-label-upper">Asset Profile</p>
            <p className="ep-gl-cover-asset-profile">{data.asset_profile_line}</p>
          </div>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
