/**
 * Thin adapter — Energy Freedom (legacy pptInput + summary).
 */

import { EnergyFreedomProposalRenderer } from "@/components/proposals/energy-freedom/energy-freedom-proposal-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function FreedomAdapter({
  pptInput,
  summary,
  installerLogoUrl,
}: PresetRendererProps) {
  return (
    <EnergyFreedomProposalRenderer
      pptInput={pptInput}
      summary={summary}
      installerLogoUrl={installerLogoUrl}
    />
  );
}
