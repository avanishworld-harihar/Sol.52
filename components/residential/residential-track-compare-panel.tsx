"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import {
  defaultResidentialTrackCompareTiers,
  normalizeResidentialTrackCompare,
} from "@/lib/residential-track-compare";
import type {
  ResidentialProposalConfig,
  ResidentialTrackCompare,
  ResidentialTrackCompareTier,
} from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { Plus, Scale, Trash2 } from "lucide-react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  className?: string;
};

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Scale className="h-4 w-4 text-slate-500" aria-hidden />
        {title}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function ResidentialTrackComparePanel({ config, onChange, className }: Props) {
  const compare = normalizeResidentialTrackCompare(config.trackCompare);
  const tiers = compare.tiers;

  function patchCompare(patch: Partial<ResidentialTrackCompare>) {
    onChange({
      ...config,
      trackCompare: normalizeResidentialTrackCompare({ ...compare, ...patch }),
    });
  }

  function updateTier(index: number, patch: Partial<ResidentialTrackCompareTier>) {
    patchCompare({
      tiers: tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    });
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return;
    patchCompare({ tiers: tiers.filter((_, i) => i !== index) });
  }

  function addTier() {
    if (tiers.length >= 4) return;
    const lastKw = tiers[tiers.length - 1]?.kw ?? 8;
    const nextKw = Math.min(100, lastKw + 2);
    const seeded = defaultResidentialTrackCompareTiers([nextKw])[0];
    patchCompare({ tiers: [...tiers, seeded] });
  }

  function resetDefaults() {
    patchCompare({ tiers: defaultResidentialTrackCompareTiers([8, 10]) });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 dark:border-amber-500/25 dark:bg-amber-950/10",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          title="DCR vs Non-DCR comparison"
          hint="Same kW in both columns — shown on web proposal when enabled. Non-DCR window closes after 31 May 2026."
        />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
          <input
            type="checkbox"
            checked={compare.enabled}
            onChange={(e) => patchCompare({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show on web proposal
        </label>
      </div>

      {!compare.enabled ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Off — customers will not see the comparison table. Turn on to explain Non-DCR vs DCR pricing before
          the 31 May 2026 rule change.
        </p>
      ) : (
        <>
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={compare.showPolicyNote}
              onChange={(e) => patchCompare({ showPolicyNote: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            Include government policy note (31 May 2026)
          </label>

          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#0c1017]">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="px-3 py-2.5 w-24">kW</th>
                  <th className="px-3 py-2.5">Non-DCR gross (₹)</th>
                  <th className="px-3 py-2.5">DCR gross (₹)</th>
                  <th className="px-3 py-2.5 w-20">Δ</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => {
                  const delta = Math.max(0, t.dcrGrossInr - t.nonDcrGrossInr);
                  const isPlant = t.kw === config.solar.plantCapacityKw;
                  return (
                    <tr
                      key={`${t.kw}-${i}`}
                      className={cn(
                        "border-t border-slate-100 dark:border-white/10",
                        isPlant && "bg-indigo-50/50 dark:bg-indigo-500/10"
                      )}
                    >
                      <td className="px-3 py-2">
                        <FloatingLabelNumericInput
                          label="kW"
                          value={t.kw}
                          onValueChange={(n) => updateTier(i, { kw: n ?? t.kw })}
                          className="h-9 rounded-lg text-sm font-bold tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <FloatingLabelNumericInput
                          label="Non-DCR"
                          value={t.nonDcrGrossInr}
                          onValueChange={(n) => updateTier(i, { nonDcrGrossInr: n ?? 0 })}
                          className="h-9 rounded-lg text-sm font-semibold tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <FloatingLabelNumericInput
                          label="DCR"
                          value={t.dcrGrossInr}
                          onValueChange={(n) => updateTier(i, { dcrGrossInr: n ?? 0 })}
                          className="h-9 rounded-lg text-sm font-semibold tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2 text-xs font-medium tabular-nums text-amber-800 dark:text-amber-300">
                        +{inr(delta)}
                      </td>
                      <td className="px-1 py-2">
                        <button
                          type="button"
                          disabled={tiers.length <= 1}
                          onClick={() => removeTier(i)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30 dark:hover:bg-white/10"
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addTier} disabled={tiers.length >= 4}>
              <Plus className="h-3.5 w-3.5" />
              Add kW row
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetDefaults}>
              Reset 8 &amp; 10 kW
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Edit the same kW values for both tracks so the comparison stays fair. Row matching your plant size (
            {config.solar.plantCapacityKw} kW) is highlighted on the web proposal.
          </p>
        </>
      )}
    </div>
  );
}
