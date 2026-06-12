import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLeadSurveyCompleteForProposal } from "@/lib/proposal-survey-gate";
import { getLeadSurveyStatus } from "@/lib/supabase";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import { getProposalPricingByProposalId } from "@/lib/proposal-pricing-store";
import { getProposalById, trackProposalView } from "@/lib/proposals-store";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import { summarizeProposalDeck } from "@/lib/proposal-ppt";
import { resolveProposalBrandConfig } from "@/lib/proposal-branding-settings";
import { parseResidentialConfig } from "@/lib/residential-proposal-config";
import ProposalView from "./proposal-view";
import CommercialProposalView from "@/components/proposal/commercial-proposal-view";
import { ProposalWebRenderer } from "@/components/proposal/web-renderer";
import { ExecutivePremiumNextgenRenderer } from "@/components/proposals/executive-premium-nextgen/executive-premium-nextgen-renderer";
import { SalesPremiumInstitutionalRenderer } from "@/components/proposals/sales-premium-institutional/sales-premium-institutional-renderer";
import { compileProposalDocument } from "@/lib/proposal-document-ir";
import { RESIDENTIAL_WEB_RENDERER_PRESETS } from "@/lib/proposal-preset-engine";

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

  const brandConfigFromSnapshot = resolveProposalBrandConfig({ pptInput: mergedInput });

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

  // ── Commercial executive preset — render the premium commercial view ──────
  if (proposal.preset_id === "commercial_executive") {
    return (
      <CommercialProposalView
        id={id}
        customerName={proposal.customer_name}
        generatedAt={proposal.generated_at}
        summary={liveSummary}
        pptInput={mergedInput}
        installer={installerProps}
        siteImages={siteImages}
        installerLogoUrl={installerLogoUrl}
      />
    );
  }

  // ── Sales Premium Institutional — 5-page Apple-style renderer ────────────
  if (proposal.preset_id === "residential_sales_premium") {
    return (
      <SalesPremiumInstitutionalRenderer pptInput={mergedInput} summary={liveSummary} />
    );
  }

  // ── Executive Premium NextGen MVP — isolated 5-page renderer ─────────────
  if (proposal.preset_id === "residential_executive") {
    return (
      <ExecutivePremiumNextgenRenderer
        proposalId={id}
        generatedAt={proposal.generated_at}
        pptInput={mergedInput}
        summary={liveSummary}
        siteImages={siteImages}
      />
    );
  }

  // ── New residential presets — render via ProposalWebRenderer ─────────────
  if ((RESIDENTIAL_WEB_RENDERER_PRESETS as ReadonlyArray<string>).includes(proposal.preset_id ?? "")) {
    const leadId = proposal.lead_id?.trim() ? proposal.lead_id.trim() : null;
    const surveyStatus = await getLeadSurveyStatus(leadId);
    const showSurvey = isLeadSurveyCompleteForProposal(surveyStatus);
    const doc = compileProposalDocument(id, mergedInput, liveSummary, {
      presetId: proposal.preset_id ?? "residential_sales_premium",
    });
    return (
      <ProposalWebRenderer
        document={doc}
        summary={liveSummary}
        showSurveyWorkflowSection={showSurvey}
      />
    );
  }

  // ── Residential Legacy (residential_smart) — existing ProposalView ────────
  const leadId = proposal.lead_id?.trim() ? proposal.lead_id.trim() : null;
  const surveyStatus = await getLeadSurveyStatus(leadId);
  const showSurveyWorkflowSection = isLeadSurveyCompleteForProposal(surveyStatus);
  const billAuditBacked = isProposalBillAuditBacked(mergedInput);
  const residentialConfig = parseResidentialConfig(mergedInput.residentialConfig);

  return (
    <ProposalView
      id={id}
      summary={liveSummary}
      billAuditBacked={billAuditBacked}
      residentialConfig={residentialConfig}
      installer={installerProps}
      customerName={proposal.customer_name}
      generatedAt={proposal.generated_at}
      siteImages={siteImages}
      installerLogoUrl={installerLogoUrl}
      brandConfigFromSnapshot={brandConfigFromSnapshot}
      showSurveyWorkflowSection={showSurveyWorkflowSection}
    />
  );
}
