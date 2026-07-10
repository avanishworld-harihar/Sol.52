/**
 * Thin adapter — Golden / Executive (Nextgen entry, frozen internals).
 * Does not modify executive-premium-nextgen or editorial packages.
 */

import { ExecutivePremiumNextgenRenderer } from "@/components/proposals/executive-premium-nextgen/executive-premium-nextgen-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function GoldenAdapter({
  proposalId,
  generatedAt,
  pptInput,
  summary,
  siteImages,
}: PresetRendererProps) {
  return (
    <ExecutivePremiumNextgenRenderer
      proposalId={proposalId ?? ""}
      generatedAt={generatedAt ?? new Date().toISOString()}
      pptInput={pptInput}
      summary={summary}
      siteImages={siteImages}
    />
  );
}
