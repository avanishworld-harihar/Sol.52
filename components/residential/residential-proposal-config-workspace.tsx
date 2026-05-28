"use client";

import { ResidentialPricingStudio } from "@/components/residential/residential-pricing-studio";
import { ResidentialRequirementBuilder } from "@/components/residential/residential-requirement-builder";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  subsidyEligible: boolean;
  netCostInr: number;
  annualSavingInr: number;
  proposalId?: string | null;
  proposalLayout?: ProposalTemplateV1 | null;
  onLayoutChange?: (layout: ProposalTemplateV1) => void;
  onCreateProposal?: () => Promise<string | null>;
  onSaveAndGenerate?: () => Promise<void>;
  lineItems?: PricingLineItem[];
  onPricingSaved?: () => void;
  billBackedHint?: boolean;
  maxPlantKw?: number;
  segmentLabel?: string;
  saveMode?: "residential" | "commercial";
  commercialConfig?: CommercialProposalConfig;
  onCommercialConfigChange?: (next: CommercialProposalConfig) => void;
  summary?: ProposalDeckSummary;
};

export function ResidentialProposalConfigWorkspace({
  config,
  onChange,
  subsidyEligible,
  netCostInr,
  annualSavingInr,
  proposalId,
  proposalLayout,
  onLayoutChange,
  onCreateProposal,
  onSaveAndGenerate,
  lineItems,
  onPricingSaved,
  billBackedHint,
  maxPlantKw = 50,
  segmentLabel = "homeowner",
  saveMode = "residential",
  commercialConfig,
  onCommercialConfigChange,
  summary,
}: Props) {
  return (
    <div className="space-y-6">
      <ResidentialRequirementBuilder
        config={config}
        onChange={onChange}
        netCostInr={netCostInr}
        annualSavingInr={annualSavingInr}
        maxPlantKw={maxPlantKw}
        segmentLabel={segmentLabel}
        variant={saveMode === "commercial" ? "commercial" : "residential"}
      />

      <ResidentialPricingStudio
        config={config}
        subsidyEligible={subsidyEligible}
        onChange={onChange}
        proposalId={proposalId}
        proposalLayout={proposalLayout}
        onLayoutChange={onLayoutChange}
        onCreateProposal={onCreateProposal}
        onSaveAndGenerate={onSaveAndGenerate}
        lineItems={lineItems}
        onSaved={onPricingSaved}
        hideCatalogPanel
        hidePlantSizing={saveMode === "commercial"}
        variant={saveMode === "commercial" ? "commercial" : "residential"}
        saveMode={saveMode}
        commercialConfig={commercialConfig}
        onCommercialConfigChange={onCommercialConfigChange}
        summary={summary}
      />
    </div>
  );
}
