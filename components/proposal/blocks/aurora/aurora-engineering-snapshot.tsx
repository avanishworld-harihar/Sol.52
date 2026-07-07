"use client";

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import {
  computeResidentialEngineeringMetrics,
  RESIDENTIAL_ENGINEERING_STANDARDS,
  RESIDENTIAL_INSTALL_PHASES_EN,
  RESIDENTIAL_INSTALL_PHASES_HI,
} from "@/lib/proposal-engineering-metrics";
import { TiltIllustrationSvg } from "@/components/proposal/blocks/aurora/svg/tilt-illustration";
import { AuroraPageShell } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  pptInput: PremiumProposalPptInput;
};

export function AuroraEngineeringSnapshot({ summary, lang, pptInput }: Props) {
  const isHi = lang === "hi";
  const specs = pptInput.residentialTechnicalSpecs;
  const metrics = computeResidentialEngineeringMetrics(summary, {
    location: pptInput.location,
    state: pptInput.state,
    siteLat: specs?.mounting?.siteLat,
  });
  const tiltDeg = specs?.mounting?.actualTiltDeg ?? metrics.tiltDeg;
  const tiltNote = specs?.mounting?.tiltRationale ?? metrics.tiltRationale;
  const phases = isHi ? RESIDENTIAL_INSTALL_PHASES_HI : RESIDENTIAL_INSTALL_PHASES_EN;

  const rows = [
    {
      label: isHi ? "DC क्षमता (STC)" : "DC capacity (STC)",
      value: `${metrics.dcCapacityKwp.toFixed(2)} kWp`,
      highlight: true,
    },
    {
      label: isHi ? "AC क्षमता (इन्वर्टर)" : "AC capacity (inverter)",
      value: `${metrics.acCapacityKw} kW`,
    },
    { label: "DC/AC ratio", value: `${metrics.dcAcRatio}` },
    {
      label: isHi ? "पीक सन आवर्स" : "Peak sun hours",
      value: isHi ? `${metrics.peakSunHours} घंटे/दिन (भारत औसत)` : `${metrics.peakSunHours} hrs/day (India avg)`,
    },
    {
      label: isHi ? "प्रदर्शन अनुपात (PR)" : "Performance ratio (PR)",
      value: `${metrics.performanceRatioPct}%`,
    },
    {
      label: isHi ? "विशिष्ट उत्पादन" : "Specific yield",
      value: `${metrics.specificYieldKwhPerKwp} kWh/kWp/yr`,
      highlight: true,
    },
    {
      label: isHi ? "वार्षिक उत्पादन" : "Annual generation",
      value: `${metrics.annualGenUnits.toLocaleString("en-IN")} ${isHi ? "यूनिट" : "units"}`,
    },
    {
      label: isHi ? "लोड कवरेज" : "Load coverage",
      value: `${metrics.loadCoveragePct}%`,
    },
    {
      label: isHi ? "मॉड्यूल" : "Modules",
      value: `${metrics.panelCount} × ${metrics.panelWatt} Wp`,
    },
    {
      label: isHi ? "साइट अक्षांश" : "Site latitude",
      value: `${metrics.siteLat.toFixed(1)}°N · ${metrics.cityLabel}`,
    },
  ];

  return (
    <AuroraPageShell tone="pearl" className="aurora-engineering-page">
      <span className="aurora-section-tag">
        {isHi ? "इंजीनियरिंग आधार" : "Engineering basis"}
      </span>
      <h2 className="aurora-bom-title">
        {isHi ? "डिज़ाइन और प्रदर्शन" : "Design & performance"}
      </h2>
      <p className="aurora-eng-lead">
        {isHi
          ? "आपके घर के सिस्टम के लिए इंजीनियरिंग पैरामीटर — साइट लोकेशन और भारतीय मानकों के अनुरूप।"
          : "Engineering parameters for your home system — aligned to site location and Indian standards."}
      </p>

      <div className="aurora-eng-grid">
        <div className="aurora-eng-metrics">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`aurora-eng-metric-row${row.highlight ? " aurora-eng-metric-row--hi" : ""}`}
            >
              <span className="aurora-eng-metric-label">{row.label}</span>
              <span className="aurora-eng-metric-value">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="aurora-eng-tilt-card">
          <p className="aurora-eng-tilt-title">
            {isHi ? `पैनल टिल्ट — ${metrics.cityLabel}` : `Panel tilt — ${metrics.cityLabel}`}
          </p>
          <TiltIllustrationSvg tiltDeg={tiltDeg} />
          <p className="aurora-eng-tilt-val">{tiltDeg}°</p>
          <p className="aurora-eng-tilt-note">{tiltNote}</p>
          {specs?.layout ? (
            <p className="aurora-eng-tilt-sub">
              DC run {specs.layout.dcRunLengthM} m · AC run {specs.layout.acRunLengthM} m · VD{" "}
              {specs.layout.voltageDropDcPct}%
            </p>
          ) : null}
        </div>
      </div>

      <div className="aurora-eng-standards">
        <p className="aurora-eng-standards-title">
          {isHi ? "मानक अनुपालन" : "Standards compliance"}
        </p>
        <div className="aurora-eng-standards-chips">
          {RESIDENTIAL_ENGINEERING_STANDARDS.map((s) => (
            <span key={s} className="aurora-eng-chip">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="aurora-eng-phases">
        <p className="aurora-eng-phases-title">
          {isHi ? "इंस्टॉलेशन प्रक्रिया" : "Installation process"}
        </p>
        <div className="aurora-eng-phase-grid">
          {phases.map((p) => (
            <div key={p.num} className="aurora-eng-phase">
              <span className="aurora-eng-phase-num">{p.num}</span>
              <p className="aurora-eng-phase-title">{p.title}</p>
              <p className="aurora-eng-phase-detail">{p.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </AuroraPageShell>
  );
}
