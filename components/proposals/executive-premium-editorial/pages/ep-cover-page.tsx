import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: Pick<
    ExecutivePremiumEditorialModel,
    "brand_display" | "customer_name" | "location_line" | "asset_profile_line"
  >;
};

export function EpCoverPage({ data }: Props) {
  return (
    <EpLuxuryPage cover>
      <div className="ep-gl-cover-content">
        {data.brand_display ? <p className="ep-gl-cover-brand">{data.brand_display}</p> : null}

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
