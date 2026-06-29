"use client";

import { useEffect } from "react";
import { FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import { ConnectionPhaseChips } from "@/components/residential/connection-phase-chips";
import {
  defaultPhaseSurchargeForConnection,
  type ConnectionPhase,
} from "@/lib/connection-phase-pricing";
import { residentialCostBreakdown } from "@/lib/residential-deck-helpers";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  subsidyEligible?: boolean;
  className?: string;
};

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function ConnectionPhasePricingPanel({ config, onChange, subsidyEligible, className }: Props) {
  const pricing = config.pricing ?? {};
  const connectionPhase = pricing.connectionPhase ?? "single_phase";
  const phaseSurcharge =
    pricing.phaseSurcharge ?? defaultPhaseSurchargeForConnection(connectionPhase, config.brandCatalog);

  useEffect(() => {
    if (
      connectionPhase === "three_phase" &&
      phaseSurcharge.enabled &&
      !(Number(phaseSurcharge.amountInr) > 0)
    ) {
      const defaults = defaultPhaseSurchargeForConnection("three_phase", config.brandCatalog);
      onChange({
        ...config,
        pricing: { ...pricing, connectionPhase: "three_phase", phaseSurcharge: defaults },
      });
    }
    // Back-fill legacy rows that enabled three-phase with ₹0 amount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patchPricing(partial: Partial<NonNullable<ResidentialProposalConfig["pricing"]>>) {
    onChange({ ...config, pricing: { ...pricing, ...partial } });
  }

  function setConnectionPhase(phase: ConnectionPhase) {
    const defaults = defaultPhaseSurchargeForConnection(phase, config.brandCatalog);
    patchPricing({
      connectionPhase: phase,
      phaseSurcharge: defaults,
    });
  }

  const breakdown = residentialCostBreakdown(config, {
    connectionType: config.connectionType,
    subsidyEligible,
  });

  return (
    <div className={cn("rounded-xl border border-slate-200/80 p-3 dark:border-white/10", className)}>
      <ConnectionPhaseChips value={connectionPhase} onChange={setConnectionPhase} />

      <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-white/10">
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Three-phase upgrade</span>
          <input
            type="checkbox"
            checked={phaseSurcharge.enabled}
            onChange={(e) =>
              patchPricing({
                phaseSurcharge: { ...phaseSurcharge, enabled: e.target.checked },
              })
            }
            className="h-4 w-4 rounded accent-emerald-600"
          />
        </label>
        {phaseSurcharge.enabled ? (
          <div className="mt-3">
            <FloatingLabelNumericInput
              label="Amount (₹)"
              value={phaseSurcharge.amountInr > 0 ? phaseSurcharge.amountInr : undefined}
              onValueChange={(n) =>
                patchPricing({
                  phaseSurcharge: { ...phaseSurcharge, amountInr: n ?? 0 },
                })
              }
              className="h-10 rounded-lg text-sm font-bold"
            />
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Default ₹18,000 — edit if your three-phase upgrade differs. Saved for your next proposal.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200/90 bg-slate-50/90 p-3 text-xs dark:border-white/10 dark:bg-white/[0.03]">
        <p className="font-bold uppercase tracking-wide text-slate-500">Quote preview</p>
        <div className="mt-2 space-y-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <div className="flex justify-between gap-2">
            <span>Plant cost</span>
            <span className="tabular-nums">{inr(breakdown.grossInr)}</span>
          </div>
          {breakdown.phaseSurchargeInr > 0 ? (
            <div className="flex justify-between gap-2">
              <span>Three-phase upgrade</span>
              <span className="tabular-nums">+{inr(breakdown.phaseSurchargeInr)}</span>
            </div>
          ) : connectionPhase === "three_phase" && !phaseSurcharge.enabled ? (
            <p className="text-[11px] font-medium text-amber-700">
              Enable three-phase upgrade above to add it to the proposal.
            </p>
          ) : null}
          {breakdown.discountInr > 0 ? (
            <div className="flex justify-between gap-2 text-emerald-700">
              <span>Discount</span>
              <span className="tabular-nums">−{inr(breakdown.discountInr)}</span>
            </div>
          ) : null}
          {breakdown.subsidyInr > 0 ? (
            <div className="flex justify-between gap-2 text-emerald-700">
              <span>Subsidy</span>
              <span className="tabular-nums">−{inr(breakdown.subsidyInr)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-2 border-t border-slate-200 pt-2 text-sm font-extrabold text-brand-800 dark:border-white/10 dark:text-brand-300">
            <span>Net cost</span>
            <span className="tabular-nums">{inr(breakdown.netInr)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
