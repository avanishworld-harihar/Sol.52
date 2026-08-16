"use client";

/**
 * Adapter — Sienna Laterite Folio · residential_sienna
 */

import { SiennaRenderer } from "@/components/proposals/sienna/sienna-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function SiennaAdapter({
  data,
  installerLogoUrl,
  pptInput,
  proposalId,
}: PresetRendererProps) {
  return (
    <SiennaRenderer
      data={data}
      installerLogoUrl={installerLogoUrl || pptInput?.installerLogoUrl}
      pptInput={pptInput}
      proposalId={proposalId}
    />
  );
}
