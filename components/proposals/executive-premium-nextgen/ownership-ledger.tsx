"use client";

import type { NextgenLedger } from "@/lib/executive-premium-nextgen/types";
import { PP_INK, PP_MUTED, PP_BORDER } from "@/lib/proposal-premium-design";
import { NextgenPageShell } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-page-shell";
import { NextgenHorizontalRule } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-rules";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  ledgerData: NextgenLedger;
};

const ROW_WEIGHT: Record<number, string> = {
  1: "font-normal",
  5: "font-medium",
  10: "font-semibold",
  15: "font-semibold",
  25: "font-bold",
};

export function OwnershipLedger({ ledgerData }: Props) {
  const rows = ledgerData.without_solar.map((w, i) => ({
    year: w.year,
    without: w.cumulative_expenditure_inr,
    with: ledgerData.with_solar[i]?.cumulative_expenditure_inr ?? 0,
  }));

  return (
    <NextgenPageShell className="px-6 py-14 sm:px-16 sm:py-20">
      <div className="mx-auto flex h-full max-w-4xl flex-col justify-center">
        <table className="w-full border-collapse text-left" style={{ color: PP_INK }}>
          <thead>
            <tr>
              <th className="pb-6 pr-4 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: PP_MUTED }}>
                Horizon
              </th>
              <th className="pb-6 pr-4 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: PP_MUTED }}>
                {ledgerData.column_header_left}
              </th>
              <th className="pb-6 text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: PP_MUTED }}>
                {ledgerData.column_header_right}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year} className="border-t" style={{ borderColor: PP_BORDER }}>
                <td className={`py-5 pr-4 text-sm tabular-nums ${ROW_WEIGHT[row.year] ?? "font-normal"}`}>
                  Year {row.year}
                </td>
                <td className={`py-5 pr-4 text-lg tabular-nums sm:text-xl ${ROW_WEIGHT[row.year] ?? "font-normal"}`}>
                  {fmtInr(row.without)}
                </td>
                <td className={`py-5 text-lg tabular-nums sm:text-xl ${ROW_WEIGHT[row.year] ?? "font-normal"}`}>
                  {fmtInr(row.with)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <NextgenHorizontalRule className="my-8" />

        <div className="flex items-baseline justify-between gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: PP_MUTED }}>
            The difference
          </p>
          <p className="text-3xl font-light tabular-nums sm:text-4xl" style={{ color: PP_INK }}>
            {fmtInr(ledgerData.difference_year25_inr)}
          </p>
        </div>

        <p className="mt-16 text-center text-sm leading-relaxed" style={{ color: PP_MUTED }}>
          {ledgerData.closing_statement}
        </p>
      </div>
    </NextgenPageShell>
  );
}
