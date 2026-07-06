"use client";

import type { ProposalDeckSummary, PremiumProposalPptInput } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { AuroraLead, AuroraPageShell, AuroraTitle } from "./aurora-primitives";
import { SldDiagramSvg } from "@/components/proposal/blocks/aurora/svg/sld-diagram";
import { DistanceIllustrationSvg } from "@/components/proposal/blocks/aurora/svg/distance-illustration";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
  pptInput: PremiumProposalPptInput;
};

function recommendedTilt(latDeg: number): number {
  const tilt = Math.round(latDeg - 5);
  return Math.max(10, Math.min(tilt, 30));
}

const FLOW_NODES_EN = [
  { title: "Array", desc: "PV panels" },
  { title: "DC Sys", desc: "Protection" },
  { title: "Inverter", desc: "Smart convert" },
  { title: "AC Sys", desc: "Safety" },
  { title: "Load", desc: "Your home" },
  { title: "Grid", desc: "Net-meter" },
] as const;

const FLOW_NODES_HI = [
  { title: "ऐरे", desc: "सोलर पैनल" },
  { title: "DC", desc: "सुरक्षा" },
  { title: "इन्वर्टर", desc: "DC→AC" },
  { title: "AC", desc: "सुरक्षा" },
  { title: "लोड", desc: "आपका घर" },
  { title: "ग्रिड", desc: "नेट-मीटर" },
] as const;

export function AuroraSystemLayout({ summary, lang, pptInput }: Props) {
  const isHi = lang === "hi";
  const nodes = isHi ? FLOW_NODES_HI : FLOW_NODES_EN;

  const specs = pptInput.residentialTechnicalSpecs;
  const siteLat = specs?.mounting?.siteLat;
  const tiltDeg =
    specs?.mounting?.actualTiltDeg ??
    specs?.mounting?.recommendedTiltDeg ??
    (siteLat ? recommendedTilt(siteLat) : 20);
  const dcRunM = specs?.layout?.dcRunLengthM ?? 15;
  const acRunM = specs?.layout?.acRunLengthM ?? 8;
  const inverterLocation =
    specs?.layout?.inverterLocation ?? (isHi ? "इन्वर्टर रूम / शेड" : "inverter room / shade");

  const panelDesc = isHi
    ? `${summary.panels} पैनल · ${summary.panelWatt ?? 540}W`
    : `${summary.panels} panels · ${summary.panelWatt ?? 540}W`;
  const invDesc = isHi ? `${summary.systemKw} kW ऑन-ग्रिड` : `${summary.systemKw} kW on-grid`;

  const flowNodes = nodes.map((n, i) => {
    if (i === 0) return { ...n, desc: panelDesc };
    if (i === 2) return { ...n, desc: invDesc };
    return n;
  });

  return (
    <AuroraPageShell tone="pearl" className="aurora-system-layout">
      <AuroraTitle className="aurora-flow-page-title">
        {isHi ? "इंजीनियरिंग फ्लो" : "The engineering flow."}
      </AuroraTitle>
      <AuroraLead>
        {isHi
          ? "25 साल की विश्वसनीयता के लिए डिज़ाइन किया गया जुड़ा हुआ सिस्टम।"
          : "A seamless, connected system designed for 25-year reliability."}
      </AuroraLead>

      {/* Connected linear architecture */}
      <div className="aurora-flow-ribbon" role="img" aria-label={isHi ? "बिजली प्रवाह" : "Power flow"}>
        {flowNodes.map((node, i) => (
          <div key={node.title} className="aurora-flow-ribbon-item">
            <div className="aurora-flow-step">
              <div className="aurora-flow-node">
                <span className="aurora-flow-node-title">{node.title}</span>
              </div>
              <p className="aurora-flow-node-desc">{node.desc}</p>
            </div>
            {i < flowNodes.length - 1 ? <div className="aurora-flow-connector" aria-hidden /> : null}
          </div>
        ))}
      </div>

      {/* Tilt + DC run detail cards */}
      <div className="aurora-engine-duo">
        <div className="aurora-engine-duo-card">
          <p className="aurora-engine-duo-title">
            {isHi ? `पैनल झुकाव: ${tiltDeg}°` : `Panel tilt angle: ${tiltDeg}°`}
          </p>
          <p className="aurora-engine-duo-desc">
            {isHi
              ? "अधिकतम सालाना धूप और स्व-सफाई के लिए अनुकूलित।"
              : "Optimized for maximum annual sunlight capture and self-cleaning efficiency."}
          </p>
        </div>
        <div className="aurora-engine-duo-card">
          <p className="aurora-engine-duo-title">
            {isHi ? `DC केबल रन: ~${dcRunM} m` : `DC cable run: ~${dcRunM} m`}
          </p>
          <p className="aurora-engine-duo-desc">
            {isHi
              ? "वोल्टेज ड्रॉप 1% से कम रखने और पीक दक्षता सुनिश्चित करने के लिए आदर्श दूरी।"
              : "Ideal distance to keep voltage drop under 1% and ensure peak efficiency."}
          </p>
          <p className="aurora-engine-duo-meta">
            {isHi ? `इन्वर्टर: ${inverterLocation}` : `Inverter at: ${inverterLocation}`}
          </p>
        </div>
      </div>

      {/* Detailed SLD + distance diagram */}
      <div className="aurora-engine-detail">
        <p className="aurora-engine-detail-label">
          {isHi ? "विस्तृत विद्युत प्रवाह (SLD)" : "Detailed electrical path (SLD)"}
        </p>
        <div className="aurora-engine-detail-sld">
          <SldDiagramSvg lang={lang} systemKw={summary.systemKw} panels={summary.panels} />
        </div>
      </div>

      <div className="aurora-distance-diagram-wrap aurora-distance-diagram-wrap--compact">
        <DistanceIllustrationSvg dcRunM={dcRunM} acRunM={acRunM} lang={lang} />
      </div>
    </AuroraPageShell>
  );
}
