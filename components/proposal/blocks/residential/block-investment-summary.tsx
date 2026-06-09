"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { ProposalJourneySection, ProposalSectionHeader } from "@/components/proposal/proposal-journey";
import { AnimatedINR } from "@/app/(public)/proposal/[id]/proposal-view";
import { BlockSubsidyClarity } from "@/components/proposal/blocks/residential/block-subsidy-clarity";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

export function BlockInvestmentSummary({ summary, lang, D }: Props) {
  const isHi = lang === "hi";

  return (
    <ProposalJourneySection id="investment-summary" className="proposal-investment-summary-stage">
      <ProposalSectionHeader
        step={4}
        kicker={isHi ? "निवेश सारांश" : "Investment summary"}
        title={isHi ? "संख्याएँ आपकी भावना की पुष्टि करती हैं" : "The numbers confirm what you felt"}
        subtitle={
          isHi
            ? "पेबैक, 25-वर्षीय बचत और आपकी वास्तविक निवेश राशि — एक जगह"
            : "Payback, 25-year savings, and your net investment — in one place"
        }
        lang={lang}
      />

      <div className="proposal-financial-hero mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:mb-4">
        <div className="proposal-financial-hero-tile proposal-panel">
          <p className="proposal-hero-ribbon-label">{D["common.payback"]}</p>
          <p className="proposal-hero-ribbon-value">
            {summary.paybackYears.toFixed(1)} {D["emi.years"]}
          </p>
        </div>
        <div className="proposal-financial-hero-tile proposal-financial-hero-tile--saving">
          <p className="proposal-hero-ribbon-label">{D["econ.netSaving"]}</p>
          <p className="proposal-hero-ribbon-value">
            <AnimatedINR value={summary.solarVsGrid.netSaving} />
          </p>
          <p className="proposal-hero-ribbon-hint">25 {D["emi.years"]}</p>
        </div>
        <div className="proposal-financial-hero-tile proposal-panel">
          <p className="proposal-hero-ribbon-label">{D["common.annualSaving"]}</p>
          <p className="proposal-hero-ribbon-value">
            <AnimatedINR value={summary.annualSaving} />
          </p>
          <p className="proposal-hero-ribbon-hint">{D["common.perYr"]}</p>
        </div>
        <div className="proposal-financial-hero-tile proposal-panel">
          <p className="proposal-hero-ribbon-label">{isHi ? "ब्रेक-ईवन वर्ष" : "Breakeven year"}</p>
          <p className="proposal-hero-ribbon-value">
            {Math.ceil(summary.paybackYears)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BlockSubsidyClarity summary={summary} lang={lang} D={D} />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p
            className={`text-xs text-slate-500 ${isHi ? "font-bold tracking-normal" : "font-bold uppercase tracking-[0.18em]"}`}
          >
            {isHi ? "मान्यताएँ" : "Assumptions"}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>
              {isHi
                ? `वार्षिक बिजली खर्च मॉडल: आपके वास्तविक बिल पैटर्न पर आधारित`
                : "Annual bill model based on your actual consumption pattern"}
            </li>
            <li>
              {isHi
                ? "25-वर्षीय बचत में सिस्टम उत्पादन और ग्रिड बचत शामिल है"
                : "25-year savings include system generation and grid offset"}
            </li>
            <li>
              {isHi
                ? "सब्सिडी राशि PM Surya Ghar दिशानिर्देशों के अनुसार अनुमानित है"
                : "Subsidy amount is estimated per PM Surya Ghar guidelines"}
            </li>
          </ul>
        </div>
      </div>
    </ProposalJourneySection>
  );
}
