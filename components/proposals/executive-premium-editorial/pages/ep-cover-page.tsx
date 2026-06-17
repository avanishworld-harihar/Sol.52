import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: Pick<
    ExecutivePremiumEditorialModel,
    "brand_display" | "brand_logo_url" | "customer_name" | "location_line" | "asset_profile_line"
  >;
};

function brandInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "H";
}

export function EpCoverPage({ data }: Props) {
  return (
    <EpLuxuryPage cover>
      <div className="ep-gl-cover-content">
        <div className="ep-gl-brand-lockup">
          {data.brand_logo_url ? (
            <div className="ep-gl-brand-logo-wrap">
              <img src={data.brand_logo_url} alt="" className="ep-gl-brand-logo" />
            </div>
          ) : (
            <div className="ep-gl-brand-monogram" aria-hidden>
              {brandInitial(data.brand_display)}
            </div>
          )}
          <p className="ep-gl-brand-name">{data.brand_display}</p>
        </div>

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
          <p className="ep-gl-caption" style={{ fontSize: "11pt", color: "var(--ep-gl-ink)", marginBottom: "20px" }}>
            {data.location_line}
          </p>

          <p className="ep-gl-label-upper">Asset Profile</p>
          <p className="ep-gl-caption" style={{ fontSize: "11pt", color: "var(--ep-gl-ink)", marginBottom: 0 }}>
            {data.asset_profile_line}
          </p>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
