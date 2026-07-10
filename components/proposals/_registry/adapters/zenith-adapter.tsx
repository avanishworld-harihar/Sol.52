/**
 * Thin adapter — Zenith (ProposalData-native scaffold).
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function ZenithAdapter({ data }: PresetRendererProps) {
  return <ZenithProposalRenderer data={data} />;
}
