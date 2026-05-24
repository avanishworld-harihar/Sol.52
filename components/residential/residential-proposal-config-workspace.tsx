"use client";

import { ResidentialPricingStudio } from "@/components/residential/residential-pricing-studio";
import { ResidentialRequirementBuilder } from "@/components/residential/residential-requirement-builder";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
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
  lineItems?: PricingLineItem[];
  onPricingSaved?: () => void;
  billBackedHint?: boolean;
  maxPlantKw?: number;
  segmentLabel?: string;
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
  lineItems,
  onPricingSaved,
  billBackedHint,
  maxPlantKw = 50,
  segmentLabel = "homeowner",
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
      />

      <ResidentialPricingStudio
        config={config}
        subsidyEligible={subsidyEligible}
        onChange={onChange}
        proposalId={proposalId}
        proposalLayout={proposalLayout}
        onLayoutChange={onLayoutChange}
        onCreateProposal={onCreateProposal}
        lineItems={lineItems}
        onSaved={onPricingSaved}
        hideCatalogPanel
      />
    </div>
  );
}
