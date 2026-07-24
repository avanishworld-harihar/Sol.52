"use client";

import type { CSSProperties } from "react";
import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import type { EditorialEngineeringModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: EditorialEngineeringModel;
};

export function EpEngineeringPage({ data }: Props) {
  const { copy } = useEpGoldenLang();
  const e = copy.engineering;
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(data.visual_panel_count))));
  const showingPartial = data.panel_count > data.visual_panel_count;

  const siteItems = [
    {
      label: e.siteLatitude,
      value: data.site_lat_label,
      caption: e.siteLatitudeCaption,
    },
    {
      label: e.roofArea,
      value: `~${data.roof_area_m2} m²`,
      caption: e.roofAreaCaption(data.panel_count, data.m2_per_panel),
    },
    {
      label: e.shadowTolerance,
      value: e.shadowValue,
      caption: e.shadowCaption,
    },
  ];

  const specCards = [
    {
      value: `${data.ac_kw} kW AC`,
      label: e.specInverter,
      desc: e.specInverterDesc,
    },
    {
      value: `${data.dc_kwp.toFixed(2)} kWp`,
      label: e.specDcArray,
      desc: e.specDcArrayDesc(data.panel_count, data.panel_watt),
    },
    {
      value: `~${data.performance_ratio_pct}%`,
      label: e.specPr,
      desc: e.specPrDesc,
    },
    {
      value: String(data.dc_ac_ratio),
      label: e.specDcAc,
      desc: e.specDcAcDesc,
    },
  ];

  return (
    <>
      <EpLuxuryPage className="ep-gl-engineering-page">
        <div className="ep-gl-section-tag">{e.tag}</div>
        <h1 className="ep-gl-h1">{e.title}</h1>
        <p className="ep-gl-lead">{e.lead}</p>

        <div className="ep-gl-eng-blueprint">
          <div className="ep-gl-eng-roof">
            <div className="ep-gl-eng-compass" aria-hidden>
              <span className="ep-gl-eng-compass-n">N</span>
              <span className="ep-gl-eng-compass-e">E</span>
              <span className="ep-gl-eng-compass-s">S</span>
              <span className="ep-gl-eng-compass-w">W</span>
            </div>
            <div className="ep-gl-eng-roof-grid">
              <div
                className="ep-gl-eng-panel-layout"
                style={{ "--panel-cols": String(cols) } as CSSProperties}
              >
                {Array.from({ length: data.visual_panel_count }).map((_, i) => (
                  <div key={i} className="ep-gl-eng-panel-box" />
                ))}
              </div>
            </div>
            {data.panel_image_url ? (
              <img
                className="ep-gl-eng-panel-photo"
                src={data.panel_image_url}
                alt=""
                width={88}
                height={110}
              />
            ) : null}
            <div className="ep-gl-eng-roof-caption">
              <strong>{e.arrayCaption}</strong>
              <span>
                {e.arrayMeta(data.tilt_deg, data.azimuth_deg)}
                {showingPartial
                  ? e.arrayShowing(data.visual_panel_count, data.panel_count)
                  : ""}
              </span>
            </div>
          </div>

          <div className="ep-gl-eng-site">
            <h2 className="ep-gl-eng-site-title">{e.siteTitle}</h2>
            <div className="ep-gl-eng-site-list">
              {siteItems.map((item) => (
                <div key={item.label} className="ep-gl-eng-site-item">
                  <span className="ep-gl-eng-site-label">{item.label}</span>
                  <strong className="ep-gl-eng-site-value">{item.value}</strong>
                  <small className="ep-gl-eng-site-caption">{item.caption}</small>
                </div>
              ))}
            </div>
            {data.cable_note ? (
              <p className="ep-gl-eng-cable-note">{data.cable_note}</p>
            ) : null}
          </div>
        </div>

        <h2 className="ep-gl-eng-block-title">{e.specsTitle}</h2>
        <div className="ep-gl-eng-specs">
          {specCards.map((card) => (
            <div key={card.label} className="ep-gl-eng-spec-card">
              <p className="ep-gl-eng-spec-value">{card.value}</p>
              <p className="ep-gl-eng-spec-label">{card.label}</p>
              <p className="ep-gl-eng-spec-desc">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="ep-gl-eng-yield-strip" aria-label={e.yieldTitle}>
          <div className="ep-gl-eng-yield-item">
            <span>{e.yieldSun}</span>
            <strong>{data.peak_sun_hours} hrs/day</strong>
          </div>
          <div className="ep-gl-eng-yield-item">
            <span>{e.yieldSpecific}</span>
            <strong>{data.specific_yield} kWh/kWp/yr</strong>
          </div>
          <div className="ep-gl-eng-yield-item">
            <span>{e.yieldCoverage}</span>
            <strong>{data.load_coverage_pct}%</strong>
          </div>
        </div>

        <p className="ep-gl-eng-block-title">{e.standards}</p>
        <div className="ep-gl-eng-chips">
          {data.standards.map((s) => (
            <span key={s} className="ep-gl-eng-chip">
              {s}
            </span>
          ))}
        </div>

        <aside className="ep-gl-eng-insight">
          <p className="ep-gl-eng-insight-tag">{e.insightTag}</p>
          <p className="ep-gl-eng-insight-body">{e.insightBody(String(data.dc_ac_ratio))}</p>
        </aside>
      </EpLuxuryPage>

      <EpLuxuryPage className="ep-gl-engineering-page ep-gl-engineering-page--install">
        <div className="ep-gl-section-tag">{e.installTag}</div>
        <h1 className="ep-gl-h1">{e.installTitle}</h1>
        <p className="ep-gl-lead">{e.installLead}</p>

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
    </>
  );
}
