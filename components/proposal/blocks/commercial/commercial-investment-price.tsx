"use client";

/**
 * Subtle plant price breakdown — not for confidential cover.
 * Compact row: gross · subsidy · net · ₹/kW.
 */

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { fmtInr } from "./commercial-shared";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
};

export function CommercialInvestmentSummary({ summary, lang }: Props) {
  const isHi = lang === "hi";
  const gross = summary.grossSystemCost;
  const phaseSurcharge = summary.phaseSurchargeInr;
  const discount = summary.discountInr;
  const subsidy = summary.pmSubsidy;
  const net = summary.netCost;
  const hasSubsidy = subsidy > 0;
  const hasPhaseSurcharge = phaseSurcharge > 0;
  const hasDiscount = discount > 0;
  const perKw = summary.systemKw > 0 ? Math.round(net / summary.systemKw) : 0;

  return (
    <div className="commercial-investment-summary border-b border-slate-100 bg-slate-50/70 px-6 py-3 md:px-10">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {isHi ? "निवेश" : "Investment"}
        </span>
        {hasSubsidy || hasPhaseSurcharge || hasDiscount ? (
          <>
            <span className="text-slate-600">
              <span className="text-[11px] text-slate-400">{isHi ? "प्लांट" : "Plant"}</span>{" "}
              <span className="font-semibold tabular-nums text-slate-800">{fmtInr(gross)}</span>
            </span>
            {hasPhaseSurcharge ? (
              <span className="text-slate-600">
                <span className="text-[11px] text-slate-400">{isHi ? "3-फेज" : "3-phase"}</span>{" "}
                <span className="font-semibold tabular-nums text-slate-800">{fmtInr(phaseSurcharge)}</span>
              </span>
            ) : null}
            {hasDiscount ? (
              <span className="text-slate-600">
                <span className="text-[11px] text-slate-400">{isHi ? "छूट" : "Discount"}</span>{" "}
                <span className="font-semibold tabular-nums text-emerald-700">−{fmtInr(discount)}</span>
              </span>
            ) : null}
            {hasSubsidy ? (
            <span className="text-slate-600">
              <span className="text-[11px] text-slate-400">{isHi ? "सब्सिडी" : "Subsidy"}</span>{" "}
              <span className="font-semibold tabular-nums text-emerald-700">−{fmtInr(subsidy)}</span>
            </span>
            ) : null}
          </>
        ) : null}
        <span className="text-slate-700">
          <span className="text-[11px] text-slate-400">{isHi ? "शुद्ध" : "Net"}</span>{" "}
          <span className="font-bold tabular-nums text-slate-900">{fmtInr(net)}</span>
        </span>
        <span className="text-[11px] tabular-nums text-slate-400">
          {fmtInr(perKw)}/kW · {isHi ? "GST सहित" : "incl. GST"}
        </span>
      </div>
    </div>
  );
}
