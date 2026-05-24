"use client";

import {
  catalogBrandOptions,
  normalizeBrandCompareSelection,
  type BrandCompareSelection,
} from "@/lib/brand-compare-helpers";
import type { ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";
import { cn } from "@/lib/utils";

type Props = {
  catalog: ResidentialBrandCatalog | null | undefined;
  value: BrandCompareSelection;
  onChange: (next: BrandCompareSelection) => void;
  className?: string;
};

export function BrandCompareConfigFields({ catalog, value, onChange, className }: Props) {
  const options = catalogBrandOptions(catalog);
  const normalized = normalizeBrandCompareSelection(value, catalog);

  if (options.length < 2) {
    return (
      <p className={cn("text-[11px] text-amber-800 dark:text-amber-200", className)}>
        Add at least 2 brands in More → Rate card (Smart catalog) to compare pricing.
      </p>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Brand A
        </label>
        <select
          value={normalized.brandIdA}
          onChange={(e) => {
            const brandIdA = e.target.value;
            let brandIdB = normalized.brandIdB;
            if (brandIdB === brandIdA) {
              brandIdB = options.find((o) => o.brandId !== brandIdA)?.brandId ?? brandIdB;
            }
            onChange({ ...value, brandIdA, brandIdB });
          }}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
        >
          {options.map((o) => (
            <option key={o.brandId} value={o.brandId}>
              {o.brand}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Brand B
        </label>
        <select
          value={normalized.brandIdB}
          onChange={(e) => onChange({ ...value, brandIdB: e.target.value })}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
        >
          {options.map((o) => (
            <option key={o.brandId} value={o.brandId} disabled={o.brandId === normalized.brandIdA}>
              {o.brand}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
