"use client";

import type { NextgenInvestment } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { EpCurrency } from "@/components/proposals/executive-premium-nextgen/primitives/ep-currency";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { EpPageHeader } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-header";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  investmentData: NextgenInvestment;
};

function EditorialOption({
  option,
  recommended,
}: {
  option: NextgenInvestment["options"][number];
  recommended: boolean;
}) {
  return (
    <div className={recommended ? "ep-investment-editorial-col ep-investment-editorial-col--lead" : "ep-investment-editorial-col"}>
      <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
        {option.option_label}
        {recommended ? (
          <span className="ep-investment-rec-mark" style={{ marginLeft: "var(--ep-space-1)" }}>
            · {EP_COPY.investment.recommended}
          </span>
        ) : null}
      </p>
      <p className="ep-caption" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
        {EP_COPY.investment.monthlyOutcome}
      </p>
      <EpCurrency value={option.monthly_net_inr} tier="h1" className="!py-3" />
      <p className="ep-body" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
        {EP_COPY.investment.savingsLine(fmtInr(option.monthly_return_inr))}
        {option.monthly_outflow_inr > 0
          ? ` · ${EP_COPY.investment.paymentLine(fmtInr(option.monthly_outflow_inr))}`
          : ` · ${EP_COPY.investment.noPaymentLine}`}
      </p>
      <p className="ep-caption tabular-nums" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
        IRR {option.irr_percent.toFixed(1)}%
      </p>
    </div>
  );
}

export function InvestmentDecisionPage({ investmentData }: Props) {
  const [optA, optB] = investmentData.options;
  const recIsB = investmentData.recommended_option === "B";

  return (
    <EpPageFrame variant="contained" contentAlign="start">
      <EpPageHeader title={EP_COPY.investment.pageTitle} />
      <div className="ep-investment-page flex w-full flex-col" style={{ gap: "var(--ep-space-6)" }}>
        <div className="text-left">
          <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
            {EP_COPY.investment.heroLabel}
          </p>
          <EpCurrency value={investmentData.net_commitment_inr} tier="display" className="!py-2" />
        </div>

        <div className="ep-investment-editorial w-full">
          <EditorialOption option={optA} recommended={!recIsB} />
          <EditorialOption option={optB} recommended={recIsB} />
        </div>

        <p className="ep-body ep-investment-recommendation" style={{ color: "var(--ep-muted)" }}>
          {investmentData.recommendation_text}
        </p>

        <ol className="ep-investment-steps max-w-xl space-y-2">
          {investmentData.next_steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="ep-caption tabular-nums" style={{ color: "var(--ep-muted)" }}>
                {i + 1}.
              </span>
              <span className="ep-body">{step}</span>
            </li>
          ))}
        </ol>

        <p className="ep-caption text-right" style={{ color: "var(--ep-muted)" }}>
          {investmentData.validity_statement}
        </p>
      </div>
    </EpPageFrame>
  );
}
