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
        <p className="ep-gl-brand-name">{data.brand_display}</p>
        <h1 className="ep-gl-cover-title">
          Personalized Energy
          <br />
          Masterplan.
        </h1>
        <div className="ep-gl-cover-divider" />
        <p className="ep-gl-prepared-for">Prepared Exclusively For</p>
        <p className="ep-gl-client-name">{data.customer_name}</p>

        <div style={{ marginTop: "60px" }}>
          <p
            style={{
              fontSize: "9pt",
              color: "#718096",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "5px",
            }}
          >
            Estate Location
          </p>
          <p style={{ fontSize: "11pt", color: "#111e38", marginBottom: "20px" }}>{data.location_line}</p>

          <p
            style={{
              fontSize: "9pt",
              color: "#718096",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "5px",
            }}
          >
            Asset Profile
          </p>
          <p style={{ fontSize: "11pt", color: "#111e38", marginBottom: 0 }}>{data.asset_profile_line}</p>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
