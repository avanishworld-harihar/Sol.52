"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { residentialAnnualGenerationUnits } from "@/lib/residential-deck-helpers";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle, fmtInr } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

export function AuroraSystemRequirements({ summary, lang, D }: Props) {
  const isHi = lang === "hi";
  const annualGen =
    summary.requirementBased === true
      ? residentialAnnualGenerationUnits(summary.systemKw)
      : summary.annualGen;
  const monthly = Math.round(annualGen / 12);
  const panelWatt = summary.panelWatt ?? 540;
  const panelBrand = summary.panelBrand ?? summary.brands?.panel ?? "—";

  const stats = [
    {
      label: isHi ? "वार्षिक उत्पादन" : "Annual generation",
      value: `${annualGen.toLocaleString("en-IN")} u`,
    },
    {
      label: isHi ? "मासिक औसत" : "Monthly average",
      value: `${monthly} kWh`,
    },
    {
      label: isHi ? "ऊर्जा कवरेज" : "Energy coverage",
      value: `${summary.coverage}%`,
    },
    {
      label: isHi ? "पैनल ब्रांड" : "Panel brand",
      value: panelBrand,
    },
  ];

  const specs = [
    { label: isHi ? "इंस्टॉल क्षमता" : "Installed capacity", value: `${summary.systemKw} kW` },
    { label: D["req.specPanels"], value: `${summary.panels} × ${panelWatt}W` },
    { label: D["req.specInverter"], value: `${summary.systemKw} kW On-Grid` },
    { label: isHi ? "नेट-मीटरिंग" : "Net-metering", value: isHi ? "ग्रिड कनेक्टेड" : "Grid connected" },
  ];

  const commercial = [
    { label: isHi ? "प्लांट कीमत" : "Plant price", value: fmtInr(summary.grossSystemCost) },
    { label: "PM Surya Ghar", value: `−${fmtInr(summary.pmSubsidy)}`, accent: true },
    { label: isHi ? "नेट निवेश" : "Net investment", value: fmtInr(summary.netCost), highlight: true },
    { label: isHi ? "वार्षिक बचत" : "Annual saving", value: fmtInr(summary.annualSaving) },
    { label: isHi ? "पेबैक" : "Payback", value: `${summary.paybackYears.toFixed(1)} yr` },
  ];

  return (
    <AuroraPageShell tone="pearl">
      <AuroraEyebrow>{isHi ? "सिस्टम स्पेसिफिकेशन" : "System specifications"}</AuroraEyebrow>
      <AuroraTitle>{isHi ? "आपकी ज़रूरत के लिए डिज़ाइन" : "System designed for your requirement"}</AuroraTitle>
      <AuroraLead>
        {isHi
          ? "क्षमता, उत्पादन और कवरेज — आपकी ऊर्जा ज़रूरत के आधार पर"
          : "Capacity, generation, and coverage — based on your energy requirement"}
      </AuroraLead>

      <div className="aurora-stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="aurora-stat-card">
            <p className="aurora-stat-label">{s.label}</p>
            <p className="aurora-stat-value">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="aurora-panel aurora-panel--specs">
        <p className="aurora-panel-kicker">{isHi ? "सिस्टम विवरण" : "System specifications"}</p>
        {specs.map((row) => (
          <div key={row.label} className="aurora-spec-row">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>

      <div className="aurora-panel">
        <p className="aurora-panel-kicker">{isHi ? "वाणिज्यिक सारांश" : "Commercial snapshot"}</p>
        {commercial.map((row) => (
          <div
            key={row.label}
            className={`aurora-commercial-row ${row.highlight ? "aurora-commercial-row--highlight" : ""}`}
          >
            <span>{row.label}</span>
            <strong className={row.accent ? "text-[#10B981]" : ""}>{row.value}</strong>
          </div>
        ))}
      </div>
    </AuroraPageShell>
  );
}
