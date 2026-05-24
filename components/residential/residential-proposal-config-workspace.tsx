"use client";

import { ResidentialPricingStudio } from "@/components/residential/residential-pricing-studio";
import { ResidentialPricingSourceToggle } from "@/components/residential/residential-pricing-source-toggle";
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
      {billBackedHint ? (
        <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5 text-[11px] font-medium leading-snug text-emerald-950 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:text-emerald-100">
          Bill audit fills consumption below. <strong>Smart catalog</strong> sets plant kW, brands, and
          pricing for the web proposal — including DCR vs Non-DCR comparison when enabled.
        </p>
      ) : segmentLabel === "commercial" ? (
        <p className="rounded-xl border border-sky-200/80 bg-sky-50/70 px-3 py-2.5 text-[11px] font-medium leading-snug text-sky-950 dark:border-sky-800/40 dark:bg-sky-950/25 dark:text-sky-100">
          Same Smart catalog + pricing studio as residential — set plant ₹/kW (DCR & Non-DCR manually), brands,
          discount, and optional DCR comparison for your commercial offer.
        </p>
      ) : null}

      <ResidentialPricingSourceToggle config={config} onChange={onChange} />

      <ResidentialRequirementBuilder
        config={config}
        onChange={onChange}
        netCostInr={netCostInr}
        annualSavingInr={annualSavingInr}
        maxPlantKw={maxPlantKw}
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
      />
    </div>
  );
}
