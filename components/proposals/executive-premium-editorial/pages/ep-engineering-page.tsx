"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import type { EditorialEngineeringModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: EditorialEngineeringModel;
};

export function EpEngineeringPage({ data }: Props) {
  const { copy } = useEpGoldenLang();

  return (
    <EpLuxuryPage className="ep-gl-engineering-page">
      <div className="ep-gl-section-tag">{copy.engineering.tag}</div>
      <h1 className="ep-gl-h1">{copy.engineering.title}</h1>
      <p className="ep-gl-lead">{copy.engineering.lead}</p>

      <div className="ep-gl-eng-layout">
        <div className="ep-gl-eng-metrics">
          {data.metrics_rows.map((row) => (
            <div
              key={row.label}
              className={`ep-gl-eng-metric${row.highlight ? " ep-gl-eng-metric--hi" : ""}`}
            >
              <span className="ep-gl-eng-metric-label">{row.label}</span>
              <span className="ep-gl-eng-metric-value">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="ep-gl-eng-tilt-box">
          <p className="ep-gl-eng-tilt-kicker">{copy.engineering.tiltKicker(data.city_label)}</p>
          <p className="ep-gl-eng-tilt-deg">{data.tilt_deg}°</p>
          <p className="ep-gl-eng-tilt-note">{data.tilt_note}</p>
          {data.cable_note ? <p className="ep-gl-eng-tilt-sub">{data.cable_note}</p> : null}
        </div>
      </div>

      <p className="ep-gl-eng-block-title">{copy.engineering.standards}</p>
      <div className="ep-gl-eng-chips">
        {data.standards.map((s) => (
          <span key={s} className="ep-gl-eng-chip">
            {s}
          </span>
        ))}
      </div>

      <p className="ep-gl-eng-block-title">{copy.engineering.installProcess}</p>
      <div className="ep-gl-eng-phases">
        {data.install_phases.map((p) => (
          <div key={p.num} className="ep-gl-eng-phase">
            <span className="ep-gl-eng-phase-num">{p.num}</span>
            <p className="ep-gl-eng-phase-title">{p.title}</p>
            <p className="ep-gl-eng-phase-detail">{p.detail}</p>
          </div>
        ))}
      </div>
    </EpLuxuryPage>
  );
}
