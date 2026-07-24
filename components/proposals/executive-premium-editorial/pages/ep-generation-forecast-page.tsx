"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import { fmtCompactK } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["generation"];
};

export function EpGenerationForecastPage({ data }: Props) {
  const { copy } = useEpGoldenLang();
  const g = copy.generation;

  if (!data.months.length) return null;

  return (
    <EpLuxuryPage className="ep-gl-gen-page">
      <header className="ep-gl-page-intro">
        <div className="ep-gl-section-tag">{g.tag}</div>
        <h1 className="ep-gl-h1">{g.title}</h1>
        <p className="ep-gl-lead ep-gl-lead--tight">{g.lead}</p>
      </header>

      <div className="ep-gl-gen-peak-legend" aria-hidden>
        <span className="ep-gl-gen-peak-swatch ep-gl-gen-peak-swatch--peak" />
        <span>{g.peakLegend}</span>
        <span className="ep-gl-gen-peak-swatch ep-gl-gen-peak-swatch--base" />
        <span>{g.otherLegend}</span>
      </div>

      <div className="ep-gl-gen-forecast" role="img" aria-label={g.title}>
        <div className="ep-gl-gen-bars">
          {data.months.map((m) => (
            <div
              key={m.label}
              className={`ep-gl-gen-col${m.is_peak ? " ep-gl-gen-col--peak" : ""}`}
            >
              <span className="ep-gl-gen-units">
                {m.units > 0 ? m.units.toLocaleString("en-IN") : "—"}
              </span>
              <div className="ep-gl-gen-track">
                <div className="ep-gl-gen-plot">
                  <div className="ep-gl-gen-fill" style={{ height: `${m.bar_pct}%` }} />
                </div>
              </div>
              <span className="ep-gl-gen-month">{m.label}</span>
              <span className="ep-gl-gen-save">
                {m.savings_inr > 0 ? `₹${fmtCompactK(m.savings_inr)}` : "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="ep-gl-gen-axis">
          <span>{g.unitsLabel}</span>
          <span>{g.savingsLabel}</span>
        </div>
        {data.effective_rate_inr > 0 ? (
          <p className="ep-gl-gen-basis">{g.savingsBasis(data.effective_rate_inr.toFixed(2))}</p>
        ) : null}
      </div>

      <aside className="ep-gl-gen-insight">
        <p className="ep-gl-gen-insight-tag">{g.insightTag}</p>
        <h2 className="ep-gl-gen-insight-title">{g.insightTitle}</h2>
        <p className="ep-gl-gen-insight-body">{g.insightBody}</p>
      </aside>
    </EpLuxuryPage>
  );
}
