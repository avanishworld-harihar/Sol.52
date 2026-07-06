"use client";

/**
 * AuroraSubsidyClarity — Aurora optional block.
 *
 * Explains the PM Surya Ghar subsidy clearly:
 *   • Gross system cost
 *   • PM Surya Ghar subsidy (central)
 *   • Net cost after subsidy
 *   • Eligibility checklist
 *   • How to claim (brief steps)
 *
 * All numbers sourced from ProposalDeckSummary — same data that drives
 * all commercial pages, so figures are always in sync.
 */

import { BadgeCheck, CheckCircle2, IndianRupee, Info, Minus } from "lucide-react";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalDict, ProposalLang } from "@/lib/proposal-i18n";
import { ProposalJourneySection } from "@/components/proposal/proposal-journey";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  D: ProposalDict;
};

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function AuroraSubsidyClarity({ summary, lang, D }: Props) {
  const isHi = lang === "hi";

  const gross = summary.grossSystemCost ?? 0;
  const subsidy = summary.pmSubsidy ?? 0;
  const net = gross > 0 ? Math.max(0, gross - subsidy) : summary.netCost ?? 0;

  const eligibility = [
    isHi ? "घर के मालिक (किरायेदार पात्र नहीं)" : "Home owner (tenants not eligible)",
    isHi ? "1 kW से 10 kW तक का सिस्टम" : "System size: 1 kW to 10 kW",
    isHi ? "ग्रिड-कनेक्टेड ऑन-ग्रिड सिस्टम" : "Grid-connected on-grid system only",
    isHi ? "DISCOM-अनुमोदित इंस्टॉलर" : "DISCOM-approved installer",
    isHi ? "पहले से सौर नहीं होना चाहिए" : "No existing solar on the premises",
  ];

  const steps = [
    isHi ? "DISCOM में आवेदन करें (pmsuryaghar.gov.in)" : "Apply on pmsuryaghar.gov.in or DISCOM portal",
    isHi ? "इंस्टॉलेशन के बाद DISCOM निरीक्षण" : "DISCOM inspection after installation",
    isHi ? "नेट मीटर लगवाएं" : "Net meter commissioning",
    isHi ? "सब्सिडी सीधे बैंक खाते में" : "Subsidy credited directly to bank account",
  ];

  return (
    <ProposalJourneySection id="subsidy" className="aurora-subsidy-clarity">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          {isHi ? "सरकारी सब्सिडी" : "Government subsidy"}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {isHi ? "PM सूर्य घर: आपको कितनी सब्सिडी मिलती है?" : "PM Surya Ghar: what subsidy do you get?"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isHi
            ? "केंद्र सरकार की योजना — सीधे आपके बैंक खाते में, इंस्टॉलेशन के बाद।"
            : "Central government scheme — credited directly to your bank account after installation."}
        </p>
      </div>

      {/* Cost breakdown */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <IndianRupee className="h-5 w-5 text-slate-400" />
          <p className="font-semibold text-slate-700">
            {isHi ? "लागत और सब्सिडी" : "Cost & subsidy breakdown"}
          </p>
        </div>

        <div className="divide-y divide-slate-50">
          {/* Gross */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-sm text-slate-600">{isHi ? "सिस्टम की कुल लागत" : "Gross system cost"}</span>
            <span className="text-sm font-bold text-slate-900">{gross > 0 ? fmt(gross) : "—"}</span>
          </div>

          {/* Subsidy */}
          <div className="flex items-center justify-between bg-emerald-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                {isHi ? "PM सूर्य घर सब्सिडी" : "PM Surya Ghar subsidy"}
              </span>
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm font-bold text-emerald-700">{subsidy > 0 ? fmt(subsidy) : "—"}</span>
          </div>

          {/* Net */}
          <div className="flex items-center justify-between bg-indigo-50 px-5 py-4">
            <span className="text-base font-bold text-indigo-700">
              {isHi ? "आपकी नेट लागत" : "Your net cost"}
            </span>
            <span className="text-xl font-extrabold text-indigo-700">{net > 0 ? fmt(net) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Eligibility checklist */}
      <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-500">
          {isHi ? "पात्रता मानदंड" : "Eligibility"}
        </p>
        <ul className="space-y-2">
          {eligibility.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-500" />
              <span className="text-sm text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* How to claim */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          {isHi ? "दावा कैसे करें" : "How to claim"}
        </p>
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                {i + 1}
              </span>
              <span className="text-sm text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-[11px] text-amber-700">
            {isHi
              ? "सब्सिडी राशि समय-समय पर बदलती है। नवीनतम दरों के लिए pmsuryaghar.gov.in देखें।"
              : "Subsidy amounts are updated periodically. Check pmsuryaghar.gov.in for the latest rates."}
          </p>
        </div>
      </div>
    </ProposalJourneySection>
  );
}
