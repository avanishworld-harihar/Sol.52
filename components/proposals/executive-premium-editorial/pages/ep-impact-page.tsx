"use client";

import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["impact"];
};

type ImpactTheme = "air" | "forest";

function ImpactVisual({ theme }: { theme: ImpactTheme }) {
  if (theme === "air") {
    return (
      <div className="ep-gl-impact-visual ep-gl-impact-visual--air" aria-hidden>
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" fill="url(#ep-gl-air-glow)" opacity="0.55" />
          <path d="M14 28c4-3 8-3 12 0s8 3 12 0" stroke="#0d7a55" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 20c3.5-2.5 7-2.5 10.5 0s7 2.5 10.5 0" stroke="#b59a57" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 34c2.5-1.8 5-1.8 7.5 0s5 1.8 7.5 0" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          <circle cx="33" cy="15" r="5" fill="#f5e6b8" stroke="#b59a57" strokeWidth="1.2" />
          <defs>
            <radialGradient id="ep-gl-air-glow" cx="0" cy="0" r="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div className="ep-gl-impact-visual ep-gl-impact-visual--forest" aria-hidden>
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="url(#ep-gl-forest-glow)" opacity="0.55" />
        <rect x="21" y="30" width="6" height="10" rx="1" fill="#8b6a2e" />
        <path d="M24 8c-6 5-9 10-9 15a9 9 0 0 0 18 0c0-5-3-10-9-15Z" fill="#16a34a" stroke="#0d7a55" strokeWidth="1.2" />
        <path d="M24 14c-3.5 3-5.5 6-5.5 9.5a5.5 5.5 0 0 0 11 0C29.5 20 27.5 17 24 14Z" fill="#22c55e" opacity="0.85" />
        <path d="M12 36c2.5-1 5-1.5 7.5-1.5" stroke="#b59a57" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M28.5 34.5c2.2-.6 4.5-.8 7-.5" stroke="#b59a57" strokeWidth="1.4" strokeLinecap="round" />
        <defs>
          <radialGradient id="ep-gl-forest-glow" cx="0" cy="0" r="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

const IMPACT_THEMES: ImpactTheme[] = ["air", "forest"];

export function EpImpactPage({ data }: Props) {
  const { copy } = useEpGoldenLang();
  const values = [data.co2_tons, data.trees];

  return (
    <EpLuxuryPage className="ep-gl-impact-page">
      <header className="ep-gl-page-intro ep-gl-page-intro--impact">
        <div className="ep-gl-section-tag">{copy.impact.tag}</div>
        <h1 className="ep-gl-h1">{copy.impact.title}</h1>
        <p className="ep-gl-lead ep-gl-lead--tight">{copy.impact.lead}</p>
      </header>

      <div className="ep-gl-impact-grid">
        {copy.impact.cards.map((card, i) => (
          <article key={IMPACT_THEMES[i]} className={`ep-gl-impact-card ep-gl-impact-card--${IMPACT_THEMES[i]}`}>
            <span className="ep-gl-impact-card-index">{String(i + 1).padStart(2, "0")}</span>
            <ImpactVisual theme={IMPACT_THEMES[i]} />
            <p className="ep-gl-impact-card-value">{values[i].toLocaleString("en-IN")}</p>
            <p className="ep-gl-impact-card-label">{card.label}</p>
            <div className="ep-gl-impact-card-divider" aria-hidden />
            <h2 className="ep-gl-impact-card-headline">{card.headline}</h2>
            <p className="ep-gl-impact-card-proof">{card.proof(values[i].toLocaleString("en-IN"))}</p>
            <p className="ep-gl-impact-card-body">{card.body}</p>
          </article>
        ))}
      </div>
    </EpLuxuryPage>
  );
}
