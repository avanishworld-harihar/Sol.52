"use client";

/**
 * AuroraTechnicalSummary — Page 4 of the Aurora preset.
 *
 * Shows:
 *   • Large kW hero banner (indigo-to-amber gradient)
 *   • 4 stat tiles: panels, inverter, annual generation, rooftop area
 *   • On-grid net-metering mini flow: PV → Inverter → Home → Grid
 *
 * Replaces the simpler 3-card BlockTechnicalSummary used by Sales Premium.
 */

import { BatteryCharging, LayoutGrid, Sun, Zap } from "lucide-react";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { ProposalJourneySection } from "@/components/proposal/proposal-journey";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

const FLOW_STEPS = [
  { id: "pv", icon: Sun, label: "Solar panels", labelHi: "सोलर पैनल", color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
  { id: "inv", icon: Zap, label: "Inverter", labelHi: "इन्वर्टर", color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-200" },
  { id: "home", icon: BatteryCharging, label: "Your home", labelHi: "आपका घर", color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
  { id: "grid", icon: LayoutGrid, label: "Grid / net meter", labelHi: "ग्रिड / नेट मीटर", color: "text-sky-500", bg: "bg-sky-50 border-sky-200" },
];

export function AuroraTechnicalSummary({ summary, lang, D }: Props) {
  const isHi = lang === "hi";
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "—";
  const inverterBrand = summary.brands?.inverter ?? "—";
  // ~100 sq ft per kW (rough residential thumb)
  const roofAreaSqFt = Math.round(summary.systemKw * 100);

  const tiles = [
    {
      icon: Sun,
      label: isHi ? "सोलर पैनल" : "Solar panels",
      value: `${summary.panels}`,
      sub: `${summary.panelWatt ?? 540}W each · ${panelBrand}`,
      accent: "border-amber-200 bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      icon: Zap,
      label: isHi ? "इन्वर्टर" : "Inverter",
      value: `${summary.systemKw} kW`,
      sub: `On-grid string · ${inverterBrand}`,
      accent: "border-indigo-200 bg-indigo-50",
      iconColor: "text-indigo-500",
    },
    {
      icon: BatteryCharging,
      label: isHi ? "सालाना उत्पादन" : "Annual generation",
      value: summary.annualGen.toLocaleString("en-IN"),
      sub: isHi ? "इकाई / वर्ष अनुमानित" : "units/year estimated",
      accent: "border-emerald-200 bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      icon: LayoutGrid,
      label: isHi ? "छत क्षेत्र (अनुमान)" : "Rooftop area (est.)",
      value: `~${roofAreaSqFt}`,
      sub: isHi ? "वर्ग फुट लगभग आवश्यक" : "sq ft approx. required",
      accent: "border-sky-200 bg-sky-50",
      iconColor: "text-sky-500",
    },
  ];

  return (
    <ProposalJourneySection id="technical-summary" className="aurora-technical-summary">

      {/* kW hero */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#3730a3] to-[#f59e0b] p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
          {isHi ? "आपका सिस्टम" : "Your solar system"}
        </p>
        <p className="mt-3 text-5xl font-extrabold tracking-tight sm:text-6xl">
          {summary.systemKw} <span className="text-3xl font-semibold sm:text-4xl">kW</span>
        </p>
        <p className="mt-2 text-base font-medium text-white/80">
          {isHi
            ? `${summary.annualGen.toLocaleString("en-IN")} इकाई/वर्ष · ग्रिड-कनेक्टेड नेट मीटरिंग`
            : `${summary.annualGen.toLocaleString("en-IN")} units/yr · grid-connected net metering`}
        </p>
      </div>

      {/* 4 stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`flex flex-col rounded-2xl border p-4 ${t.accent}`}
          >
            <t.icon className={`mb-2 h-5 w-5 ${t.iconColor}`} />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t.label}
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">{t.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* On-grid flow diagram */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          {isHi ? "यह कैसे काम करता है" : "How it works"}
        </p>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {FLOW_STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className={`flex flex-col items-center rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${step.bg} min-w-[72px] sm:min-w-[88px]`}>
                <step.icon className={`mb-1.5 h-5 w-5 sm:h-6 sm:w-6 ${step.color}`} />
                <p className="text-center text-[10px] font-semibold leading-tight text-slate-700 sm:text-xs">
                  {isHi ? step.labelHi : step.label}
                </p>
              </div>
              {idx < FLOW_STEPS.length - 1 && (
                <span className="text-slate-300 font-bold text-lg select-none">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          {isHi
            ? "अतिरिक्त बिजली ग्रिड में जाती है और आपको नेट मीटर क्रेडिट मिलता है।"
            : "Extra power flows to the grid — you earn net metering credits on your bill."}
        </p>
      </div>
    </ProposalJourneySection>
  );
}
