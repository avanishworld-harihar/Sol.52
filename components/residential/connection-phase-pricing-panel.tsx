"use client";

import { FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import { ConnectionPhaseChips } from "@/components/residential/connection-phase-chips";
import {
  defaultPhaseSurchargeForConnection,
  type ConnectionPhase,
} from "@/lib/connection-phase-pricing";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  className?: string;
};

export function ConnectionPhasePricingPanel({ config, onChange, className }: Props) {
  const pricing = config.pricing ?? {};
  const connectionPhase = pricing.connectionPhase ?? "single_phase";
  const phaseSurcharge = pricing.phaseSurcharge ?? defaultPhaseSurchargeForConnection(connectionPhase);

  function patchPricing(partial: Partial<NonNullable<ResidentialProposalConfig["pricing"]>>) {
    onChange({ ...config, pricing: { ...pricing, ...partial } });
  }

  function setConnectionPhase(phase: ConnectionPhase) {
    const defaults = defaultPhaseSurchargeForConnection(phase);
    patchPricing({
      connectionPhase: phase,
      phaseSurcharge: {
        enabled: defaults.enabled,
        amountInr: phase === connectionPhase ? phaseSurcharge.amountInr ?? 0 : 0,
      },
    });
  }

  return (
    <div className={cn("rounded-xl border border-slate-200/80 p-3 dark:border-white/10", className)}>
      <ConnectionPhaseChips value={connectionPhase} onChange={setConnectionPhase} />

      <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-white/10">
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Three-phase extra charge</span>
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
              Enter the surcharge manually — not calculated from kW or rate card.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
