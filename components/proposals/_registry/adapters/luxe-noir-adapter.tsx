"use client";

/**
 * Adapter — Premium Luxe (noir cinematic) · preset id residential_luxe_noir
 */

import { LuxeNoirRenderer } from "@/components/proposals/luxe-noir/luxe-noir-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function LuxeNoirAdapter({
  data,
  pptInput,
  summary,
  installerLogoUrl,
}: PresetRendererProps) {
  return (
    <LuxeNoirRenderer
      data={data}
      pptInput={pptInput}
      summary={summary}
      installerLogoUrl={installerLogoUrl}
    />
  );
}
