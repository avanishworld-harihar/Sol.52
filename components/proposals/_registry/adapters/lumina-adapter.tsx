"use client";

/**
 * Adapter — Lumina (clean light app UI) · residential_lumina
 */

import { LuminaRenderer } from "@/components/proposals/lumina/lumina-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function LuminaAdapter({
  data,
  installerLogoUrl,
  pptInput,
  proposalId,
}: PresetRendererProps) {
  return (
    <LuminaRenderer
      data={data}
      installerLogoUrl={installerLogoUrl || pptInput?.installerLogoUrl}
      pptInput={pptInput}
      proposalId={proposalId}
    />
  );
}
