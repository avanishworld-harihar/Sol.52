/**
 * Thin adapter — Zenith Luxury (ProposalData-native).
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function ZenithAdapter({ data, installerLogoUrl }: PresetRendererProps) {
  return (
    <ZenithProposalRenderer data={data} installerLogoUrl={installerLogoUrl} />
  );
}
