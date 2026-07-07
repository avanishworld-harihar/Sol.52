"use client";

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import {
  bomSystemEngineeringSnapshot,
  enrichBomTechnicalRows,
} from "@/lib/proposal-bom-technical-detail";
import { AuroraPageShell } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  pptInput?: PremiumProposalPptInput;
};

export function AuroraBom({ summary, lang, pptInput }: Props) {
  const isHi = lang === "hi";
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "Tier-1";
  const rows = enrichBomTechnicalRows(summary.bom, summary, {
    lang,
    pptInput,
  });
  const engineering = bomSystemEngineeringSnapshot(summary, lang);

  return (
    <AuroraPageShell tone="pearl" className="aurora-bom-page aurora-bom-page--zenith">
      <span className="aurora-section-tag">
        {isHi ? "तकनीकी सूची" : "Technical inventory"}
      </span>
      <h2 className="aurora-bom-title">
        {isHi ? "Tier-1 कंपोनेंट और स्पेक" : "Tier-1 components & specs"}
      </h2>

      <div className="aurora-bom-engineering">
        {engineering.map((item) => (
          <div key={item.label} className="aurora-bom-eng-cell">
            <p className="aurora-bom-eng-label">{item.label}</p>
            <p className="aurora-bom-eng-value">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="aurora-bom-table-wrap">
        <table className="aurora-bom-table">
          <thead>
            <tr>
              <th>{isHi ? "कंपोनेंट" : "Component"}</th>
              <th>{isHi ? "विस्तृत स्पेसिफिकेशन" : "Detailed specification"}</th>
              <th>{isHi ? "ब्रांड" : "Brand"}</th>
              <th>{isHi ? "वारंटी" : "Warranty"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.slot}>
                <td className="aurora-bom-comp">{item.title}</td>
                <td className="aurora-bom-spec">
                  <p className="aurora-bom-spec-lead">{item.spec}</p>
                  <ul className="aurora-bom-tech-list">
                    {item.technicalPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </td>
                <td className="aurora-bom-brand">{item.brand}</td>
                <td className="aurora-bom-warr">{item.warranty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="aurora-bom-outcomes">
        <div className="aurora-outcome-card">
          <p className="aurora-outcome-title">
            {isHi ? "सिस्टम विश्वसनीयता" : "System reliability"}
          </p>
          <p className="aurora-outcome-desc">
            {isHi
              ? `${panelBrand} पैनल उद्योग-अग्रणी degradation दर और पीक आउटपुट सुनिश्चित करते हैं। IEC 61215 / 61730 क्वालिफाइड मॉड्यूल्स।`
              : `${panelBrand} panels deliver industry-leading degradation rates and peak output. IEC 61215 / 61730 qualified modules.`}
          </p>
        </div>
        <div className="aurora-outcome-card">
          <p className="aurora-outcome-title">
            {isHi ? "प्रदर्शन मानक" : "Performance standards"}
          </p>
          <p className="aurora-outcome-desc">
            {isHi
              ? "SPD, कॉपर अर्थिंग, DC/AC प्रोटेक्शन TUV और IS 3043 मानकों के अनुरूप। इन्वर्टर IEC 62109 सुरक्षा क्लास।"
              : "SPD, copper earthing, and DC/AC protection per TUV and IS 3043. Inverter IEC 62109 safety class."}
          </p>
        </div>
        <div className="aurora-outcome-card">
          <p className="aurora-outcome-title">
            {isHi ? "नेट मीटरिंग और O&M" : "Net metering & O&M"}
          </p>
          <p className="aurora-outcome-desc">
            {isHi
              ? `बाइ-डायरेक्शनल नेट मीटर, DISCOM लाइज़न, कमीशनिंग और AMC — ${summary.systemKw} kW सिस्टम के लिए टर्नकी हैंडओवर।`
              : `Bi-directional net meter, DISCOM liaison, commissioning, and AMC — turnkey handover for your ${summary.systemKw} kW system.`}
          </p>
        </div>
      </div>
    </AuroraPageShell>
  );
}
