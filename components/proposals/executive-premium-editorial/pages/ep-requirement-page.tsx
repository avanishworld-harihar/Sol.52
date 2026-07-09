"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";

type Props = {
  systemKw: number;
  coveragePct: number;
  assetProfileLine: string;
  annualGenKwh: number;
};

export function EpRequirementPage({ systemKw, coveragePct, assetProfileLine, annualGenKwh }: Props) {
  const { copy } = useEpGoldenLang();

  return (
    <EpLuxuryPage className="ep-gl-requirement-page">
      <header className="ep-gl-page-intro">
        <div className="ep-gl-section-tag">{copy.requirement.tag}</div>
        <h1 className="ep-gl-h1">{copy.requirement.title}</h1>
        <p className="ep-gl-lead ep-gl-lead--tight">{copy.requirement.lead}</p>
      </header>

      <div className="ep-gl-requirement-hero">
        <div className="ep-gl-audit-metrics-row">
          <div className="ep-gl-audit-metric-box">
            <p className="ep-gl-huge-number green">{coveragePct}%</p>
            <p className="ep-gl-huge-label">{copy.requirement.heroLabel}</p>
          </div>
          <div className="ep-gl-audit-metric-box">
            <p className="ep-gl-huge-number">{systemKw} kW</p>
            <p className="ep-gl-huge-label">{copy.requirement.proposedSystem}</p>
            <p className="ep-gl-metric-caption">{assetProfileLine}</p>
          </div>
          <div className="ep-gl-audit-metric-box">
            <p className="ep-gl-huge-number">{annualGenKwh.toLocaleString("en-IN")}</p>
            <p className="ep-gl-huge-label">{copy.requirement.unitsYear}</p>
            <p className="ep-gl-metric-caption">{copy.requirement.estGen}</p>
          </div>
        </div>
      </div>
    </EpLuxuryPage>
  );
}
