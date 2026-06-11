"use client";

import type { NextgenLedger } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { cn } from "@/lib/utils";
import { EpCurrency } from "@/components/proposals/executive-premium-nextgen/primitives/ep-currency";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { EpPageHeader } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-header";
import { EpTableAmount } from "@/components/proposals/executive-premium-nextgen/primitives/ep-table-amount";

type Props = {
  ledgerData: NextgenLedger;
};

const ROW_TIER: Record<
  number,
  { year: "caption" | "body" | "title" | "h2"; amount: "caption" | "body" | "title" | "h2"; medium?: boolean }
> = {
  1: { year: "caption", amount: "caption" },
  5: { year: "body", amount: "body" },
  10: { year: "body", amount: "body", medium: true },
  15: { year: "title", amount: "title" },
  25: { year: "title", amount: "title", medium: true },
};

const YEAR_CLASS = {
  caption: "ep-caption",
  body: "ep-body",
  title: "ep-title",
  h2: "ep-h2",
} as const;

const COL_RULE = "1px solid rgba(20, 20, 20, 0.2)";

export function OwnershipLedger({ ledgerData }: Props) {
  const rows = ledgerData.without_solar.map((w, i) => ({
    year: w.year,
    without: w.cumulative_expenditure_inr,
    with: ledgerData.with_solar[i]?.cumulative_expenditure_inr ?? 0,
  }));

  return (
    <EpPageFrame variant="contained" contentAlign="start">
      <EpPageHeader title={EP_COPY.ledger.pageTitle} subtitle={EP_COPY.ledger.pageSub} />
      <div className="ep-ledger-page flex w-full flex-col">
        <table className="ep-ledger-table w-full border-collapse">
          <thead>
            <tr>
              <th className="ep-ledger-th ep-ledger-th-year" aria-hidden />
              <th className="ep-ledger-th ep-ledger-th-amount">{ledgerData.column_header_left}</th>
              <th className="ep-ledger-th ep-ledger-th-amount">{ledgerData.column_header_right}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tier = ROW_TIER[row.year] ?? { year: "body" as const, amount: "body" as const };
              return (
                <tr key={row.year} className="ep-ledger-row">
                  <td className="ep-ledger-td ep-ledger-td-year">
                    <span className={cn(YEAR_CLASS[tier.year], "tabular-nums")}>Year {row.year}</span>
                  </td>
                  <td className="ep-ledger-td ep-ledger-td-amount" style={{ borderLeft: COL_RULE }}>
                    <EpTableAmount value={row.without} tier={tier.amount} medium={tier.medium} />
                  </td>
                  <td className="ep-ledger-td ep-ledger-td-amount" style={{ borderLeft: COL_RULE }}>
                    <EpTableAmount value={row.with} tier={tier.amount} medium={tier.medium} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ep-ledger-outcome">
          <div className="ep-ledger-outcome-divider" aria-hidden />
          <div className="flex flex-col items-center text-center">
            <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
              {EP_COPY.ledger.differenceLabel}
            </p>
            <EpCurrency value={ledgerData.difference_year25_inr} tier="h1" centered className="!py-3" />
            <p
              className="ep-body ep-ledger-closing"
              style={{ color: "var(--ep-muted)", maxWidth: "36rem", marginInline: "auto" }}
            >
              {ledgerData.closing_statement}
            </p>
          </div>
        </div>
      </div>
    </EpPageFrame>
  );
}
