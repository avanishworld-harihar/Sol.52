"use client";

import { ShieldCheck, Sun, Zap } from "lucide-react";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { ProposalJourneySection, ProposalSectionHeader } from "@/components/proposal/proposal-journey";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

export function BlockTechnicalSummary({ summary, lang, D }: Props) {
  const isHi = lang === "hi";
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "—";
  const inverterBrand = summary.brands?.inverter ?? "—";

  const components = [
    {
      icon: Sun,
      title: isHi ? "सोलर पैनल" : "Solar panels",
      spec: `${summary.panels} × ${summary.panelWatt ?? 540}W`,
      signal: panelBrand,
      iconClass: "text-sky-600",
      signalClass: "text-sky-700",
    },
    {
      icon: Zap,
      title: isHi ? "इन्वर्टर" : "Inverter",
      spec: `${summary.systemKw} kW on-grid`,
      signal: inverterBrand,
      iconClass: "text-violet-600",
      signalClass: "text-violet-700",
    },
    {
      icon: ShieldCheck,
      title: isHi ? "माउंटिंग" : "Mounting structure",
      spec: isHi ? "GI रेल्स, छत-अनुकूल" : "GI rails, roof-safe design",
      signal: isHi ? "25 वर्ष डिज़ाइन लाइफ" : "25-year design life",
      iconClass: "text-emerald-600",
      signalClass: "text-emerald-700",
    },
  ];

  return (
    <ProposalJourneySection id="technical-bom" className="proposal-technical-summary-stage">
      <ProposalSectionHeader
        step={5}
        kicker={D["slide.technical.kicker"]}
        title={isHi ? "यह सिस्टम आपकी छत के लिए तैयार है" : "Built for your roof"}
        subtitle={
          isHi
            ? "तीन मुख्य घटक — गुणवत्ता संकेतों के साथ, बिना अतिरिक्त शोर"
            : "Three core components — one quality signal each, no datasheet overload"
        }
        lang={lang}
      />

      <div className="mb-6 rounded-2xl bg-slate-900 px-6 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
          {isHi ? "सिस्टम क्षमता" : "System capacity"}
        </p>
        <p className="mt-2 text-4xl font-bold tracking-tight">{summary.systemKw} kW</p>
        <p className="mt-1 text-sm text-slate-300">
          {summary.annualGen.toLocaleString("en-IN")} {isHi ? "इकाई/वर्ष अनुमानित उत्पादन" : "units/yr estimated generation"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {components.map((c) => (
          <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <c.icon className={`mb-3 h-6 w-6 ${c.iconClass}`} />
            <p className="text-sm font-bold text-slate-900">{c.title}</p>
            <p className="mt-1 text-xs text-slate-600">{c.spec}</p>
            <p className={`mt-3 text-xs font-semibold ${c.signalClass}`}>{c.signal}</p>
          </div>
        ))}
      </div>
    </ProposalJourneySection>
  );
}
