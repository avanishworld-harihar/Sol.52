"use client";

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
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

const PAGE_TOTAL = 5;

/**
 * Sales Premium — Institutional Edition (5-page Apple-style document).
 * Replaces legacy block-loop Sales Premium web renderer.
 */
export function SalesPremiumInstitutionalRenderer({
  pptInput,
  summary,
}: SalesPremiumInstitutionalRendererProps) {
  const model = transformToInstitutionalModel(pptInput, summary);

  return (
    <div className="sp-institutional-root w-full">
      <SpProposalShell>
        <div className="sp-doc-canvas">
          <SpCoverPage data={model.cover} pageNum={1} pageTotal={PAGE_TOTAL} />
          <SpBillIntelligencePage data={model.bill} pageNum={2} pageTotal={PAGE_TOTAL} />
          <SpCapitalBreakdownPage data={model.capital} pageNum={3} pageTotal={PAGE_TOTAL} />
          <SpTechnicalBomPage data={model.technical} pageNum={4} pageTotal={PAGE_TOTAL} />
          <SpExecutionPage data={model.execution} pageNum={5} pageTotal={PAGE_TOTAL} />
        </div>
      </SpProposalShell>
    </div>
  );
}
