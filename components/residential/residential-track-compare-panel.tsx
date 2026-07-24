"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import {
  ensureBrandCatalog,
  getCatalogEntry,
  resolveCompareTierFromCatalog,
  syncTrackCompareFromBrand,
  trackCompareTiersFromCatalogEntry,
} from "@/lib/residential-brand-catalog";
import {
  defaultResidentialTrackCompareTiers,
  normalizeResidentialTrackCompare,
} from "@/lib/residential-track-compare";
import type {
  ResidentialProposalConfig,
  ResidentialTrackCompare,
} from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye, EyeOff, Plus, Scale, Trash2 } from "lucide-react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  className?: string;
};

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function ResidentialTrackComparePanel({ config, onChange, className }: Props) {
  const base = ensureBrandCatalog(config);
  const catalog = base.brandCatalog!;
  const catalogEntries = catalog.entries ?? [];
  const compare = normalizeResidentialTrackCompare(base.trackCompare, base);
  const compareBrandId =
    compare.compareBrandId?.trim() ||
    catalog.activeBrandId ||
    catalogEntries[0]?.brandId ||
    "";
  const compareEntry = getCatalogEntry(catalog, compareBrandId);
  const tiers = compare.tiers;

  function emit(next: ResidentialProposalConfig) {
    onChange(ensureBrandCatalog(next));
  }

  function patchCompare(patch: Partial<ResidentialTrackCompare>) {
    emit({
      ...base,
      trackCompare: normalizeResidentialTrackCompare({ ...compare, ...patch }, base),
    });
  }

  function setCompareBrand(brandId: string) {
    emit(syncTrackCompareFromBrand(base, brandId));
  }

  function updateTierKw(index: number, kw: number) {
    const resolved = resolveCompareTierFromCatalog(
      compareEntry,
      kw,
      tiers[index]?.visible !== false
    );
    patchCompare({
      tiers: tiers.map((t, i) => (i === index ? resolved : t)),
    });
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return;
    patchCompare({ tiers: tiers.filter((_, i) => i !== index) });
  }

  function addTier() {
    const lastKw = tiers[tiers.length - 1]?.kw ?? base.solar.plantCapacityKw ?? 8;
    const nextKw = Math.min(10000, lastKw + Math.max(2, Math.round(lastKw * 0.1)));
    const seeded =
      defaultResidentialTrackCompareTiers([nextKw], base)[0] ??
      resolveCompareTierFromCatalog(compareEntry, nextKw);
    patchCompare({ tiers: [...tiers, seeded] });
  }

  function toggleTierVisible(index: number) {
    const tier = tiers[index];
    if (!tier) return;
    patchCompare({
      tiers: tiers.map((t, i) => (i === index ? { ...t, visible: tier.visible === false } : t)),
    });
  }

  function seedFromCatalogKws() {
    if (!compareEntry) return;
    patchCompare({ tiers: trackCompareTiersFromCatalogEntry(compareEntry) });
  }

  return (
    <details
      open={compare.enabled}
      className={cn(
        "group rounded-2xl border border-amber-200/80 bg-amber-50/20 dark:border-amber-500/25 dark:bg-amber-950/10",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Scale className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            DCR vs Non-DCR comparison
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Enter kW only — DCR & Non-DCR ₹ come from Smart catalog (More → Rate card).
          </p>
        </div>
        <label
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={compare.enabled}
            onChange={(e) => patchCompare({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show on proposal
        </label>
      </summary>

      <div className="space-y-3 border-t border-amber-200/60 px-4 pb-4 pt-3 dark:border-amber-500/20">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Catalog brand
            </label>
            <select
              value={compareBrandId}
              onChange={(e) => setCompareBrand(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
            >
              {catalogEntries.map((e) => (
                <option key={e.brandId} value={e.brandId}>
                  {e.brand}
                </option>
              ))}
            </select>
          </div>
          {compareEntry?.kwTiers?.length ? (
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={seedFromCatalogKws}>
              Use all catalog kW rows
            </Button>
          ) : null}
        </div>

        {compareEntry ? (
          <p className="text-[11px] font-medium text-amber-900/90 dark:text-amber-100/80">
            {compareEntry.brand} — rates auto-filled from Smart catalog for each kW you enter.
          </p>
        ) : null}

        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={compare.showPolicyNote}
            onChange={(e) => patchCompare({ showPolicyNote: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Include government policy note (31 May 2026)
        </label>

        <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#0c1017]">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                <th className="w-28 px-3 py-2.5">kW</th>
                <th className="px-3 py-2.5">Non-DCR (catalog)</th>
                <th className="px-3 py-2.5">DCR (catalog)</th>
                <th className="w-16 px-2 py-2.5 text-center">Web</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, idx) => (
                <tr
                  key={`${tier.kw}-${idx}`}
                  className={cn(
                    "border-b border-slate-50 dark:border-white/5",
                    tier.visible === false && "opacity-55"
                  )}
                >
                  <td className="px-2 py-1.5">
                    <FloatingLabelNumericInput
                      label="kW"
                      live
                      value={tier.kw}
                      onValueChange={(n) => updateTierKw(idx, n ?? tier.kw)}
                      className="h-9 rounded-lg text-xs font-bold"
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {tier.nonDcrGrossInr > 0 ? inr(tier.nonDcrGrossInr) : "—"}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {tier.dcrGrossInr > 0 ? inr(tier.dcrGrossInr) : "—"}
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      title={tier.visible === false ? "Show on web proposal" : "Hide on web proposal"}
                      onClick={() => toggleTierVisible(idx)}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                        tier.visible === false
                          ? "border-slate-200 text-slate-400"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      )}
                    >
                      {tier.visible === false ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                  <td className="px-1 py-1.5">
                    <button
                      type="button"
                      disabled={tiers.length <= 1}
                      onClick={() => removeTier(idx)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={addTier}>
          <Plus className="h-3.5 w-3.5" /> Add kW row
        </Button>
      </div>
    </details>
  );
}
