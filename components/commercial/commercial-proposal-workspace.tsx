"use client";

import { CommercialWorkspaceHeader } from "@/components/commercial/commercial-workspace-header";
import { DgHybridDiagram } from "@/components/proposal/blocks/commercial/dg-hybrid-diagram";
import { ResidentialPricingStudio } from "@/components/residential/residential-pricing-studio";
import { ResidentialRequirementBuilder } from "@/components/residential/residential-requirement-builder";
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
  /** Dedicated plant kW commit — avoids parent effects fighting typed values. */
  onCommitPlantKw?: (kw: number) => void;
  /** Fired when user focuses the kW field — blocks bill auto-size overwrite while typing. */
  onPlantKwEditStart?: () => void;
  onCommercialConfigChange: (next: CommercialProposalConfig) => void;
  summary: ProposalDeckSummary;
  netCostInr: number;
  annualSavingInr: number;
  proposalId: string;
  proposalLayout?: ProposalTemplateV1 | null;
  onLayoutChange?: (layout: ProposalTemplateV1) => void;
  onSaved?: () => void;
  onCreateProposal?: () => Promise<string | null>;
  lineItems?: PricingLineItem[];
  onOpenReview?: () => void;
};

/** Commercial deal workspace — ordered steps, executive theme, rate card in More. */
export function CommercialProposalWorkspace({
  pricingConfig,
  commercialConfig,
  onPricingConfigChange,
  onCommitPlantKw,
  onPlantKwEditStart,
  onCommercialConfigChange,
  summary,
  netCostInr,
  annualSavingInr,
  proposalId,
  proposalLayout,
  onLayoutChange,
  onSaved,
  onCreateProposal,
  lineItems,
  onOpenReview,
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
    <div className="space-y-5">
      <CommercialWorkspaceHeader summary={summary} netCostInr={netCostInr} onOpenReview={onOpenReview} />

      <ResidentialRequirementBuilder
        variant="commercial"
        config={pricingConfig}
        onChange={onPricingConfigChange}
        onCommitPlantKw={onCommitPlantKw}
        onPlantKwEditStart={onPlantKwEditStart}
        netCostInr={netCostInr}
        annualSavingInr={annualSavingInr}
        maxPlantKw={10000}
      />

      <ResidentialPricingStudio
        variant="commercial"
        config={pricingConfig}
        subsidyEligible={false}
        onChange={onPricingConfigChange}
        proposalId={proposalId || null}
        proposalLayout={proposalLayout}
        onLayoutChange={onLayoutChange}
        lineItems={lineItems}
        onSaved={onSaved}
        onCreateProposal={onCreateProposal}
        hideCatalogPanel
        hidePlantSizing
        saveMode="commercial"
        commercialConfig={commercialConfig}
        onCommercialConfigChange={onCommercialConfigChange}
        summary={summary}
      />

      {showDiagram ? (
        <section className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-white shadow-sm dark:border-indigo-500/20 dark:bg-[#0c1017]">
          <div className="border-b border-indigo-100 px-4 py-3 dark:border-indigo-500/15 sm:px-5">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" aria-hidden />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Customer preview · Solar + DG
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Shown on the web proposal when DG hybrid is enabled (step 5).
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <DgHybridDiagram systemKw={systemKw} capacityKva={analysis.capacityKva} />
            <ol className="grid gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:grid-cols-3">
              <li className="rounded-lg bg-indigo-50/80 px-3 py-2 dark:bg-indigo-950/20">
                <strong className="text-slate-800 dark:text-slate-200">1. Daytime:</strong> Solar powers site loads
                — grid import drops.
              </li>
              <li className="rounded-lg bg-indigo-50/80 px-3 py-2 dark:bg-indigo-950/20">
                <strong className="text-slate-800 dark:text-slate-200">2. Peak:</strong> Hybrid controller blends grid
                + solar; DG only when needed.
              </li>
              <li className="rounded-lg bg-indigo-50/80 px-3 py-2 dark:bg-indigo-950/20">
                <strong className="text-slate-800 dark:text-slate-200">3. Outage:</strong> DG protects critical loads;
                solar cuts fuel use.
              </li>
            </ol>
          </div>
        </section>
      ) : null}
    </div>
  );
}
