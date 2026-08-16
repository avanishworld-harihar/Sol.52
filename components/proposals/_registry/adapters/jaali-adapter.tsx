"use client";

/**
 * Adapter — Jaali courtyard · residential_jaali
 */

import { JaaliRenderer } from "@/components/proposals/jaali/jaali-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function JaaliAdapter({
  data,
  installerLogoUrl,
  pptInput,
  proposalId,
}: PresetRendererProps) {
  return (
    <JaaliRenderer
      data={data}
      installerLogoUrl={installerLogoUrl || pptInput?.installerLogoUrl}
      pptInput={pptInput}
      proposalId={proposalId}
    />
  );
}
