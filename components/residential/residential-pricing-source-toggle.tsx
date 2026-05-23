"use client";

import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { applyResidentialPricingSource } from "@/lib/residential-proposal-config";
import { cn } from "@/lib/utils";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  className?: string;
};

export function ResidentialPricingSourceToggle({ config, onChange, className }: Props) {
  const isOverride = config.pricingSource === "customer_override";

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-[11px] leading-snug",
        isOverride
          ? "border-amber-300/80 bg-amber-50/80 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/25 dark:text-amber-100"
          : "border-slate-200/90 bg-slate-50/80 text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {isOverride ? "Custom pricing for this customer" : "Using central rate card"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (isOverride) {
              onChange(
                applyResidentialPricingSource({
                  ...config,
                  pricingSource: "rate_card",
                })
              );
            } else {
              onChange({
                ...applyResidentialPricingSource(config),
                pricingSource: "customer_override",
              });
            }
          }}
          className={cn(
            "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            isOverride
              ? "bg-white text-amber-900 shadow-sm dark:bg-amber-900/40 dark:text-amber-100"
              : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          )}
        >
          {isOverride ? "Use rate card" : "Override for customer"}
        </button>
      </div>
      <p className="mt-1 opacity-90">
        {isOverride
          ? "Edits here stay on this proposal only. More → Rate card is unchanged."
          : "Prices sync from More → Rate card. Toggle override to negotiate one-off rates."}
      </p>
    </div>
  );
}
