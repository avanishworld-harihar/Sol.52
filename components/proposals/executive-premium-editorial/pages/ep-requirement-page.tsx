import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";

type Props = {
  systemKw: number;
  coveragePct: number;
  assetProfileLine: string;
  annualGenKwh: number;
};

export function EpRequirementPage({ systemKw, coveragePct, assetProfileLine, annualGenKwh }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">01 / System Design</div>
      <h1 className="ep-gl-h1">{EP_COPY.requirement.pageTitle}</h1>
      <p className="ep-gl-lead" style={{ marginBottom: "20px" }}>
        {EP_COPY.requirement.heroSub}
      </p>

      <div className="ep-gl-audit-metrics-row">
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number green">{coveragePct}%</p>
          <p className="ep-gl-huge-label">{EP_COPY.requirement.heroLabel}</p>
        </div>
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number">{systemKw} kW</p>
          <p className="ep-gl-huge-label">Proposed system</p>
          <p className="ep-gl-metric-caption">{assetProfileLine}</p>
        </div>
        <div className="ep-gl-audit-metric-box">
          <p className="ep-gl-huge-number">{annualGenKwh.toLocaleString("en-IN")}</p>
          <p className="ep-gl-huge-label">Units / year</p>
          <p className="ep-gl-metric-caption">Estimated generation</p>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
