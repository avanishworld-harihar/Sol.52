/**
 * Thin adapter — Sales Premium (institutional pearl/slate OR web-renderer journey/ember).
 */

import { SalesPremiumInstitutionalRenderer } from "@/components/proposals/sales-premium-institutional/sales-premium-institutional-renderer";
import { ProposalWebRenderer } from "@/components/proposal/web-renderer";
import { compileProposalDocument } from "@/lib/proposal-document-ir";
import {
  resolveSalesPremiumStyle,
  usesInstitutionalRenderer,
} from "@/lib/sales-premium-styles";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function SalesPremiumAdapter({
  proposalId,
  pptInput,
  summary,
  showSurveyWorkflowSection,
}: PresetRendererProps) {
  const spStyle = resolveSalesPremiumStyle(pptInput);
  if (usesInstitutionalRenderer(spStyle)) {
    return (
      <SalesPremiumInstitutionalRenderer pptInput={pptInput} summary={summary} />
    );
  }

  const doc = compileProposalDocument(proposalId ?? "preview", pptInput, summary, {
    presetId: "residential_sales_premium",
  });

  return (
    <ProposalWebRenderer
      document={doc}
      summary={summary}
      showSurveyWorkflowSection={showSurveyWorkflowSection}
    />
  );
}
