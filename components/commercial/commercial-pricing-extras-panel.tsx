"use client";

import { DgHybridConfigPanel } from "@/components/commercial/dg-hybrid-config-panel";
import { CommercialExecutionTimeline } from "@/components/commercial/bom/commercial-execution-timeline";
import { WorkspaceCapacityScenariosModule } from "@/components/workspace/commercial/workspace-capacity-scenarios-module";
import { computeDgHybridAnalysis } from "@/lib/dg-hybrid-engine";
import { defaultExecutionTimeline } from "@/lib/commercial-solar-schema";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import { cn } from "@/lib/utils";
import { Building2, CalendarClock, Fuel } from "lucide-react";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

type Props = {
  config: CommercialProposalConfig;
  summary: ProposalDeckSummary;
  systemKw: number;
  onChange: (next: CommercialProposalConfig) => void;
};

function ToggleRow({
  icon: Icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors",
        checked
          ? "border-indigo-200 bg-white shadow-sm dark:border-indigo-500/30 dark:bg-[#0f1419]"
          : "border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.02]"
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 rounded border-slate-300"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-50">{title}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </label>
  );
}

/** DG hybrid, execution timeline, and multi-kW scenarios — inside Pricing & system catalog. */
export function CommercialPricingExtrasPanel({ config, summary, systemKw, onChange }: Props) {
  const dg = config.dgAssumptions ?? { enabled: false };
  const dgAnalysis = computeDgHybridAnalysis(dg, systemKw);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Commercial site options
        </p>
        <ToggleRow
          icon={Fuel}
          title="Include DG hybrid analysis"
          subtitle={
            dg.enabled
              ? `Save ${inr(dgAnalysis.monthlyFuelSavingsInr)}/mo · −${dgAnalysis.runtimeReductionPct}% DG runtime`
              : "Solar + DG architecture, fuel savings & customer diagram"
          }
          checked={dg.enabled === true}
          onChange={(on) => onChange({ ...config, dgAssumptions: { ...dg, enabled: on } })}
        />
      </div>

      {dg.enabled ? (
        <DgHybridConfigPanel config={config} systemKw={systemKw} onChange={onChange} />
      ) : null}

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Project execution timeline</p>
        </div>
        <CommercialExecutionTimeline
          timeline={config.executionTimeline ?? defaultExecutionTimeline()}
          onChange={(executionTimeline) => onChange({ ...config, executionTimeline })}
        />
      </div>

      <div className="rounded-xl border border-sky-200/60 bg-sky-50/40 p-4 dark:border-sky-500/20 dark:bg-sky-950/10">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-sky-600" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Multi-kW executive comparison</p>
        </div>
        <WorkspaceCapacityScenariosModule
          systemKw={systemKw}
          summary={summary}
          config={config}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
