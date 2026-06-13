import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["impact"];
};

export function EpImpactPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">03 / Ecological Retention</div>
      <h1 className="ep-gl-h1">Your Green Legacy.</h1>
      <p className="ep-gl-lead">
        What your rooftop gives back to the planet over 25 years by generating 100% clean, emission-free power.
      </p>

      <div className="ep-gl-impact-container">
        <div className="ep-gl-impact-block">
          <p className="ep-gl-impact-number">{data.co2_tons.toLocaleString("en-IN")} Tons</p>
          <p className="ep-gl-impact-label">Of CO₂ Eliminated</p>
          <div className="ep-gl-impact-divider" />
          <p className="ep-gl-impact-desc" style={{ marginTop: "15px" }}>
            By producing your own solar power, you actively prevent coal power plants from burning fossil fuels on your
            behalf.
          </p>
        </div>

        <div className="ep-gl-impact-block" style={{ marginBottom: 0 }}>
          <p className="ep-gl-impact-number">{data.trees.toLocaleString("en-IN")}</p>
          <p className="ep-gl-impact-label">Trees Equivalent Planted</p>
          <div className="ep-gl-impact-divider" />
          <p className="ep-gl-impact-desc" style={{ marginTop: "15px" }}>
            To naturally absorb {data.co2_tons.toLocaleString("en-IN")} Tons of carbon dioxide from the atmosphere, you
            would need to plant a small forest. Your roof achieves the exact same ecological milestone.
          </p>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
