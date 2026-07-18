/**
 * Thin adapter — HT-Commercial (High Tension industrial, ProposalData + htBillInputs).
 */

import { HtCommercialProposalRenderer } from "@/components/proposals/ht-commercial/ht-commercial-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function HtCommercialAdapter({
  data,
  pptInput,
  installerLogoUrl,
}: PresetRendererProps) {
  return (
    <HtCommercialProposalRenderer
      data={data}
      pptInput={pptInput}
      installerLogoUrl={installerLogoUrl}
    />
  );
}
