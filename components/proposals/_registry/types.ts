/**
 * Preset renderer registry types.
 * Legacy adapters receive pptInput + summary; new presets (Zenith+) prefer `data`.
 */

import type { ComponentType } from "react";
import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalData } from "@/lib/proposal-data";

export type PresetRendererProps = {
  /** Unified contract — required for new isolated presets. */
  data: ProposalData;
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
  proposalId?: string;
  generatedAt?: string;
  installerLogoUrl?: string;
  siteImages?: string[];
  /** Legacy web-renderer / commercial extras (optional). */
  showSurveyWorkflowSection?: boolean;
  billAuditBacked?: boolean;
  customerName?: string;
  installer?: {
    name: string;
    contact: string;
    tagline: string;
  };
};

export type PresetRendererComponent = ComponentType<PresetRendererProps>;

export type PresetRendererLoader = () => Promise<{
  default: PresetRendererComponent;
}>;

export type PresetRendererRegistry = Partial<
  Record<ProposalPresetId, PresetRendererLoader>
>;
