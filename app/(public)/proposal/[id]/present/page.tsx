import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import { getProposalPricingByProposalId } from "@/lib/proposal-pricing-store";
import { getProposalById } from "@/lib/proposals-store";
import { summarizeProposalDeck } from "@/lib/proposal-ppt";
import { compileProposalDocument } from "@/lib/proposal-document-ir";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import { isLeadSurveyCompleteForProposal } from "@/lib/proposal-survey-gate";
import { getLeadSurveyStatus } from "@/lib/supabase";
import {
  resolveSalesPremiumStyle,
  usesInstitutionalRenderer,
} from "@/lib/sales-premium-styles";
import ProposalPresentClient from "@/components/proposal/present/proposal-present-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getProposalById(id);
  if (!proposal) return { title: "Presentation" };
  return {
    title: `${proposal.customer_name} — Solar Proposal · Present Mode`,
    description: `Fullscreen presentation of solar proposal for ${proposal.customer_name}.`,
    robots: { index: false },
  };
}

export default async function ProposalPresentPage({ params }: PageProps) {
  const { id } = await params;
  const proposal = await getProposalById(id);
  if (!proposal) notFound();

  const pricing = await getProposalPricingByProposalId(proposal.id);
  const mergedInput = mergeProposalPricingIntoPptInput(proposal.ppt_input, pricing);
  const summary = summarizeProposalDeck(mergedInput);

  const leadId = proposal.lead_id?.trim() ? proposal.lead_id.trim() : null;
  const surveyStatus = await getLeadSurveyStatus(leadId);
  const showSurveyWorkflowSection = isLeadSurveyCompleteForProposal(surveyStatus);
  const billAuditBacked = isProposalBillAuditBacked(mergedInput);

  if (
    proposal.preset_id === "residential_executive" ||
    proposal.preset_id === "residential_solstice" ||
    proposal.preset_id === "residential_energy_freedom" ||
    proposal.preset_id === "residential_horizon"
  ) {
    redirect(`/proposal/${id}`);
  }
  if (proposal.preset_id === "residential_sales_premium") {
    const spStyle = resolveSalesPremiumStyle(mergedInput);
    if (usesInstitutionalRenderer(spStyle)) {
      redirect(`/proposal/${id}`);
    }
  }

  const doc = compileProposalDocument(id, mergedInput, summary, {
    presetId: proposal.preset_id ?? "residential_smart",
  });

  return (
    <ProposalPresentClient
      document={doc}
      summary={summary}
      billAuditBacked={billAuditBacked}
      showSurveyWorkflowSection={showSurveyWorkflowSection}
    />
  );
}
