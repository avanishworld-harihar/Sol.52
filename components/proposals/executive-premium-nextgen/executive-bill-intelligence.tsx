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

export function ExecutiveBillIntelligence({ billData }: Props) {
  const [i1, i2] = billData.insight_lines;
  const context = discomLine(billData.discom_name, billData.state_name);

  const supportingMetrics: string[] = [
    `Average month — ${fmtInr(billData.average_monthly_spend_inr)}`,
    `Total units per year — ${billData.annual_units.toLocaleString("en-IN")}`,
  ];
  if (billData.effective_rate_inr_per_unit != null) {
    supportingMetrics.push(
      `Average rate — ₹${billData.effective_rate_inr_per_unit.toLocaleString("en-IN")} per unit`
    );
  }
  if (billData.peak_season_pct > 0) {
    supportingMetrics.push(`Summer months — about ${billData.peak_season_pct}% higher than average`);
  }

  return (
    <EpPageFrame variant="containedCentre">
      <EpPageHeader title={EP_COPY.bill.pageTitle} centered />
      <div
        className="ep-page-beats flex w-full flex-col items-center"
        style={{ gap: "var(--ep-space-6)" }}
      >
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

        <div className="w-full max-w-lg text-center">
          <p className="ep-body" style={{ marginBottom: "var(--ep-space-3)" }}>
            {i1}
          </p>
          <p className="ep-body">{i2}</p>
          <div
            className="ep-caption"
            style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-4)" }}
          >
            {supportingMetrics.map((line) => (
              <p key={line} style={{ marginTop: "var(--ep-space-1)" }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </EpPageFrame>
  );
}
