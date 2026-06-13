import { EpSplitPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-split-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["impact"];
};

export function EpImpactPage({ data }: Props) {
  return (
    <EpSplitPage
      sidebar={
        <>
          <h2>03. Your Impact</h2>
          <p className="ep-ed-huge-data ep-ed-green-text">
            100<span>%</span>
          </p>
          <p className="ep-ed-data-label ep-ed-green-text">Clean Energy</p>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: "-20px", marginBottom: "40px", lineHeight: 1.4 }}>
            Your entire home will run on pure, emission-free power.
          </p>
          <p className="ep-ed-huge-data">{data.annual_gen_units.toLocaleString("en-IN")}</p>
          <p className="ep-ed-data-label">Units Generated</p>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: "-20px", lineHeight: 1.4 }}>
            The amount of electricity your system will create every year.
          </p>
        </>
      }
    >
      <h1 className="ep-ed-h1">Your Green Legacy.</h1>
      <p className="ep-ed-subtitle">What your rooftop gives back to the planet over 25 years.</p>

      <div style={{ marginTop: "60px" }}>
        <div className="ep-ed-env-item">
          <div className="ep-ed-env-icon">☁️</div>
          <div className="ep-ed-env-content">
            <h3 className="ep-ed-env-title">Carbon Emissions Saved</h3>
            <p className="ep-ed-env-desc">
              By producing your own solar power, you stop coal power plants from burning fuel. Over 25 years, your
              single roof makes a massive difference.
            </p>
            <p className="ep-ed-env-stat">{data.co2_tons.toLocaleString("en-IN")} Tons of CO₂</p>
          </div>
        </div>

        <div className="ep-ed-env-item">
          <div className="ep-ed-env-icon">🌳</div>
          <div className="ep-ed-env-content">
            <h3 className="ep-ed-env-title">Trees Equivalent Planted</h3>
            <p className="ep-ed-env-desc">
              To absorb {data.co2_tons.toLocaleString("en-IN")} Tons of carbon dioxide from the atmosphere naturally,
              you would need to plant a small forest. Your solar system does the exact same job.
            </p>
            <p className="ep-ed-env-stat">{data.trees.toLocaleString("en-IN")} Trees</p>
          </div>
        </div>
      </div>
    </EpSplitPage>
  );
}
