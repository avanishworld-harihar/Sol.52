"use client";

import type { ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle } from "./aurora-primitives";

type Props = {
  lang: ProposalLang;
};

export function AuroraDocuments({ lang }: Props) {
  const isHi = lang === "hi";

  const items = isHi
    ? [
        { l: "आधार / पहचान", d: "सब्सिडी और DISCOM आवेदन के लिए" },
        { l: "हाल का बिजली बिल", d: "उपभोग सत्यापन" },
        { l: "छत / संपत्ति फ़ोटो", d: "साइट असेसमेंट रिकॉर्ड" },
        { l: "बैंक विवरण", d: "सब्सिडी / भुगतान क्रेडिट" },
        { l: "नेट-मीटर आवेदन", d: "DISCOM के साथ हमारी सहायता से" },
      ]
    : [
        { l: "Aadhaar / ID proof", d: "For subsidy and DISCOM application" },
        { l: "Recent electricity bill", d: "Consumption verification" },
        { l: "Roof / property photos", d: "Site assessment record" },
        { l: "Bank account details", d: "Subsidy / payment credit" },
        { l: "Net-meter application", d: "Filed with DISCOM support from us" },
      ];

  return (
    <AuroraPageShell tone="pearl">
      <AuroraEyebrow>{isHi ? "अनुलग्नक" : "Appendix"}</AuroraEyebrow>
      <AuroraTitle>{isHi ? "ऑनबोर्डिंग के लिए दस्तावेज़" : "Documents for onboarding"}</AuroraTitle>
      <AuroraLead>
        {isHi
          ? "एक संक्षिप्त चेकलिस्ट — निर्णय के बाद, शुरू करने के लिए"
          : "A short checklist — after you decide, to get started"}
      </AuroraLead>

      <div className="aurora-docs-list">
        {items.map((item, i) => (
          <div key={item.l} className="aurora-doc-row">
            <span className="aurora-doc-num">{i + 1}</span>
            <div>
              <p className="aurora-doc-title">{item.l}</p>
              <p className="aurora-doc-desc">{item.d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="aurora-page-spacer" aria-hidden />
    </AuroraPageShell>
  );
}
