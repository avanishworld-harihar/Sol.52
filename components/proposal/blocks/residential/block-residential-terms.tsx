"use client";

import { Scale } from "lucide-react";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { ProposalJourneySection, ProposalSectionHeader } from "@/components/proposal/proposal-journey";

type Props = {
  lang: ProposalLang;
  installerName?: string;
};

export function BlockResidentialTerms({ lang, installerName }: Props) {
  const isHi = lang === "hi";
  const vendor = installerName?.trim() || (isHi ? "इंस्टॉलर" : "Installer");

  const terms = isHi
    ? [
        "यह प्रस्ताव 30 दिनों के लिए मान्य है जब तक लिखित रूप में बढ़ाया न जाए।",
        "सिस्टम कीमत DISCOM नेट-मीटरिंग और सब्सिडी मंजूरी पर निर्भर कर सकती है।",
        "भुगतान मीलस्टन के अनुसार — अग्रिम, सामग्री, इंस्टॉलेशन और कमीशनिंग।",
        "वारंटी निर्माता और EPC शर्तों के अनुसार लागू होती है।",
        "विस्तृत शर्तें अनुरोध पर उपलब्ध हैं।",
      ]
    : [
        "This proposal is valid for 30 days unless extended in writing.",
        "System price may depend on DISCOM net-metering and subsidy approval.",
        "Payments follow milestones — advance, material, installation, and commissioning.",
        "Warranties apply per manufacturer and EPC terms.",
        "Full terms and conditions are available on request.",
      ];

  return (
    <ProposalJourneySection id="terms" noPad>
      <ProposalSectionHeader
        kicker={isHi ? "अनुलग्नक" : "Appendix"}
        title={isHi ? "नियम और शर्तें" : "Terms & conditions"}
        subtitle={vendor}
        lang={lang}
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-700">
          <Scale className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-wider">{isHi ? "मुख्य बिंदु" : "Key points"}</p>
        </div>
        <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
          {terms.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-sky-600">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </ProposalJourneySection>
  );
}
