"use client";

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToNextgenModel } from "@/lib/executive-premium-nextgen/transform-to-nextgen-model";
import { EpFontRoot } from "@/components/proposals/executive-premium-nextgen/primitives/ep-font-root";
import { EpDocumentCanvas } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { EpProposalShell } from "@/components/proposals/executive-premium-nextgen/primitives/ep-proposal-shell";
import { AssetDeclarationCover } from "@/components/proposals/executive-premium-nextgen/asset-declaration-cover";
import { ExecutiveBillIntelligence } from "@/components/proposals/executive-premium-nextgen/executive-bill-intelligence";
import { SystemContextRequirementAnalysis } from "@/components/proposals/executive-premium-nextgen/system-context-requirement-analysis";
import { OwnershipLedger } from "@/components/proposals/executive-premium-nextgen/ownership-ledger";
import { PropertyAssetView } from "@/components/proposals/executive-premium-nextgen/property-asset-view";
import { GovernanceStructure } from "@/components/proposals/executive-premium-nextgen/governance-structure";
import { InvestmentDecisionPage } from "@/components/proposals/executive-premium-nextgen/investment-decision-page";

export type ExecutivePremiumNextgenRendererProps = {
  proposalId: string;
  generatedAt: string;
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
  siteImages?: string[];
};

/**
 * Executive Premium NextGen — 6-page isolated renderer.
 * Page 2 branches: bill intelligence (audit data) vs requirement context.
 * Does not import legacy proposal section components.
 */
export function ExecutivePremiumNextgenRenderer({
  proposalId,
  generatedAt,
  pptInput,
  summary,
  siteImages,
}: ExecutivePremiumNextgenRendererProps) {
  const model = transformToNextgenModel({
    proposalId,
    generatedAt,
    pptInput,
    summary,
    siteImages,
  });

  return (
    <EpFontRoot className="ep-nextgen-mvp w-full max-w-none">
      <EpProposalShell proposalId={proposalId}>
        <EpDocumentCanvas>
        <AssetDeclarationCover
          assetData={{
            property: model.property,
            document: model.document,
            config: model.config,
          }}
          customerName={
            typeof pptInput.customerName === "string" ? pptInput.customerName : undefined
          }
        />
        {model.flow_mode === "bill" && model.bill_intelligence ? (
          <ExecutiveBillIntelligence billData={model.bill_intelligence} />
        ) : model.requirement_context ? (
          <SystemContextRequirementAnalysis contextData={model.requirement_context} />
        ) : null}
        <OwnershipLedger ledgerData={model.ledger} />
        <PropertyAssetView assetData={model.asset} />
        <GovernanceStructure governanceData={model.governance} />
        <InvestmentDecisionPage investmentData={model.investment} />
        </EpDocumentCanvas>
      </EpProposalShell>
    </EpFontRoot>
  );
}
