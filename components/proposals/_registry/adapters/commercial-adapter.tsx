/**
 * Thin adapter — Commercial Executive.
 */

import CommercialProposalView from "@/components/proposal/commercial-proposal-view";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function CommercialAdapter({
  proposalId,
  pptInput,
  summary,
  generatedAt,
  installerLogoUrl,
  siteImages,
  customerName,
  installer,
}: PresetRendererProps) {
  const installerProps = installer ?? {
    name: summary.installer,
    contact: summary.contact,
    tagline: summary.tagline,
  };

  return (
    <CommercialProposalView
      id={proposalId ?? "preview"}
      customerName={customerName ?? summary.honoredName}
      generatedAt={generatedAt ?? new Date().toISOString()}
      summary={summary}
      pptInput={pptInput}
      installer={installerProps}
      siteImages={siteImages}
      installerLogoUrl={installerLogoUrl}
    />
  );
}
