"use client";

import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { RESIDENTIAL_BRAND_PRESETS, type ResidentialBrandOption, type ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { Cpu, Sun } from "lucide-react";

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
  const panelOpts = config.panelBrandOptions ?? [];
  const invOpts = config.inverterBrandOptions ?? [];

  function patchPanelOptions(next: ResidentialBrandOption[]) {
    const primary = next[0] ?? config.solar;
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
        <p className="mt-0.5 text-[11px] text-slate-500">Customer may receive any one of these on site.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RESIDENTIAL_BRAND_PRESETS.map((b) => {
            const active = panelOpts.some((p) => (p.brandId ?? p.brand) === b.brandId);
            return (
              <button
                key={b.brandId}
                type="button"
                onClick={() => patchPanelOptions(toggleBrand(panelOpts, b, 3))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  active
                    ? "border-sky-500 bg-sky-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5"
                )}
              >
                {b.brand}
              </button>
            );
          })}
        </div>
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
