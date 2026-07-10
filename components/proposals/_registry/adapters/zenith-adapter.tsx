/**
 * Thin adapter — Zenith Luxury (ProposalData-native).
 * Sparse data fallback is handled in ProposalRenderer for first-class Zenith ids.
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function ZenithAdapter({ data }: PresetRendererProps) {
  return <ZenithProposalRenderer data={data} />;
}
