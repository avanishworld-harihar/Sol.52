/**
 * ProposalRenderer — registry-first entry for all presets.
 * Zenith is first-class ProposalData-native; sparse decks get luxury mock data.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import {
  getPresetRendererLoader,
  isZenithPresetId,
} from "@/components/proposals/_registry/preset-renderers";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";
import { isSparseProposalData } from "@/lib/proposal-data/is-sparse-proposal-data";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export type ProposalRendererProps = PresetRendererProps & {
  /** Official id, or local mock: `residential_zenith` | `zenith`. */
  presetId: ProposalPresetId | string;
};

export async function ProposalRenderer({
  presetId,
  data,
  ...rest
}: ProposalRendererProps) {
  const load = getPresetRendererLoader(presetId);
  const mod = await load();
  const Renderer = mod.default;

  const resolvedData =
    isZenithPresetId(String(presetId)) && isSparseProposalData(data)
      ? MOCK_ZENITH_DATA
      : data;

  return <Renderer {...rest} data={resolvedData} />;
}
