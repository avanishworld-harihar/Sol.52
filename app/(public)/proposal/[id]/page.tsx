import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLeadSurveyCompleteForProposal } from "@/lib/proposal-survey-gate";
import { getLeadSurveyStatus } from "@/lib/supabase";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import { getProposalPricingByProposalId } from "@/lib/proposal-pricing-store";
import { getProposalById, trackProposalView } from "@/lib/proposals-store";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import { summarizeProposalDeck } from "@/lib/proposal-ppt";
import { resolvePresetId } from "@/lib/proposal-preset-engine";
import { shouldShowPdfWatermark } from "@/lib/billing/entitlements";
import { buildProposalData } from "@/lib/proposal-data";
import { ProposalWatermarkShell } from "@/components/proposals/proposal-watermark-shell";
import { ProposalRenderer } from "@/components/proposals/ProposalRenderer";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getProposalById(id);
  if (!proposal) return { title: "Solar Proposal" };
  const pricing = await getProposalPricingByProposalId(proposal.id);
  const merged = mergeProposalPricingIntoPptInput(proposal.ppt_input, pricing);
  const summary = summarizeProposalDeck(merged);
  const installer = (() => {
    const fromPpt =
      typeof merged.installerName === "string" ? merged.installerName.trim() : "";
    const fromDb = proposal.installer_name?.trim();
    const name =
      fromPpt ||
      (fromDb && fromDb !== "Harihar Solar" ? fromDb : summary.installer !== "Harihar Solar" ? summary.installer : "");
    return name || "Solar Proposal";
  })();
  const saving = summary?.annualSaving ?? 0;
  const isCommercial = proposal.preset_id === "commercial_executive";
  const isBankPack = proposal.preset_id === "residential_bank_loan";
  const proposalLabel = isCommercial
    ? "Commercial Solar Proposal"
    : isBankPack
      ? "Solar Project — Bank Submission"
      : "Solar Proposal";
  return {
    title: `${proposal.customer_name} — ${proposalLabel} · ${installer}`,
    description: `${isCommercial ? "Commercial" : "Personalised"} ${summary?.systemKw ?? ""} kW solar proposal · ${saving > 0 ? `₹${saving.toLocaleString("en-IN")}/yr saving · ` : ""}Net cost ₹${(summary?.netCost ?? 0).toLocaleString("en-IN")}.`,
    openGraph: {
      title: `${proposal.customer_name}${isCommercial ? " — Commercial Solar Intelligence Report" : "'s Solar Proposal"}`,
      description: `${summary?.systemKw ?? ""} kW system from ${installer}.`,
      type: "website",
    },
  };
}

export default async function PublicProposalPage({ params }: PageProps) {
  const { id } = await params;
  const proposal = await getProposalById(id);
  if (!proposal) notFound();

  const pricing = await getProposalPricingByProposalId(proposal.id);
  const mergedInput = mergeProposalPricingIntoPptInput(proposal.ppt_input, pricing);
  const liveSummary = summarizeProposalDeck(mergedInput);

  void trackProposalView(id).catch(() => undefined);

  const rawPptInput = proposal.ppt_input as Record<string, unknown> | null | undefined;
  const siteImages = Array.isArray(rawPptInput?.siteImages)
    ? (rawPptInput?.siteImages as string[])
    : undefined;
  const installerLogoUrl =
    typeof rawPptInput?.installerLogoUrl === "string"
      ? (rawPptInput?.installerLogoUrl as string)
      : undefined;

  const installerProps = {
    name:
      (typeof mergedInput.installerName === "string" ? mergedInput.installerName.trim() : "") ||
      (proposal.installer_name?.trim() && proposal.installer_name !== "Harihar Solar"
        ? proposal.installer_name.trim()
        : liveSummary.installer !== "Harihar Solar"
          ? liveSummary.installer
          : ""),
    contact: proposal.installer_contact ?? liveSummary.contact,
    tagline: proposal.installer_tagline ?? liveSummary.tagline,
  };

  const orgId =
    typeof (proposal as { organization_id?: string | null }).organization_id === "string"
      ? (proposal as { organization_id: string }).organization_id
      : null;
  const showWatermark = await shouldShowPdfWatermark(orgId);
  const presetResolution = resolvePresetId(proposal.preset_id);
  const presetId = presetResolution.presetId;
  if (presetResolution.status !== "active") {
    console.warn("[proposal] non-active preset resolved", {
      proposalId: id,
      storedPresetId: proposal.preset_id,
      resolvedPresetId: presetId,
      status: presetResolution.status,
    });
  }

  const leadId = proposal.lead_id?.trim() ? proposal.lead_id.trim() : null;
  const surveyStatus = await getLeadSurveyStatus(leadId);
  const showSurveyWorkflowSection = isLeadSurveyCompleteForProposal(surveyStatus);
  const billAuditBacked = isProposalBillAuditBacked(mergedInput);

  const data = buildProposalData(mergedInput, liveSummary, {
    generatedAt: proposal.generated_at,
  });

  return (
    <ProposalWatermarkShell enabled={showWatermark}>
      <ProposalRenderer
        presetId={presetId}
        data={data}
        pptInput={mergedInput}
        summary={liveSummary}
        proposalId={id}
        generatedAt={proposal.generated_at}
        installerLogoUrl={installerLogoUrl}
        siteImages={siteImages}
        showSurveyWorkflowSection={showSurveyWorkflowSection}
        billAuditBacked={billAuditBacked}
        customerName={proposal.customer_name}
        installer={installerProps}
      />
    </ProposalWatermarkShell>
  );
}
