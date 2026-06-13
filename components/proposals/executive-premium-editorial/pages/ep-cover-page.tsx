import { EpSplitPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-split-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: Pick<
    ExecutivePremiumEditorialModel,
    "brand_primary" | "brand_secondary" | "customer_name" | "location_line" | "system_size_line" | "cover_tagline"
  >;
};

export function EpCoverPage({ data }: Props) {
  return (
    <EpSplitPage
      mainClassName="ep-ed-cover-main"
      sidebar={
        <>
          <div style={{ marginTop: "10mm" }}>
            <span
              style={{
                fontSize: "14pt",
                fontWeight: 700,
                letterSpacing: "4px",
                color: "#FFFFFF",
                display: "block",
              }}
            >
              {data.brand_primary}
            </span>
            {data.brand_secondary ? (
              <span
                style={{
                  fontSize: "14pt",
                  fontWeight: 300,
                  letterSpacing: "4px",
                  color: "#888888",
                  display: "block",
                }}
              >
                {data.brand_secondary}
              </span>
            ) : null}
          </div>
          <div style={{ position: "absolute", bottom: "20mm", left: "15mm" }}>
            <p
              style={{
                fontSize: "8pt",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "2px",
                margin: "0 0 5px 0",
              }}
            >
              Location
            </p>
            <p style={{ fontSize: "10pt", color: "#FFF", margin: "0 0 20px 0" }}>{data.location_line}</p>
            <p
              style={{
                fontSize: "8pt",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "2px",
                margin: "0 0 5px 0",
              }}
            >
              System Size
            </p>
            <p style={{ fontSize: "10pt", color: "#FFF", margin: 0 }}>{data.system_size_line}</p>
          </div>
        </>
      }
    >
      <p
        style={{
          fontSize: "10pt",
          fontWeight: 600,
          color: "#B87333",
          textTransform: "uppercase",
          letterSpacing: "3px",
          marginBottom: "20px",
        }}
      >
        Prepared Exclusively For
      </p>
      <h1 className="ep-ed-cover-title">{data.customer_name}</h1>
      <div style={{ width: "50px", height: "2px", backgroundColor: "#B87333", margin: "30px 0" }} />
      <p
        style={{
          fontSize: "14pt",
          color: "#666",
          maxWidth: "300px",
          fontWeight: 300,
          lineHeight: 1.6,
        }}
      >
        {data.cover_tagline}
      </p>
    </EpSplitPage>
  );
}
