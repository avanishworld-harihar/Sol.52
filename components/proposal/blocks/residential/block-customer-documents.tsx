"use client";

import { FileCheck } from "lucide-react";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { ProposalJourneySection, ProposalSectionHeader } from "@/components/proposal/proposal-journey";

type Props = {
  lang: ProposalLang;
};

export function BlockCustomerDocuments({ lang }: Props) {
  const isHi = lang === "hi";

  const items = isHi
    ? [
        { l: "आधार / पहचान", d: "सब्सिडी और DISCOM आवेदन के लिए" },
        { l: "हाल का बिजली बिल", d: "उपभोग सत्यापन" },
        { l: "छत / संपत्ति फ़ोटो", d: "साइट असेसमेंट रिकॉर्ड" },
        { l: "बैंक विवरण", d: "सब्सिडी / भुगतान क्रेडिट" },
        { l: "नेट-मीटर आवेदन फॉर्म", d: "DISCOM के साथ हमारी सहायता से" },
      ]
    : [
        { l: "Aadhaar / ID proof", d: "For subsidy and DISCOM application" },
        { l: "Recent electricity bill", d: "Consumption verification" },
        { l: "Roof / property photos", d: "Site assessment record" },
        { l: "Bank account details", d: "Subsidy / payment credit" },
        { l: "Net-meter application", d: "Filed with DISCOM support from us" },
      ];

  return (
    <ProposalJourneySection id="customer-documents" noPad>
      <ProposalSectionHeader
        kicker={isHi ? "अनुलग्नक" : "Appendix"}
        title={isHi ? "आवश्यक दस्तावेज़" : "Documents for onboarding"}
        subtitle={
          isHi
            ? "एक संक्षिप्त चेकलिस्ट — निर्णय के बाद, शुरू करने के लिए"
            : "A short checklist — after you decide, to get started"
        }
        lang={lang}
      />
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div
            key={item.l}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{item.l}</p>
              <p className="text-xs text-slate-600">{item.d}</p>
            </div>
            <FileCheck className="ml-auto h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          </div>
        ))}
      </div>
    </ProposalJourneySection>
  );
}
