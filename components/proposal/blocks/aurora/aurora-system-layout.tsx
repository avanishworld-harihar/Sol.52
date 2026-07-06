"use client";

/**
 * AuroraSystemLayout — Page 5 of the Aurora preset.
 * The signature differentiator block.
 *
 * Three sections on one page:
 *   1. Electrical flow (SLD): PV array → DC cable → DCDB → Inverter → ACDB → Net Meter → Grid
 *   2. Panel tilt guide: why tilt matters, recommended angle for site latitude
 *   3. DC run length guide: why short cable runs matter, recommended max distance
 *
 * Uses inline SVG illustrations — no external images needed.
 * Data sourced from pptInput.residentialTechnicalSpecs (optional) with safe fallbacks.
 */

import type { ProposalDeckSummary, PremiumProposalPptInput } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle } from "./aurora-primitives";
import { SldDiagramSvg } from "@/components/proposal/blocks/aurora/svg/sld-diagram";
import { TiltIllustrationSvg } from "@/components/proposal/blocks/aurora/svg/tilt-illustration";
import { DistanceIllustrationSvg } from "@/components/proposal/blocks/aurora/svg/distance-illustration";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
  pptInput: PremiumProposalPptInput;
};

/** Rough latitude → recommended tilt mapping for Indian cities. */
function recommendedTilt(latDeg: number): number {
  // Rule of thumb: tilt ≈ latitude − 5° for most of India
  const tilt = Math.round(latDeg - 5);
  return Math.max(10, Math.min(tilt, 30));
}

export function AuroraSystemLayout({ summary, lang, pptInput }: Props) {
  const isHi = lang === "hi";

  const specs = pptInput.residentialTechnicalSpecs;
  const siteLat = specs?.mounting?.siteLat;
  const tiltDeg = specs?.mounting?.actualTiltDeg ?? specs?.mounting?.recommendedTiltDeg ?? (siteLat ? recommendedTilt(siteLat) : 20);
  const dcRunM = specs?.layout?.dcRunLengthM ?? 15;
  const acRunM = specs?.layout?.acRunLengthM ?? 8;
  const inverterLocation = specs?.layout?.inverterLocation ?? (isHi ? "इन्वर्टर रूम / शेड" : "inverter room / shade");

  return (
    <AuroraPageShell tone="pearl" className="aurora-system-layout">
      <AuroraEyebrow>{isHi ? "इंजीनियरिंग डिज़ाइन" : "Engineering design"}</AuroraEyebrow>
      <AuroraTitle>{isHi ? "आपका सिस्टम कैसे डिज़ाइन किया गया है" : "How your system is designed"}</AuroraTitle>
      <AuroraLead>
        {isHi
          ? "तीन ज़रूरी सवालों के जवाब — बिजली का प्रवाह, पैनल का झुकाव, और तार की दूरी।"
          : "Three questions answered — how electricity flows, why panels tilt, and why cable length matters."}
      </AuroraLead>

      <div className="aurora-engine-block aurora-engine-block--indigo">
        <p className="aurora-engine-kicker">
          {isHi ? "1. बिजली का प्रवाह (SLD)" : "1. Electrical flow (SLD)"}
        </p>
        <p className="mb-4 text-sm text-slate-600">
          {isHi
            ? "सूरज की रोशनी → DC बिजली → DCDB (DC सुरक्षा) → इन्वर्टर (DC को AC में बदलता है) → ACDB (AC सुरक्षा) → नेट मीटर → आपका घर + ग्रिड।"
            : "Sunlight → DC power → DCDB (DC protection) → Inverter (converts DC to AC) → ACDB (AC protection) → Net meter → your home + grid."}
        </p>
        <div className="overflow-x-auto">
          <SldDiagramSvg lang={lang} systemKw={summary.systemKw} panels={summary.panels} />
        </div>
      </div>

      <div className="aurora-engine-block aurora-engine-block--amber">
        <p className="aurora-engine-kicker">
          {isHi ? "2. पैनल का झुकाव" : "2. Panel tilt angle"}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex-1">
            <p className="text-sm text-slate-700">
        {isHi
            ? `आपकी लोकेशन के लिए अनुशंसित झुकाव ${tiltDeg}° है। सही झुकाव से अधिकतम धूप मिलती है, पानी साफ होता है, और हवा का दबाव कम रहता है।`
            : `For your location, the recommended tilt is ${tiltDeg}°. The right tilt maximises sunlight capture, helps rainwater clean the panels, and reduces wind load.`}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: isHi ? "आपका झुकाव" : "Your tilt", value: `${tiltDeg}°`, color: "text-amber-600 font-extrabold" },
                { label: isHi ? "अनुशंसित" : "Recommended", value: `lat − 5°`, color: "text-slate-700 font-semibold" },
                { label: isHi ? "फ्लैट छत" : "Flat roof", value: "10–15°", color: "text-slate-500" },
              ].map((r) => (
                <div key={r.label} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-center">
                  <p className="text-[10px] text-slate-400">{r.label}</p>
                  <p className={`text-base ${r.color}`}>{r.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <TiltIllustrationSvg tiltDeg={tiltDeg} />
          </div>
        </div>
      </div>

      <div className="aurora-engine-block aurora-engine-block--sky aurora-distance-block">
        <p className="aurora-engine-kicker">
          {isHi ? "3. पैनल से इन्वर्टर की दूरी" : "3. Panel-to-inverter distance"}
        </p>
        <p className="aurora-distance-lead">
          {isHi
            ? `DC केबल छोटी रखें — वोल्टेज ड्रॉप, ऊर्जा हानि और लागत कम होती है। इन्वर्टर: ${inverterLocation}।`
            : `Keep the DC cable short — less voltage drop, energy loss, and cost. Inverter at: ${inverterLocation}.`}
        </p>

        <div className="aurora-distance-metrics">
          <div className="aurora-distance-metric aurora-distance-metric--dc">
            <p className="aurora-distance-metric-label">{isHi ? "DC रन" : "DC run"}</p>
            <p className="aurora-distance-metric-val">~{dcRunM} m</p>
            <p className="aurora-distance-metric-hint">{isHi ? "पैनल → इन्वर्टर" : "Panel → inverter"}</p>
          </div>
          <div className="aurora-distance-metric">
            <p className="aurora-distance-metric-label">{isHi ? "AC रन" : "AC run"}</p>
            <p className="aurora-distance-metric-val">~{acRunM} m</p>
            <p className="aurora-distance-metric-hint">{isHi ? "इन्वर्टर → मीटर" : "Inverter → meter"}</p>
          </div>
        </div>

        <div className="aurora-distance-diagram-wrap">
          <DistanceIllustrationSvg dcRunM={dcRunM} acRunM={acRunM} lang={lang} />
        </div>

        <p className="aurora-distance-foot">
          {isHi
            ? "लंबी DC केबल = अधिक वोल्टेज ड्रॉप। इन्वर्टर को पैनल के नज़दीक रखना सबसे अच्छा।"
            : "Longer DC cable = more voltage drop. Placing the inverter close to the array is best practice."}
        </p>
      </div>
    </AuroraPageShell>
  );
}
