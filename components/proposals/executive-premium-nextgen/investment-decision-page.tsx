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

function OptionBlock({ option }: { option: NextgenInvestment["options"][number] }) {
  return (
    <div className="ep-investment-option flex flex-1 flex-col min-w-0">
      <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
        {option.option_label}
      </p>
      <dl className="mt-4 w-full space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="ep-caption" style={{ color: "var(--ep-muted)" }}>
            {EP_COPY.investment.outflow}
          </dt>
          <dd className="ep-body tabular-nums">{fmtInr(option.monthly_outflow_inr)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="ep-caption" style={{ color: "var(--ep-muted)" }}>
            {EP_COPY.investment.return}
          </dt>
          <dd className="ep-body tabular-nums">{fmtInr(option.monthly_return_inr)}</dd>
        </div>
        <div
          className="flex items-baseline justify-between gap-4 border-t pt-3"
          style={{ borderColor: "var(--ep-border)" }}
        >
          <dt className="ep-label" style={{ color: "var(--ep-muted)" }}>
            {EP_COPY.investment.net}
          </dt>
          <dd className="ep-h2 tabular-nums">{fmtInr(option.monthly_net_inr)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="ep-label" style={{ color: "var(--ep-muted)" }}>
            IRR
          </dt>
          <dd className="ep-h2 tabular-nums">{option.irr_percent.toFixed(1)}%</dd>
        </div>
      </dl>
    </div>
  );
}

export function InvestmentDecisionPage({ investmentData }: Props) {
  const [optA, optB] = investmentData.options;

  return (
    <EpPageFrame variant="contained">
      <EpPageHeader title={EP_COPY.investment.pageTitle} />
      <div className="ep-investment-page flex w-full flex-col" style={{ gap: "var(--ep-space-6)" }}>
        <div className="flex flex-col items-center text-center">
          <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
            {EP_COPY.investment.heroLabel}
          </p>
          <EpCurrency value={investmentData.net_commitment_inr} tier="display" centered className="!py-4" />
        </div>

        <div className="flex w-full flex-col sm:flex-row" style={{ gap: "var(--ep-space-4)" }}>
          <OptionBlock option={optA} />
          <OptionBlock option={optB} />
        </div>

        <p
          className="ep-body text-center"
          style={{ color: "var(--ep-muted)", maxWidth: "40rem", marginInline: "auto" }}
        >
          {investmentData.recommendation_text}
        </p>

        <ol className="max-w-xl space-y-2" style={{ marginInline: "auto", width: "100%" }}>
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
