"use client";

import { BatteryCharging, LayoutGrid, Sun, Zap } from "lucide-react";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraPageShell, AuroraTitle } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

const FLOW_STEPS = [
  { id: "pv", icon: Sun, label: "Solar panels", labelHi: "सोलर पैनल" },
  { id: "inv", icon: Zap, label: "Inverter", labelHi: "इन्वर्टर" },
  { id: "home", icon: BatteryCharging, label: "Your home", labelHi: "आपका घर" },
  { id: "grid", icon: LayoutGrid, label: "Grid / net meter", labelHi: "ग्रिड / नेट मीटर" },
];

export function AuroraTechnicalSummary({ summary, lang }: Props) {
  const isHi = lang === "hi";
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "—";
  const inverterBrand = summary.brands?.inverter ?? "—";
  const roofAreaSqFt = Math.round(summary.systemKw * 100);

  const tiles = [
    { icon: Sun, label: isHi ? "सोलर पैनल" : "Solar panels", value: `${summary.panels}`, sub: `${summary.panelWatt ?? 540}W · ${panelBrand}` },
    { icon: Zap, label: isHi ? "इन्वर्टर" : "Inverter", value: `${summary.systemKw} kW`, sub: `On-grid · ${inverterBrand}` },
    { icon: BatteryCharging, label: isHi ? "वार्षिक उत्पादन" : "Annual generation", value: summary.annualGen.toLocaleString("en-IN"), sub: isHi ? "इकाई/वर्ष" : "units/year" },
    { icon: LayoutGrid, label: isHi ? "छत क्षेत्र" : "Rooftop area", value: `~${roofAreaSqFt}`, sub: isHi ? "वर्ग फुट" : "sq ft approx." },
  ];

  return (
    <AuroraPageShell tone="pearl" className="aurora-technical-summary">
      <AuroraEyebrow>{isHi ? "आपका सिस्टम" : "Your solar system"}</AuroraEyebrow>
      <div className="aurora-kw-hero">
        <p className="aurora-kw-hero-label">{isHi ? "इंस्टॉल क्षमता" : "Installed capacity"}</p>
        <p className="aurora-kw-hero-val">
          {summary.systemKw} <span>kW</span>
        </p>
        <p className="aurora-kw-hero-sub">
          {summary.annualGen.toLocaleString("en-IN")} {isHi ? "इकाई/वर्ष" : "units/yr"} ·{" "}
          {isHi ? "ग्रिड-कनेक्टेड नेट मीटरिंग" : "grid-connected net metering"}
        </p>
      </div>

      <div className="aurora-tile-grid">
        {tiles.map((t) => (
          <div key={t.label} className="aurora-tile">
            <t.icon className="aurora-tile-icon" aria-hidden />
            <p className="aurora-tile-label">{t.label}</p>
            <p className="aurora-tile-value">{t.value}</p>
            <p className="aurora-tile-sub">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="aurora-flow-panel">
        <AuroraTitle className="aurora-flow-title">{isHi ? "यह कैसे काम करता है" : "How it works"}</AuroraTitle>
        <div className="aurora-flow-steps">
          {FLOW_STEPS.map((step, idx) => (
            <div key={step.id} className="aurora-flow-step-wrap">
              <div className={`aurora-flow-step aurora-flow-step--${step.id}`}>
                <step.icon className="h-5 w-5" aria-hidden />
                <span>{isHi ? step.labelHi : step.label}</span>
              </div>
              {idx < FLOW_STEPS.length - 1 ? <span className="aurora-flow-arrow">→</span> : null}
            </div>
          ))}
        </div>
        <p className="aurora-flow-foot">
          {isHi
            ? "अतिरिक्त बिजली ग्रिड में जाती है — नेट मीटर क्रेडिट मिलता है।"
            : "Extra power flows to the grid — you earn net metering credits on your bill."}
        </p>
      </div>
    </AuroraPageShell>
  );
}
