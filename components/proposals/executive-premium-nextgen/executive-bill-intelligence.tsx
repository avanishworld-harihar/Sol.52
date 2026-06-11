"use client";

import type { NextgenBillIntelligence } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { EpCurrency } from "@/components/proposals/executive-premium-nextgen/primitives/ep-currency";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { EpPageHeader } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-header";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  billData: NextgenBillIntelligence;
};

const discomLine = (discom: string, state: string) =>
  [discom, state !== "—" ? state : null].filter(Boolean).join(" · ");

function summerFact(pct: number): string {
  if (pct > 0) return `About ${pct}% higher`;
  return "Even across the year";
}

function fixedChargesFact(inr: number): string {
  if (inr > 0) return fmtInr(inr);
  return "Usage-based";
}

export function ExecutiveBillIntelligence({ billData }: Props) {
  const [i1, i2] = billData.insight_lines;
  const context = discomLine(billData.discom_name, billData.state_name);

  const facts = [
    {
      label: EP_COPY.bill.factMonthly,
      value: fmtInr(billData.average_monthly_spend_inr),
      note: "per month on average",
    },
    {
      label: EP_COPY.bill.factFixed,
      value: fixedChargesFact(billData.fixed_charges_annual_inr),
      note: billData.fixed_charges_annual_inr > 0 ? "every year, fixed" : "no separate fixed line",
    },
    {
      label: EP_COPY.bill.factSummer,
      value: summerFact(billData.peak_season_pct),
      note: "in summer months",
    },
  ] as const;

  return (
    <EpPageFrame variant="containedCentre">
      <EpPageHeader title={EP_COPY.bill.pageTitle} centered />
      <div className="ep-bill-page flex w-full flex-col items-center" style={{ gap: "var(--ep-space-6)" }}>
        <div className="flex flex-col items-center text-center">
          <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
            {EP_COPY.bill.heroLabel}
          </p>
          <EpCurrency value={billData.annual_spend_inr} tier="h1" centered />
          {context ? (
            <p className="ep-caption" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
              {context}
            </p>
          ) : null}
        </div>

        <div className="ep-bill-facts w-full">
          {facts.map((fact) => (
            <div key={fact.label} className="ep-bill-fact text-center">
              <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
                {fact.label}
              </p>
              <p className="ep-h2 tabular-nums" style={{ marginTop: "var(--ep-space-2)" }}>
                {fact.value}
              </p>
              <p className="ep-caption" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-1)" }}>
                {fact.note}
              </p>
            </div>
          ))}
        </div>

        <div className="w-full max-w-lg text-center">
          <p className="ep-body">{i1}</p>
          <p className="ep-body" style={{ marginTop: "var(--ep-space-2)" }}>
            {i2}
          </p>
        </div>
      </div>
    </EpPageFrame>
  );
}
