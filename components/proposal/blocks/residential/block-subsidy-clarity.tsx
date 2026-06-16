"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";

function fmtInr(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

export function BlockSubsidyClarity({ summary, lang, D }: Props) {
  const isHi = lang === "hi";
  const subtitle = isHi
    ? "सब्सिडी के बाद — यही राशि आपको भुगतान करनी है"
    : "After PM Surya Ghar subsidy — this is what you pay";

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm sm:p-6">
      <p
        className={`text-xs text-sky-800 ${isHi ? "font-bold tracking-normal" : "font-bold uppercase tracking-[0.18em]"}`}
      >
        {isHi ? "सब्सिडी स्पष्टता" : "Subsidy clarity"}
      </p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-sky-950 sm:text-4xl">
        {fmtInr(summary.netCost)}
      </p>
      <div className="mt-5 space-y-2 border-t border-sky-100 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">{D["commercial.gross"]}</span>
          <span className="font-semibold text-slate-900">{fmtInr(summary.grossSystemCost)}</span>
        </div>
        {summary.phaseSurchargeInr > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">{D["commercial.phaseSurcharge"]}</span>
            <span className="font-semibold text-slate-900">{fmtInr(summary.phaseSurchargeInr)}</span>
          </div>
        ) : null}
        {summary.discountInr > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">{D["commercial.discount"]}</span>
            <span className="font-semibold text-emerald-700">−{fmtInr(summary.discountInr)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">{D["commercial.subsidy"]}</span>
          <span className="font-semibold text-emerald-700">−{fmtInr(summary.pmSubsidy)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-sky-100/80 px-3 py-2">
          <span className="font-bold text-sky-950">{D["commercial.net"]}</span>
          <span className="font-bold text-sky-950">{fmtInr(summary.netCost)}</span>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {isHi
          ? "सब्सिडी DISCOM/सरकारी मंजूरी के अधीन है। अंतिम राशि आवेदन और सत्यापन पर निर्भर करती है।"
          : "Subsidy is subject to DISCOM and government approval. Final amount depends on application and verification."}
      </p>
    </div>
  );
}
