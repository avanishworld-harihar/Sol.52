/**
 * Thin adapter — Residential Smart / Legacy ProposalView.
 */

import ProposalView from "@/app/(public)/proposal/[id]/proposal-view";
import { parseResidentialConfig } from "@/lib/residential-proposal-config";
import { resolveProposalBrandConfig } from "@/lib/proposal-branding-settings";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function SmartAdapter({
  proposalId,
  pptInput,
  summary,
  generatedAt,
  installerLogoUrl,
  siteImages,
  showSurveyWorkflowSection,
  billAuditBacked,
  customerName,
  installer,
}: PresetRendererProps) {
  const residentialConfig = parseResidentialConfig(pptInput.residentialConfig);
  const brandConfigFromSnapshot = resolveProposalBrandConfig({ pptInput });

  const installerProps = installer ?? {
    name: summary.installer,
    contact: summary.contact,
    tagline: summary.tagline,
  };

  return (
    <ProposalView
      id={proposalId ?? "preview"}
      summary={summary}
      billAuditBacked={billAuditBacked ?? false}
      residentialConfig={residentialConfig}
      installer={installerProps}
      customerName={customerName ?? summary.honoredName}
      generatedAt={generatedAt ?? new Date().toISOString()}
      siteImages={siteImages}
      installerLogoUrl={installerLogoUrl}
      brandConfigFromSnapshot={brandConfigFromSnapshot}
      showSurveyWorkflowSection={showSurveyWorkflowSection}
    />
  );
}
