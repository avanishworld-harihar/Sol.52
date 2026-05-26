"use client";

import { DgHybridDiagram } from "@/components/proposal/blocks/commercial/dg-hybrid-diagram";
import { ResidentialProposalConfigWorkspace } from "@/components/residential/residential-proposal-config-workspace";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import { computeDgHybridAnalysis, defaultDgForSystem } from "@/lib/dg-hybrid-engine";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { Sun } from "lucide-react";

type Props = {
  pricingConfig: ResidentialProposalConfig;
  commercialConfig: CommercialProposalConfig;
  onPricingConfigChange: (next: ResidentialProposalConfig) => void;
  onCommercialConfigChange: (next: CommercialProposalConfig) => void;
  summary: ProposalDeckSummary;
  netCostInr: number;
  annualSavingInr: number;
  proposalId: string;
  proposalLayout?: ProposalTemplateV1 | null;
  onLayoutChange?: (layout: ProposalTemplateV1) => void;
  onSaved?: () => void;
  lineItems?: PricingLineItem[];
};

export function CommercialProposalConfigWorkspace({
  pricingConfig,
  commercialConfig,
  onPricingConfigChange,
  onCommercialConfigChange,
  summary,
  netCostInr,
  annualSavingInr,
  proposalId,
  proposalLayout,
  onLayoutChange,
  onSaved,
  lineItems,
}: Props) {
  const systemKw = pricingConfig.solar.plantCapacityKw;
  const dg = commercialConfig.dgAssumptions ?? { enabled: false };
  const dgDefaults = defaultDgForSystem(systemKw);
  const analysis = computeDgHybridAnalysis(
    { ...dgDefaults, ...dg, enabled: dg.enabled === true },
    systemKw
  );
  const showDiagram = dg.enabled === true && dg.showArchitectureDiagram !== false;

  return (
    <div className="space-y-6">
      <ResidentialProposalConfigWorkspace
        config={pricingConfig}
        onChange={onPricingConfigChange}
        subsidyEligible={false}
        netCostInr={netCostInr}
        annualSavingInr={annualSavingInr}
        proposalId={proposalId}
        proposalLayout={proposalLayout}
        onLayoutChange={onLayoutChange}
        onPricingSaved={onSaved}
        lineItems={lineItems}
        maxPlantKw={1000}
        segmentLabel="commercial site"
        saveMode="commercial"
        commercialConfig={commercialConfig}
        onCommercialConfigChange={onCommercialConfigChange}
        summary={summary}
      />

      {showDiagram ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1017]">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10 sm:px-5">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" aria-hidden />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                How solar works with your DG
              </h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Simple view for your customer — solar feeds the site first; DG runs less and backs up critical loads.
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <DgHybridDiagram systemKw={systemKw} capacityKva={analysis.capacityKva} />
            <ol className="grid gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:grid-cols-3">
              <li className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/[0.04]">
                <strong className="text-slate-800 dark:text-slate-200">1. Daytime:</strong> Solar powers
                lifts, AC, kitchen &amp; common loads — grid import drops.
              </li>
              <li className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/[0.04]">
                <strong className="text-slate-800 dark:text-slate-200">2. Peak / low sun:</strong> Hybrid
                controller blends grid + solar; DG starts only when needed.
              </li>
              <li className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/[0.04]">
                <strong className="text-slate-800 dark:text-slate-200">3. Outage:</strong> DG protects
                critical loads while solar extends runtime and cuts fuel.
              </li>
            </ol>
            <p className="text-center text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Est. diesel savings ~₹{Math.round(analysis.monthlyFuelSavingsInr).toLocaleString("en-IN")}/month · DG
              runtime −{analysis.runtimeReductionPct}%
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
