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
  /** Proposals BOM tab: persist pricing lines after catalog save. */
  lineItems?: PricingLineItem[];
  onPricingSaved?: () => void;
  /** Bill path: short hint that catalog pricing drives the web proposal. */
  billBackedHint?: boolean;
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
}: Props) {
  return (
    <div className="space-y-6">
      {billBackedHint ? (
        <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5 text-[11px] font-medium leading-snug text-emerald-950 dark:border-emerald-800/40 dark:bg-emerald-950/25 dark:text-emerald-100">
          Bill audit fills consumption below. <strong>Smart catalog</strong> sets plant kW, brands, and
          pricing for the web proposal — including DCR vs Non-DCR comparison when enabled.
        </p>
      ) : null}

      <ResidentialPricingSourceToggle config={config} onChange={onChange} />

      <ResidentialRequirementBuilder
        config={config}
        onChange={onChange}
        netCostInr={netCostInr}
        annualSavingInr={annualSavingInr}
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
