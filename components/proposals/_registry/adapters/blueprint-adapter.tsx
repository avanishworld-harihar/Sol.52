/**
 * Thin adapter — Canvas (Investment Blueprint, ProposalData-native).
 * Preset id remains residential_blueprint for DB compatibility.
 */

import { CanvasProposalRenderer } from "@/components/proposals/canvas/canvas-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function BlueprintAdapter({ data, installerLogoUrl }: PresetRendererProps) {
  return <CanvasProposalRenderer data={data} installerLogoUrl={installerLogoUrl} />;
}
