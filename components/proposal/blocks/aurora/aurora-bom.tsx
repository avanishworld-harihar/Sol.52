"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { AuroraPageShell } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
};

export function AuroraBom({ summary, lang }: Props) {
  const isHi = lang === "hi";
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "Tier-1";

  return (
    <AuroraPageShell tone="pearl" className="aurora-bom-page aurora-bom-page--zenith">
      <span className="aurora-section-tag">
        {isHi ? "तकनीकी सूची" : "Technical inventory"}
      </span>
      <h2 className="aurora-bom-title">
        {isHi ? "Tier-1 कंपोनेंट और स्पेक" : "Tier-1 components & specs"}
      </h2>

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
            {summary.bom.map((item) => (
              <tr key={item.slot}>
                <td className="aurora-bom-comp">{item.title}</td>
                <td className="aurora-bom-spec">{item.spec}</td>
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
              ? `${panelBrand} पैनल उद्योग-अग्रणी degradation दर और पीक आउटपुट सुनिश्चित करते हैं।`
              : `${panelBrand} panels ensure industry-leading degradation rates and peak power output.`}
          </p>
        </div>
        <div className="aurora-outcome-card">
          <p className="aurora-outcome-title">
            {isHi ? "प्रदर्शन मानक" : "Performance standards"}
          </p>
          <p className="aurora-outcome-desc">
            {isHi
              ? "SPD और कॉपर अर्थिंग सहित सभी सुरक्षा प्रोटोकॉल अंतर्राष्ट्रीय TUV मानकों के अनुरूप हैं।"
              : "All safety protocols including SPD and copper earthing meet international TUV standards."}
          </p>
        </div>
      </div>
    </AuroraPageShell>
  );
}
