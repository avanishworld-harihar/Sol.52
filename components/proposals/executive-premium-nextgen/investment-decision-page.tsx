"use client";

import type { NextgenInvestment } from "@/lib/executive-premium-nextgen/types";
import { PP_INK, PP_MUTED, PP_BORDER } from "@/lib/proposal-premium-design";
import { NextgenPageShell } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-page-shell";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  investmentData: NextgenInvestment;
};

function OptionBlock({
  option,
  highlighted,
}: {
  option: NextgenInvestment["options"][number];
  highlighted: boolean;
}) {
  return (
    <div
      className="flex flex-1 flex-col rounded-sm border p-6 sm:p-8"
      style={{
        borderColor: highlighted ? PP_INK : PP_BORDER,
        backgroundColor: highlighted ? "rgba(23,23,23,0.02)" : "transparent",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: PP_MUTED }}>
        {option.option_label}
      </p>
      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt style={{ color: PP_MUTED }}>Monthly outflow</dt>
          <dd className="font-medium tabular-nums" style={{ color: PP_INK }}>
            {fmtInr(option.monthly_outflow_inr)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt style={{ color: PP_MUTED }}>Monthly return</dt>
          <dd className="font-medium tabular-nums" style={{ color: PP_INK }}>
            {fmtInr(option.monthly_return_inr)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t pt-4" style={{ borderColor: PP_BORDER }}>
          <dt style={{ color: PP_MUTED }}>Monthly net</dt>
          <dd className="text-lg font-medium tabular-nums" style={{ color: PP_INK }}>
            {fmtInr(option.monthly_net_inr)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt style={{ color: PP_MUTED }}>IRR</dt>
          <dd className="font-medium tabular-nums" style={{ color: PP_INK }}>
            {option.irr_percent.toFixed(1)}%
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function InvestmentDecisionPage({ investmentData }: Props) {
  const [optA, optB] = investmentData.options;
  const recIdx = investmentData.recommended_option === "B" ? 1 : 0;

  return (
    <NextgenPageShell className="px-6 py-12 sm:px-12 sm:py-16">
      <div className="mx-auto flex h-full max-w-5xl flex-col">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: PP_MUTED }}>
            Net capital commitment
          </p>
          <p className="mt-4 text-[clamp(2.25rem,7vw,4rem)] font-light tabular-nums" style={{ color: PP_INK }}>
            {fmtInr(investmentData.net_commitment_inr)}
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-6 sm:flex-row">
          <OptionBlock option={optA} highlighted={recIdx === 0} />
          <OptionBlock option={optB} highlighted={recIdx === 1} />
        </div>

        <p className="mt-12 text-center text-base font-normal leading-relaxed" style={{ color: PP_MUTED }}>
          {investmentData.recommendation_text}
        </p>

        <ol className="mt-12 max-w-xl space-y-3 text-sm" style={{ color: PP_INK }}>
          {investmentData.next_steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="tabular-nums" style={{ color: PP_MUTED }}>
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-auto pt-16 text-right text-[10px]" style={{ color: PP_MUTED }}>
          {investmentData.validity_statement}
        </p>
      </div>
    </NextgenPageShell>
  );
}
