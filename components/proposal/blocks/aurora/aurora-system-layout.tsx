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
import { ProposalJourneySection } from "@/components/proposal/proposal-journey";
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

/** Returns a readable latitude label like "23.5° N". */
function latLabel(lat: number | undefined): string {
  if (lat !== undefined && lat > 0) return `${lat.toFixed(1)}° N`;
  return "your location";
}

export function AuroraSystemLayout({ summary, lang, D, pptInput }: Props) {
  const isHi = lang === "hi";

  const specs = pptInput.residentialTechnicalSpecs;
  const siteLat = specs?.mounting?.siteLat;
  const tiltDeg = specs?.mounting?.actualTiltDeg ?? specs?.mounting?.recommendedTiltDeg ?? (siteLat ? recommendedTilt(siteLat) : 20);
  const dcRunM = specs?.layout?.dcRunLengthM ?? 15;
  const acRunM = specs?.layout?.acRunLengthM ?? 8;
  const inverterLocation = specs?.layout?.inverterLocation ?? (isHi ? "इन्वर्टर रूम / शेड" : "inverter room / shade");

  return (
    <ProposalJourneySection id="system-layout" className="aurora-system-layout">

      {/* Section header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
          {isHi ? "इंजीनियरिंग डिज़ाइन" : "Engineering design"}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {isHi ? "आपका सिस्टम कैसे डिज़ाइन किया गया है" : "How your system is designed"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isHi
            ? "तीन ज़रूरी सवालों के जवाब — बिजली का प्रवाह, पैनल का झुकाव, और तार की दूरी।"
            : "Three questions answered — how electricity flows, why panels tilt, and why cable length matters."}
        </p>
      </div>

      {/* ── 1. SLD Electrical Flow ─────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-400">
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

      {/* ── 2. Panel Tilt ────────────────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-500">
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

      {/* ── 3. DC Run Distance ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-500">
          {isHi ? "3. पैनल से इन्वर्टर की दूरी" : "3. Panel-to-inverter distance"}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex-1">
            <p className="text-sm text-slate-700">
              {isHi
                ? `DC केबल की लंबाई कम रखना ज़रूरी है — इससे वोल्टेज ड्रॉप कम होता है, ऊर्जा हानि घटती है, और केबल खर्च बचता है। आपके सिस्टम में DC रन ~${dcRunM} m और AC रन ~${acRunM} m है।`
                : `Keeping the DC cable short reduces voltage drop, energy loss, and cable cost. Your system has a DC run of ~${dcRunM} m and AC run of ~${acRunM} m. Inverter placed at: ${inverterLocation}.`}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: isHi ? "DC रन" : "DC run", value: `~${dcRunM} m`, color: "text-sky-600 font-bold" },
                { label: isHi ? "AC रन" : "AC run", value: `~${acRunM} m`, color: "text-slate-600 font-semibold" },
              ].map((r) => (
                <div key={r.label} className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-center">
                  <p className="text-[10px] text-slate-400">{r.label}</p>
                  <p className={`text-base ${r.color}`}>{r.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-[11px] text-slate-400">
              {isHi
                ? "अनुशंसित अधिकतम DC रन: 30 m। आदर्श: 5–15 m।"
                : "Recommended max DC run: 30 m. Ideal: 5–15 m."}
            </p>
          </div>
          <div className="flex-shrink-0">
            <DistanceIllustrationSvg dcRunM={dcRunM} acRunM={acRunM} />
          </div>
        </div>
      </div>
    </ProposalJourneySection>
  );
}
