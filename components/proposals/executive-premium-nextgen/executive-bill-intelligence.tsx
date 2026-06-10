"use client";

import type { NextgenBillIntelligence } from "@/lib/executive-premium-nextgen/types";
import { EpCurrency } from "@/components/proposals/executive-premium-nextgen/primitives/ep-currency";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  billData: NextgenBillIntelligence;
};

const discomLine = (discom: string, state: string) =>
  [discom, state !== "—" ? state : null].filter(Boolean).join(" · ");

/**
 * Executive bill analysis — one dominant exposure figure, editorial evidence below.
 * Reuses bill data only; no bar chart or KPI dashboard layout.
 */
export function ExecutiveBillIntelligence({ billData }: Props) {
  const [i1, i2, i3] = billData.insight_lines;
  const context = discomLine(billData.discom_name, billData.state_name);

  const supportingMetrics: string[] = [
    `Average month — ${fmtInr(billData.average_monthly_spend_inr)}`,
    `Annual units — ${billData.annual_units.toLocaleString("en-IN")}`,
  ];
  if (billData.effective_rate_inr_per_unit != null) {
    supportingMetrics.push(
      `Effective rate — ₹${billData.effective_rate_inr_per_unit.toLocaleString("en-IN")} / unit`
    );
  }
  if (billData.peak_season_pct > 0) {
    supportingMetrics.push(`Peak-season variance — +${billData.peak_season_pct}%`);
  }

  const groundingLine = billData.tariff_context_line ?? i3;

  return (
    <EpPageFrame
      variant="containedCentre"
      primary={
        <>
          <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
            Annual electricity exposure
          </p>
          <EpCurrency value={billData.annual_spend_inr} tier="h1" centered />
          {context ? (
            <p
              className="ep-caption"
              style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-4)" }}
            >
              {context}
            </p>
          ) : null}
        </>
      }
      supporting={
        <div className="w-full max-w-lg text-left">
          <p className="ep-body" style={{ marginBottom: "var(--ep-space-4)" }}>
            {i1}
          </p>
          <p className="ep-body">{i2}</p>
          <div
            className="ep-caption"
            style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-6)" }}
          >
            {supportingMetrics.map((line) => (
              <p key={line} style={{ marginTop: "var(--ep-space-1)" }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      }
      grounding={
        groundingLine ? (
          <p className="ep-caption text-center" style={{ color: "var(--ep-muted)", maxWidth: "28rem" }}>
            {groundingLine}
          </p>
        ) : null
      }
    />
  );
}
