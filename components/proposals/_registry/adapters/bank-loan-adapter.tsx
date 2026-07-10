/**
 * Thin adapter — Bank Loan Pack (ProposalWebRenderer).
 */

import { ProposalWebRenderer } from "@/components/proposal/web-renderer";
import { compileProposalDocument } from "@/lib/proposal-document-ir";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function BankLoanAdapter({
  proposalId,
  pptInput,
  summary,
  showSurveyWorkflowSection,
}: PresetRendererProps) {
  const doc = compileProposalDocument(proposalId ?? "preview", pptInput, summary, {
    presetId: "residential_bank_loan",
  });

  return (
    <ProposalWebRenderer
      document={doc}
      summary={summary}
      showSurveyWorkflowSection={showSurveyWorkflowSection}
    />
  );
}
