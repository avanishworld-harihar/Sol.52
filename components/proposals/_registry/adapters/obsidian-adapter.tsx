"use client";

/**
 * Adapter — Obsidian HUD (cinematic tech-spec) · preset id residential_obsidian
 */

import { ObsidianRenderer } from "@/components/proposals/obsidian/obsidian-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function ObsidianAdapter({
  data,
  installerLogoUrl,
  pptInput,
  proposalId,
}: PresetRendererProps) {
  return (
    <ObsidianRenderer
      data={data}
      installerLogoUrl={installerLogoUrl || pptInput?.installerLogoUrl}
      pptInput={pptInput}
      proposalId={proposalId}
    />
  );
}
