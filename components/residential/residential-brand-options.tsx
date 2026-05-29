"use client";

import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { addCatalogBrand, ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import type { ResidentialBrandOption, ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { Cpu, Plus, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
};

function toggleBrand(
  list: ResidentialBrandOption[] | undefined,
  option: ResidentialBrandOption,
  max: number
): ResidentialBrandOption[] {
  const cur = list ?? [];
  const key = option.brandId ?? option.brand;
  const exists = cur.some((b) => (b.brandId ?? b.brand) === key);
  if (exists) return cur.filter((b) => (b.brandId ?? b.brand) !== key);
  if (cur.length >= max) return cur;
  return [...cur, option];
}

export function ResidentialBrandOptions({ config, onChange }: Props) {
  const normalized = ensureBrandCatalog(config);
  const catalogBrands = normalized.brandCatalog?.entries ?? [];
  const panelOpts = config.panelBrandOptions ?? [];
  const invOpts = config.inverterBrandOptions ?? [];
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  function patchPanelOptions(next: ResidentialBrandOption[]) {
    const primary = next[0];
    onChange({
      ...config,
      panelBrandOptions: next,
      solar: primary
        ? {
            ...config.solar,
            brand: primary.brand,
            brandId: primary.brandId,
          }
        : config.solar,
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40 dark:bg-sky-950/15">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Sun className="h-4 w-4 text-amber-500" />
          Preferred panel brands (pick 2–3)
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">Pick 2–3 for proposal · any one on site</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {catalogBrands.map((b) => {
            const active = panelOpts.some((p) => (p.brandId ?? p.brand) === b.brandId);
            return (
              <button
                key={b.brandId}
                type="button"
                onClick={() =>
                  patchPanelOptions(toggleBrand(panelOpts, { brandId: b.brandId, brand: b.brand }, 3))
                }
                className={cn(
                  "min-h-10 rounded-full border px-3 py-2 text-xs font-semibold touch-manipulation",
                  active
                    ? "border-sky-500 bg-sky-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5"
                )}
              >
                {b.brand}
              </button>
            );
          })}
          {!addingBrand ? (
            <button
              type="button"
              onClick={() => setAddingBrand(true)}
              className="inline-flex min-h-10 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-600 dark:border-white/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          ) : null}
        </div>
        {addingBrand ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <FloatingLabelInput
              label="New brand"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="h-10 flex-1 rounded-lg text-sm font-semibold"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const name = newBrandName.trim();
                if (name) onChange(addCatalogBrand(normalized, name));
                setNewBrandName("");
                setAddingBrand(false);
              }}
            >
              Add
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddingBrand(false)}>
              Cancel
            </Button>
          </div>
        ) : null}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {panelOpts.map((p, i) => (
            <FloatingLabelInput
              key={`${p.brandId ?? "p"}-${i}`}
              label={`Panel brand ${i + 1}`}
              value={p.brand}
              onChange={(e) => {
                const next = [...panelOpts];
                next[i] = { ...p, brand: e.target.value };
                patchPanelOptions(next);
              }}
              className="h-10 rounded-lg text-sm font-semibold"
            />
          ))}
        </div>
      </div>

      <div>
        <p className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <Cpu className="h-4 w-4 text-indigo-500" />
          Inverter brands (pick 1–2)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Growatt", "Deye", "Solis", "Fronius"].map((name) => {
            const active = invOpts.some((p) => p.brand === name);
            return (
              <button
                key={name}
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    inverterBrandOptions: toggleBrand(invOpts, { brand: name }, 2),
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  active
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5"
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {invOpts.map((p, i) => (
            <FloatingLabelInput
              key={`inv-${i}`}
              label={`Inverter ${i + 1}`}
              value={p.brand}
              onChange={(e) => {
                const next = [...invOpts];
                next[i] = { brand: e.target.value };
                onChange({ ...config, inverterBrandOptions: next });
              }}
              className="h-10 rounded-lg text-sm font-semibold"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
