"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle, fmtInrL } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
};

export function AuroraRoi({ summary, lang }: Props) {
  const isHi = lang === "hi";
  const env = summary.environmental;
  const lifetime = fmtInrL(summary.solarVsGrid?.netSaving ?? summary.lifetime25Profit);

  return (
    <AuroraPageShell tone="sky">
      <AuroraEyebrow className="aurora-eyebrow--sky">{isHi ? "आपकी बचत" : "What you save"}</AuroraEyebrow>
      <AuroraTitle>{isHi ? "धन बनाने का रास्ता" : "The path to wealth."}</AuroraTitle>
      <AuroraLead>
        {isHi
          ? `लगभग ${summary.paybackYears.toFixed(1)} साल में पैसा वापस — उसके बाद सिर्फ बचत।`
          : `You get your money back in about ${summary.paybackYears.toFixed(1)} years. After that, it's pure savings.`}
      </AuroraLead>

      <div className="aurora-roi-grid">
        <div className="aurora-roi-col">
          <div className="aurora-roi-card">
            <p className="aurora-roi-card-label">{isHi ? "जीवनकाल मूल्य" : "Lifetime value created"}</p>
            <p className="aurora-roi-card-val aurora-roi-card-val--emerald">{lifetime}</p>
            <p className="aurora-roi-card-desc">
              {isHi
                ? "25 साल में आपके खाते में बची कुल पूंजी"
                : "Total capital retained over the asset's 25-year lifespan."}
            </p>
          </div>
          <div className="aurora-roi-card">
            <p className="aurora-roi-card-label">{isHi ? "पेबैक अवधि" : "Payback period"}</p>
            <p className="aurora-roi-card-val">{summary.paybackYears.toFixed(1)} {isHi ? "वर्ष" : "yrs"}</p>
            <p className="aurora-roi-card-desc">
              {isHi
                ? "बिल बचत से कुल निवेश वसूलने का समय"
                : "Time required to recover total capital via bill savings."}
            </p>
          </div>
        </div>

        <div className="aurora-roi-env">
          <p className="aurora-roi-env-title">{isHi ? "पर्यावरणीय योगदान" : "Environmental legacy"}</p>
          <div className="aurora-roi-env-item">
            <span className="aurora-roi-env-icon" aria-hidden>☁️</span>
            <div>
              <p className="aurora-roi-env-val">{env.lifetimeCo2TonsSaved} {isHi ? "टन" : "Tons"}</p>
              <p className="aurora-roi-env-sub">
                {isHi ? "CO₂ उत्सर्जन रोका गया" : "of CO₂ emissions prevented."}
              </p>
            </div>
          </div>
          <div className="aurora-roi-env-item">
            <span className="aurora-roi-env-icon" aria-hidden>🌳</span>
            <div>
              <p className="aurora-roi-env-val aurora-roi-env-val--green">
                {env.treeEquivalent.toLocaleString("en-IN")}
              </p>
              <p className="aurora-roi-env-sub">
                {isHi ? "पेड़ों के बराबर (25 साल)" : "Trees equivalent planted over 25 years."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuroraPageShell>
  );
}
