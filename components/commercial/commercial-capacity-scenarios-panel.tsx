"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import {
  buildDefaultScenarios,
  catalogOptsFromResidentialConfig,
  computeCapacityScenarioFromCatalog,
  type CapacityScenarioInput,
} from "@/lib/commercial-capacity-scenarios";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Star, Trash2, TrendingUp } from "lucide-react";

type Props = {
  pricingConfig: ResidentialProposalConfig;
  commercialConfig: CommercialProposalConfig;
  primaryKw: number;
  onCommercialChange: (next: CommercialProposalConfig) => void;
  className?: string;
};

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

export function CommercialCapacityScenariosPanel({
  pricingConfig,
  commercialConfig,
  primaryKw,
  onCommercialChange,
  className,
}: Props) {
  const scenarios =
    commercialConfig.capacityScenarios?.scenarios ?? buildDefaultScenarios(primaryKw);
  const recommendedId =
    commercialConfig.capacityScenarios?.recommendedId ??
    scenarios.find((s) => s.isRecommended)?.id ??
    "primary";
  const enabled = commercialConfig.capacityScenarios?.enabled === true;
  const catalogOpts = catalogOptsFromResidentialConfig(pricingConfig);
  const metrics = scenarios.map((s) => computeCapacityScenarioFromCatalog(s, catalogOpts));

  function patchCapacity(patch: Partial<NonNullable<CommercialProposalConfig["capacityScenarios"]>>) {
    onCommercialChange({
      ...commercialConfig,
      capacityScenarios: {
        enabled,
        scenarios,
        recommendedId,
        ...patch,
      },
    });
  }

  function updateScenarios(next: CapacityScenarioInput[], recId?: string) {
    patchCapacity({ scenarios: next, recommendedId: recId ?? recommendedId });
  }

  function updateScenarioKw(id: string, kw: number) {
    updateScenarios(
      scenarios.map((s) => (s.id === id ? { ...s, systemKw: Math.max(1, kw) } : s))
    );
  }

  function addScenario() {
    if (scenarios.length >= 5) return;
    const lastKw = scenarios[scenarios.length - 1]?.systemKw ?? primaryKw;
    const nextKw = Math.min(10000, lastKw + Math.max(5, Math.round(lastKw * 0.1)));
    updateScenarios([
      ...scenarios,
      { id: `option_${Date.now()}`, label: `Option ${scenarios.length + 1}`, systemKw: nextKw },
    ]);
  }

  function removeScenario(id: string) {
    if (scenarios.length <= 1) return;
    const next = scenarios.filter((s) => s.id !== id);
    const rec = recommendedId === id ? next[0]?.id : recommendedId;
    updateScenarios(next, rec);
  }

  return (
    <details
      open={enabled}
      className={cn(
        "group rounded-2xl border border-sky-200/80 bg-sky-50/20 dark:border-sky-500/25 dark:bg-sky-950/10",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <TrendingUp className="h-4 w-4 shrink-0 text-sky-600" />
            Multi-kW executive comparison
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Enter kW only — net cost, savings & payback pull from Smart catalog. Off = hidden on proposal.
          </p>
        </div>
        <label
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => patchCapacity({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Show on proposal
        </label>
      </summary>

      <div className="space-y-3 border-t border-sky-200/60 px-4 pb-4 pt-3 dark:border-sky-500/20">
        {metrics.map((m) => {
          const isRec = m.id === recommendedId;
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border p-3",
                isRec
                  ? "border-sky-300 bg-white ring-1 ring-sky-200 dark:border-sky-700 dark:bg-white/[0.03]"
                  : "border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-white/[0.02]"
              )}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <FloatingLabelNumericInput
                    label="kW"
                    integer
                    value={m.systemKw}
                    onValueChange={(n) => updateScenarioKw(m.id, n ?? m.systemKw)}
                    className="h-9 w-24 rounded-lg text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) =>
                      updateScenarios(
                        scenarios.map((s) => (s.id === m.id ? { ...s, label: e.target.value } : s))
                      )
                    }
                    className="h-9 min-w-[7rem] rounded-lg border border-slate-200 px-2 text-xs font-semibold dark:border-white/15 dark:bg-white/5"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateScenarios(scenarios, m.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[11px] font-bold",
                      isRec ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {isRec && <Star className="mr-1 inline h-3 w-3 fill-current" />}
                    {isRec ? "Recommended" : "Set recommended"}
                  </button>
                  <button
                    type="button"
                    disabled={scenarios.length <= 1}
                    onClick={() => removeScenario(m.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MetricReadonly label="Net (catalog)" value={inr(m.netCostInr)} />
                <MetricReadonly label="Annual saving" value={inr(m.annualSavingInr)} />
                <MetricReadonly label="Payback" value={`${m.paybackYears} yr`} />
                <MetricReadonly label="Roof ~" value={`${m.roofAreaSqmApprox} m²`} />
              </div>
            </div>
          );
        })}
        {scenarios.length < 5 ? (
          <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={addScenario}>
            <Plus className="h-3.5 w-3.5" /> Add kW option
          </Button>
        ) : null}
      </div>
    </details>
  );
}

function MetricReadonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2 text-center dark:bg-white/[0.04]">
      <p className="text-[9px] font-bold uppercase text-slate-400">{label}</p>
      <p className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}
