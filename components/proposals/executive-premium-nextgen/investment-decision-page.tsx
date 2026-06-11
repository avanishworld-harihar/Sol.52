"use client";

import type { NextgenInvestment } from "@/lib/executive-premium-nextgen/types";
import { EpCurrency } from "@/components/proposals/executive-premium-nextgen/primitives/ep-currency";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  investmentData: NextgenInvestment;
};

function formatOptionInr(value: number): string {
  return fmtInr(value);
}

function OptionBlock({ option }: { option: NextgenInvestment["options"][number] }) {
  return (
    <div className="ep-investment-option flex flex-1 flex-col min-w-0">
      <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
        {option.option_label}
      </p>
      <dl className="mt-6 w-full space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="ep-caption" style={{ color: "var(--ep-muted)" }}>
            Monthly outflow
          </dt>
          <dd className="ep-body tabular-nums">{formatOptionInr(option.monthly_outflow_inr)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="ep-caption" style={{ color: "var(--ep-muted)" }}>
            Monthly return
          </dt>
          <dd className="ep-body tabular-nums">{formatOptionInr(option.monthly_return_inr)}</dd>
        </div>
        <div
          className="flex items-baseline justify-between gap-4 border-t pt-4"
          style={{ borderColor: "var(--ep-border)" }}
        >
          <dt className="ep-label" style={{ color: "var(--ep-muted)" }}>
            Monthly net
          </dt>
          <dd className="ep-h2 tabular-nums">{formatOptionInr(option.monthly_net_inr)}</dd>
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
    <EpPageFrame
      variant="containedCentre"
      primary={
        <>
          <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
            Net capital commitment
          </p>
          <EpCurrency value={investmentData.net_commitment_inr} tier="display" centered />
        </>
      }
      supporting={
        <div className="w-full">
          <div
            className="flex w-full flex-col sm:flex-row"
            style={{ gap: "var(--ep-space-4)" }}
          >
            <OptionBlock option={optA} />
            <OptionBlock option={optB} />
          </div>
          <p
            className="ep-body text-center"
            style={{
              color: "var(--ep-muted)",
              marginTop: "var(--ep-space-10)",
              maxWidth: "40rem",
              marginInline: "auto",
            }}
          >
            {investmentData.recommendation_text}
          </p>
        </div>
      }
      grounding={
        <div className="w-full">
          <ol className="max-w-xl space-y-3 text-left" style={{ marginInline: "auto" }}>
            {investmentData.next_steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="ep-caption tabular-nums" style={{ color: "var(--ep-muted)" }}>
                  {i + 1}.
                </span>
                <span className="ep-body">{step}</span>
              </li>
            ))}
          </ol>
          <p
            className="ep-caption text-right"
            style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-10)" }}
          >
            {investmentData.validity_statement}
          </p>
        </div>
      }
    />
  );
}
