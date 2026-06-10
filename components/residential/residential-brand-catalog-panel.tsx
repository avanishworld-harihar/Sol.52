"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput, FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import {
  applyActiveBrandToConfig,
  addCatalogBrand,
  ensureBrandCatalog,
  removeCatalogBrand,
  normalizeKwTierList,
  syncKwTierCanonical,
  syncSolarAndPricingFromEntry,
  syncTrackCompareFromBrand,
  updateCatalogEntry,
  type ResidentialBrandCatalogEntry,
} from "@/lib/residential-brand-catalog";
import { resolvePlantPriceFromConfig } from "@/lib/plant-pricing-resolver";
import type { ResidentialKwTier, ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, IndianRupee, Plus, Sparkles, Sun, Trash2 } from "lucide-react";
import { useMemo } from "react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
};

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function ResidentialBrandCatalogPanel({ config, onChange }: Props) {
  const normalized = useMemo(() => ensureBrandCatalog(config), [config]);
  const catalog = normalized.brandCatalog!;
  const entries = catalog.entries ?? [];
  const activeId = catalog.activeBrandId ?? entries[0]?.brandId;
  const activeEntryRaw = entries.find((e) => e.brandId === activeId) ?? entries[0]!;
  const kwTiers = useMemo(
    () => normalizeKwTierList(activeEntryRaw.kwTiers ?? []),
    [activeEntryRaw.kwTiers]
  );
  const activeEntry = { ...activeEntryRaw, kwTiers };
  const track = normalized.solar.panelTrack ?? "dcr";
  const plantKw = normalized.solar.plantCapacityKw;
  const quote = useMemo(() => resolvePlantPriceFromConfig(normalized), [normalized]);

  function emit(next: ResidentialProposalConfig) {
    const withCatalog = ensureBrandCatalog(next);
    const entry = withCatalog.brandCatalog?.entries?.find(
      (e) => e.brandId === (withCatalog.brandCatalog?.activeBrandId ?? activeEntry.brandId)
    );
    if (entry && withCatalog.brandCatalog?.activeBrandId === entry.brandId) {
      onChange(
        syncSolarAndPricingFromEntry(withCatalog, entry, withCatalog.solar.panelTrack ?? "dcr")
      );
      return;
    }
    onChange(withCatalog);
  }

  function selectBrand(brandId: string) {
    emit(applyActiveBrandToConfig(normalized, brandId));
  }

  function patchActiveEntry(patch: Partial<ResidentialBrandCatalogEntry>) {
    emit(updateCatalogEntry(normalized, activeEntry.brandId, patch));
  }

  function patchActiveTier(index: number, patchTier: Partial<ResidentialKwTier>) {
    const nextTiers = normalizeKwTierList(
      kwTiers.map((t, i) => (i === index ? syncKwTierCanonical({ ...t, ...patchTier }) : t))
    );
    emit(updateCatalogEntry(normalized, activeEntry.brandId, { kwTiers: nextTiers }));
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50/80 via-white to-teal-50/40 dark:border-amber-500/30 dark:from-amber-950/25 dark:via-[#0c1017] dark:to-teal-950/15">
      <div className="border-b border-amber-200/60 bg-slate-900 px-4 py-3.5 text-white dark:border-amber-900/40">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/90">Smart catalog</p>
            <h4 className="text-base font-bold">Panel brands — pricing matrix (kW × DCR × Non-DCR)</h4>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-slate-300">
          kW rows sync across all brands (same sizes, ascending order). DCR / Non-DCR amounts stay per brand.
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Brands</p>
          <div className="flex flex-wrap gap-2">
            {entries.map((e) => {
              const isActive = e.brandId === activeId;
              return (
                <button
                  key={e.brandId}
                  type="button"
                  onClick={() => selectBrand(e.brandId)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-sm font-bold transition-all",
                    isActive
                      ? "border-amber-500 bg-amber-500 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-800 hover:border-amber-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
                  )}
                >
                  {e.brand}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("New panel brand name");
                if (name?.trim()) emit(addCatalogBrand(normalized, name.trim()));
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-white/20 dark:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" /> Add brand
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Sun className="h-5 w-5 shrink-0 text-amber-500" />
              <FloatingLabelInput
                label="Brand name"
                value={activeEntry.brand}
                onChange={(e) => patchActiveEntry({ brand: e.target.value })}
                className="h-11 min-w-[10rem] flex-1 rounded-xl text-sm font-bold"
              />
            </div>
            {entries.length > 1 ? (
              <button
                type="button"
                onClick={() => emit(removeCatalogBrand(normalized, activeEntry.brandId))}
                className="flex h-10 items-center gap-1 rounded-lg border border-rose-200 px-2.5 text-xs font-semibold text-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            ) : null}
          </div>

          <p className="mt-3 rounded-lg bg-slate-50/90 px-3 py-2 text-[11px] text-slate-600 dark:bg-white/[0.03] dark:text-slate-400">
            Active proposal ({plantKw} kW, {track === "dcr" ? "DCR" : "Non-DCR"} quote):{" "}
            <strong className="text-slate-900 dark:text-white">
              {quote.ok ? inr(quote.plantGrossInr) : "—"}
            </strong>
            {!quote.ok && quote.errors[0] ? (
              <span className="mt-1 block text-amber-700 dark:text-amber-300">{quote.errors[0]}</span>
            ) : null}
          </p>

          {(quote.warnings.includes("dcr_price_missing") ||
            quote.warnings.includes("non_dcr_price_missing")) && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {quote.warnings.includes("dcr_price_missing") ? "DCR price missing for this kW. " : ""}
                {quote.warnings.includes("non_dcr_price_missing")
                  ? "Non-DCR price missing for this kW. "
                  : ""}
                Fill both columns before generating proposals.
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              Pricing matrix — {activeEntry.brand}
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              Single source of truth
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-white/10">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">
                  <th className="px-3 py-2">kW</th>
                  <th className="px-3 py-2">DCR plant gross (₹)</th>
                  <th className="px-3 py-2">Non-DCR plant gross (₹)</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {kwTiers.map((tier, idx) => {
                  const isPlantKw = tier.kw === plantKw;
                  return (
                    <tr
                      key={`${tier.kw}-${idx}`}
                      className={cn(
                        "border-b border-slate-100 dark:border-white/5",
                        isPlantKw && "bg-indigo-50/60 dark:bg-indigo-950/20"
                      )}
                    >
                      <td className="px-2 py-1.5">
                        <FloatingLabelNumericInput
                          label="kW"
                          integer
                          value={tier.kw}
                          onValueChange={(n) => patchActiveTier(idx, { kw: n ?? tier.kw })}
                          className="h-9 rounded-lg text-xs font-bold"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <FloatingLabelNumericInput
                          label="DCR ₹"
                          live
                          value={tier.priceInr}
                          onValueChange={(n) =>
                            patchActiveTier(idx, { priceInr: n !== undefined ? Math.max(0, n) : 0 })
                          }
                          className="h-9 rounded-lg text-xs font-bold"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <FloatingLabelNumericInput
                          label="Non-DCR ₹"
                          live
                          value={tier.nonDcrPriceInr ?? 0}
                          onValueChange={(n) =>
                            patchActiveTier(idx, {
                              nonDcrPriceInr: n !== undefined ? Math.max(0, n) : 0,
                            })
                          }
                          className="h-9 rounded-lg text-xs font-bold"
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          disabled={kwTiers.length <= 1}
                          onClick={() =>
                            patchActiveEntry({
                              kwTiers: normalizeKwTierList(kwTiers.filter((_, i) => i !== idx)),
                            })
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                const maxKw = kwTiers.reduce((m, t) => Math.max(m, t.kw), 0);
                patchActiveEntry({
                  kwTiers: normalizeKwTierList([
                    ...kwTiers,
                    { kw: maxKw > 0 ? maxKw + 1 : 11, priceInr: 0, nonDcrPriceInr: 0 },
                  ]),
                });
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add kW row
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => emit(syncTrackCompareFromBrand(normalized, activeEntry.brandId))}
            >
              <BookOpen className="h-3.5 w-3.5" /> Sync to DCR comparison
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
