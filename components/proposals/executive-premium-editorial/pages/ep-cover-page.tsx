import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: Pick<
    ExecutivePremiumEditorialModel,
    "brand_display" | "brand_logo_url" | "customer_name" | "location_line" | "asset_profile_line"
  >;
};

/** Split "Harihar Solar" → HARIHAR + SOLAR for stacked gold wordmark. */
function splitCoverBrandName(name: string): { primary: string; secondary: string } {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      primary: parts.slice(0, -1).join(" ").toUpperCase(),
      secondary: parts[parts.length - 1]!.toUpperCase(),
    };
  }
  return { primary: trimmed.toUpperCase(), secondary: "" };
}

export function EpCoverPage({ data }: Props) {
  const logoUrl = data.brand_logo_url?.trim();
  const brandName = data.brand_display?.trim();
  const wordmark = brandName ? splitCoverBrandName(brandName) : null;

  return (
    <EpLuxuryPage cover>
      <div className="ep-gl-cover-content">
        {logoUrl || brandName ? (
          <div className="ep-gl-cover-brand-lockup">
            {logoUrl ? (
              <>
                <div className="ep-gl-cover-logo-icon-wrap">
                  <img
                    src={logoUrl}
                    alt=""
                    aria-hidden
                    className="ep-gl-cover-logo-icon"
                  />
                </div>
                {wordmark ? (
                  <div className="ep-gl-cover-wordmark">
                    <p className="ep-gl-cover-brand-primary">{wordmark.primary}</p>
                    {wordmark.secondary ? (
                      <p className="ep-gl-cover-brand-secondary">{wordmark.secondary}</p>
                    ) : null}
                  </div>
                ) : null}
              </>
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
        <div className="ep-gl-cover-divider" />
        <p className="ep-gl-prepared-for">Prepared Exclusively For</p>
        <p className="ep-gl-client-name">{data.customer_name}</p>

        <div className="ep-gl-cover-meta-block">
          <p className="ep-gl-label-upper">Estate Location</p>
          <p className="ep-gl-cover-location">{data.location_line}</p>

          <p className="ep-gl-label-upper">Asset Profile</p>
          <p className="ep-gl-cover-asset-profile">{data.asset_profile_line}</p>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
