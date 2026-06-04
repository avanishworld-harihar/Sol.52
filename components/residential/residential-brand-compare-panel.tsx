"use client";

import { BrandCompareConfigFields } from "@/components/shared/brand-compare-config-fields";
import {
  normalizeBrandCompareSelection,
  resolveBrandCompareSnapshot,
} from "@/lib/brand-compare-helpers";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import type {
  ResidentialBrandCompare,
  ResidentialProposalConfig,
} from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { ChevronDown, GitCompare } from "lucide-react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  className?: string;
  /** Commercial — show DCR rate-card prices only. */
  dcrOnly?: boolean;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function ResidentialBrandComparePanel({ config, onChange, className, dcrOnly = false }: Props) {
  const base = ensureBrandCatalog(config);
  const catalog = base.brandCatalog;
  const raw = base.brandCompare ?? { enabled: false };
  const selection = normalizeBrandCompareSelection(raw, catalog);
  const snapshot = resolveBrandCompareSnapshot(
    catalog,
    selection.brandIdA,
    selection.brandIdB,
    base.solar.plantCapacityKw
  );

  function patchCompare(patch: Partial<ResidentialBrandCompare>) {
    onChange({
      ...base,
      brandCompare: { ...raw, ...patch },
    });
  }

  return (
    <details
      open={selection.enabled}
      className={cn(
        "group rounded-2xl border border-indigo-200/80 bg-indigo-50/20 dark:border-indigo-500/25 dark:bg-indigo-950/10",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <GitCompare className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
            Brand comparison (2 brands)
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {dcrOnly
              ? "Pick two brands — plant gross (₹) from More → Rate card (DCR)."
              : "Pick two panel brands — DCR & Non-DCR ₹ come from each brand's Smart catalog table."}
          </p>
        </div>
        <label
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selection.enabled}
            onChange={(e) => patchCompare({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show on proposal
        </label>
      </summary>

      <div className="space-y-3 border-t border-indigo-200/60 px-4 pb-4 pt-3 dark:border-indigo-500/20">
        <BrandCompareConfigFields
          catalog={catalog}
          value={selection}
          onChange={(next) =>
            patchCompare({
              enabled: selection.enabled,
              brandIdA: next.brandIdA,
              brandIdB: next.brandIdB,
            })
          }
        />

        {snapshot ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#0c1017]">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">
                  <th className="px-3 py-2">Track</th>
                  <th className="px-3 py-2">{snapshot.brandA.brandLabel}</th>
                  <th className="px-3 py-2">{snapshot.brandB.brandLabel}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-3 py-2 text-xs font-bold text-slate-600">DCR @ {snapshot.kw} kW</td>
                  <td className="px-3 py-2 text-xs font-bold tabular-nums">
                    {snapshot.brandA.dcrOk ? inr(snapshot.brandA.dcrGrossInr) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs font-bold tabular-nums">
                    {snapshot.brandB.dcrOk ? inr(snapshot.brandB.dcrGrossInr) : "—"}
                  </td>
                </tr>
                {!dcrOnly ? (
                  <tr>
                    <td className="px-3 py-2 text-xs font-bold text-slate-600">Non-DCR @ {snapshot.kw} kW</td>
                    <td className="px-3 py-2 text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                      {snapshot.brandA.nonDcrOk ? inr(snapshot.brandA.nonDcrGrossInr) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                      {snapshot.brandB.nonDcrOk ? inr(snapshot.brandB.nonDcrGrossInr) : "—"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </details>
  );
}
