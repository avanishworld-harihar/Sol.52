/**
 * Thin adapter — Solstice (legacy pptInput + summary).
 */

import { SolsticeProposalRenderer } from "@/components/proposals/solstice/solstice-proposal-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function SolsticeAdapter({
  pptInput,
  summary,
  installerLogoUrl,
}: PresetRendererProps) {
  return (
    <SolsticeProposalRenderer
      pptInput={pptInput}
      summary={summary}
      installerLogoUrl={installerLogoUrl}
    />
  );
}
