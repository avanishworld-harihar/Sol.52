"use client";

/** Adapter — Voltaic engineering dossier preset. */

import { VoltaicRenderer } from "@/components/proposals/voltaic/voltaic-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function VoltaicAdapter({
  data,
  installerLogoUrl,
  pptInput,
  summary,
  proposalId,
}: PresetRendererProps) {
  return (
    <VoltaicRenderer
      data={data}
      installerLogoUrl={installerLogoUrl || pptInput?.installerLogoUrl}
      pptInput={pptInput}
      summary={summary}
      proposalId={proposalId}
    />
  );
}
