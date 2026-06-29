"use client";

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import {
  institutionalVariantForStyle,
  resolveSalesPremiumStyle,
} from "@/lib/sales-premium-styles";
import { transformToInstitutionalModel } from "@/lib/sales-premium-institutional/transform-to-institutional-model";
import { SpProposalShell } from "@/components/proposals/sales-premium-institutional/primitives/sp-proposal-shell";
import { SpCoverPage } from "@/components/proposals/sales-premium-institutional/pages/sp-cover-page";
import { SpBillIntelligencePage } from "@/components/proposals/sales-premium-institutional/pages/sp-bill-intelligence-page";
import { SpCapitalBreakdownPage } from "@/components/proposals/sales-premium-institutional/pages/sp-capital-breakdown-page";
import { SpTechnicalBomPage } from "@/components/proposals/sales-premium-institutional/pages/sp-technical-bom-page";
import { SpExecutionPage } from "@/components/proposals/sales-premium-institutional/pages/sp-execution-page";
import "@/components/proposals/sales-premium-institutional/sp-institutional.css";

export type SalesPremiumInstitutionalRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
};

/**
 * Sales Premium Pearl / Slate — 5-page institutional document.
 * Pearl = clean white minimalist; Slate = Apple Pro HNI layout.
 */
export function SalesPremiumInstitutionalRenderer({
  pptInput,
  summary,
}: SalesPremiumInstitutionalRendererProps) {
  const style = resolveSalesPremiumStyle(pptInput);
  const variant = institutionalVariantForStyle(style);
  const model = transformToInstitutionalModel(pptInput, summary);

  return (
    <div className={`sp-institutional-root sp-theme-${variant} w-full`}>
      <SpProposalShell variant={variant}>
        <div className="sp-doc-canvas">
          <SpCoverPage data={model.cover} variant={variant} />
          <SpBillIntelligencePage data={model.bill} variant={variant} />
          <SpCapitalBreakdownPage data={model.capital} />
          <SpTechnicalBomPage data={model.technical} />
          <SpExecutionPage data={model.execution} />
        </div>
      </SpProposalShell>
    </div>
  );
}
