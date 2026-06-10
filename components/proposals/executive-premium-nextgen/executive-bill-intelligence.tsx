"use client";

import type { NextgenBillIntelligence } from "@/lib/executive-premium-nextgen/types";
import { PP_ACCENT, PP_INK, PP_MUTED, PP_BORDER } from "@/lib/proposal-premium-design";
import { NextgenPageShell } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-page-shell";
import { NextgenHorizontalRule } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-rules";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  billData: NextgenBillIntelligence;
};

/** Executive visual treatment — uses audit data only; not the legacy Bill Intelligence UI. */
export function ExecutiveBillIntelligence({ billData }: Props) {
  const maxNet = Math.max(...billData.monthly_pattern.map((m) => m.net_inr), 1);
  const [i1, i2, i3] = billData.insight_lines;

  return (
    <NextgenPageShell className="px-6 py-12 sm:px-14 sm:py-16">
      <div className="mx-auto flex h-full max-w-5xl flex-col">
        <header className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PP_MUTED }}>
            Consumption intelligence
          </p>
          <p className="mt-3 text-sm" style={{ color: PP_MUTED }}>
            {billData.discom_name}
            {billData.state_name !== "—" ? ` · ${billData.state_name}` : ""}
          </p>
        </header>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: PP_MUTED }}>
              Annual spend
            </p>
            <p className="mt-2 text-4xl font-light tabular-nums sm:text-5xl" style={{ color: PP_INK }}>
              {fmtInr(billData.annual_spend_inr)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: PP_MUTED }}>
              Average month
            </p>
            <p className="mt-2 text-3xl font-light tabular-nums" style={{ color: PP_INK }}>
              {fmtInr(billData.average_monthly_spend_inr)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: PP_MUTED }}>
              Annual units
            </p>
            <p className="mt-2 text-3xl font-light tabular-nums" style={{ color: PP_INK }}>
              {billData.annual_units.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-14">
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: PP_MUTED }}>
            Monthly rhythm
          </p>
          <div className="flex items-end justify-between gap-1 sm:gap-2" style={{ height: "9rem" }}>
            {billData.monthly_pattern.map((m) => {
              const h = Math.max(8, Math.round((m.net_inr / maxNet) * 100));
              return (
                <div key={m.month_label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[2.25rem] transition-all"
                    style={{
                      height: `${h}%`,
                      backgroundColor: m.is_peak_season ? PP_INK : PP_ACCENT,
                      opacity: m.is_peak_season ? 1 : 0.35,
                    }}
                    title={`${m.month_label}: ${fmtInr(m.net_inr)}`}
                  />
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: PP_MUTED }}>
                    {m.month_label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <NextgenHorizontalRule className="my-12" />

        <div className="grid gap-8 sm:grid-cols-2">
          <ul className="space-y-4 text-sm leading-relaxed" style={{ color: PP_INK }}>
            <li>{i1}</li>
            <li>{i2}</li>
            <li>{i3}</li>
          </ul>
          <div className="space-y-4 border-l pl-8" style={{ borderColor: PP_BORDER }}>
            {billData.effective_rate_inr_per_unit != null ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: PP_MUTED }}>
                  Effective rate
                </p>
                <p className="mt-1 text-xl font-light tabular-nums" style={{ color: PP_INK }}>
                  ₹{billData.effective_rate_inr_per_unit.toLocaleString("en-IN")}
                  <span className="text-sm" style={{ color: PP_MUTED }}>
                    {" "}
                    / unit
                  </span>
                </p>
              </div>
            ) : null}
            {billData.peak_season_pct > 0 ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: PP_MUTED }}>
                  Peak-season variance
                </p>
                <p className="mt-1 text-xl font-light tabular-nums" style={{ color: PP_INK }}>
                  +{billData.peak_season_pct}%
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {billData.tariff_context_line ? (
          <p
            className="mt-auto pt-12 text-xs leading-relaxed"
            style={{ color: PP_MUTED }}
          >
            {billData.tariff_context_line}
          </p>
        ) : null}
      </div>
    </NextgenPageShell>
  );
}
