"use client";

/**
 * Adapter — Khadi cloth-press · residential_khadi
 */

import { KhadiRenderer } from "@/components/proposals/khadi/khadi-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function KhadiAdapter({
  data,
  installerLogoUrl,
  pptInput,
  proposalId,
}: PresetRendererProps) {
  return (
    <KhadiRenderer
      data={data}
      installerLogoUrl={installerLogoUrl || pptInput?.installerLogoUrl}
      pptInput={pptInput}
      proposalId={proposalId}
    />
  );
}
