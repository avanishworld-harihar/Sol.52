"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import { DEFAULT_PANEL_TECHNOLOGY, PANEL_TECHNOLOGY_OPTIONS } from "@/lib/commercial-panel-catalog";
import {
  defaultResidentialKwTiers,
  type ResidentialKwTier,
  type ResidentialProposalConfig,
} from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { IndianRupee, Layers, Percent, Plus, Trash2, Zap } from "lucide-react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  className?: string;
};

export function ResidentialKwPricingSettings({ config, onChange, className }: Props) {
  const pricing = config.pricing ?? {
    kwTiers: defaultResidentialKwTiers(),
    panelTechnology: config.solar.technology ?? DEFAULT_PANEL_TECHNOLOGY,
    wireBrand: "polycab" as const,
    discount: { enabled: false, type: "percent" as const, value: 0 },
  };
  const tiers = pricing.kwTiers ?? defaultResidentialKwTiers();
  const discount = pricing.discount ?? { enabled: false, type: "percent" as const, value: 0 };

  function patchPricing(partial: Partial<NonNullable<ResidentialProposalConfig["pricing"]>>) {
    onChange({
      ...config,
      pricing: { ...pricing, ...partial },
    });
  }

  function updateTier(index: number, patch: Partial<ResidentialKwTier>) {
    const next = tiers.map((t, i) => (i === index ? { ...t, ...patch } : t));
    patchPricing({ kwTiers: next });
  }

  function addTier() {
    const maxKw = tiers.reduce((m, t) => Math.max(m, t.kw), 0);
    patchPricing({
      kwTiers: [...tiers, { kw: maxKw > 0 ? maxKw + 1 : 11, priceInr: 0, nonDcrPriceInr: 0 }],
    });
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return;
    patchPricing({ kwTiers: tiers.filter((_, i) => i !== index) });
  }

  return (
    <section
      className={cn(
        "space-y-4 rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-slate-50/80 p-4 shadow-sm dark:border-violet-900/40 dark:from-violet-950/25 dark:via-[#0f1419] dark:to-slate-950/20",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow">
          <IndianRupee className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">
            Residential pricing
          </p>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">kW-wise system rates</h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Rates here drive the web proposal net cost for requirement-based residential jobs.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <FloatingLabelSelectTechnology
          value={pricing.panelTechnology ?? config.solar.technology ?? ""}
          onChange={(panelTechnology) => {
            patchPricing({ panelTechnology });
            onChange({
              ...config,
              pricing: { ...pricing, panelTechnology },
              solar: { ...config.solar, technology: panelTechnology || config.solar.technology },
            });
          }}
        />
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">DC/AC wire brand</p>
          <div className="flex gap-2">
            {(["polycab", "havells"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => patchPricing({ wireBrand: w })}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-xs font-bold capitalize transition",
                  (pricing.wireBrand ?? "polycab") === w
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5"
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-200">System price by kW</p>
        <ul className="space-y-2">
          {tiers.map((tier, idx) => (
            <li
              key={`${tier.kw}-${idx}`}
              className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-xl border border-slate-200/80 bg-white/90 p-2 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <FloatingLabelNumericInput
                label="kW"
                integer
                value={tier.kw}
                onValueChange={(n) => updateTier(idx, { kw: n ?? tier.kw })}
                className="h-10 rounded-lg text-sm font-bold"
              />
              <FloatingLabelNumericInput
                label="Price (₹)"
                value={tier.priceInr}
                onValueChange={(n) => updateTier(idx, { priceInr: n ?? tier.priceInr })}
                className="h-10 rounded-lg text-sm font-bold"
              />
              <button
                type="button"
                title="Remove tier"
                disabled={tiers.length <= 1}
                onClick={() => removeTier(idx)}
                className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" size="sm" className="mt-2 gap-1 text-xs font-semibold" onClick={addTier}>
          <Plus className="h-3.5 w-3.5" />
          Add kW tier
        </Button>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-100">
            <Percent className="h-4 w-4" />
            Customer discount
          </span>
          <input
            type="checkbox"
            checked={discount.enabled}
            onChange={(e) =>
              patchPricing({
                discount: { ...discount, enabled: e.target.checked },
              })
            }
            className="h-4 w-4 rounded accent-amber-600"
          />
        </label>
        {discount.enabled ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select
              value={discount.type}
              onChange={(e) =>
                patchPricing({
                  discount: {
                    ...discount,
                    type: e.target.value as "percent" | "fixed_inr",
                  },
                })
              }
              className="h-10 rounded-lg border border-amber-200 bg-white px-2 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
            >
              <option value="percent">Percent %</option>
              <option value="fixed_inr">Fixed ₹</option>
            </select>
            <FloatingLabelNumericInput
              label={discount.type === "percent" ? "Discount %" : "Discount ₹"}
              value={discount.value}
              onValueChange={(n) =>
                patchPricing({
                  discount: { ...discount, value: n ?? 0 },
                })
              }
              className="h-10 rounded-lg text-sm font-bold"
            />
          </div>
        ) : null}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Zap className="h-3 w-3 text-violet-500" />
        Generation rule: 1 kW = 4 units/day (e.g. 5 kW → 20/day, 600/month, 7,200/year).
      </p>
    </section>
  );
}

function FloatingLabelSelectTechnology({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <Layers className="h-3 w-3" />
        Panel technology
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
      >
        <option value="">—</option>
        {PANEL_TECHNOLOGY_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
