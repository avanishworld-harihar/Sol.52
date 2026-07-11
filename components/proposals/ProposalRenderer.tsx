/**
 * ProposalRenderer — registry-first entry for all presets.
 * Zenith / Luxe are ProposalData-native; sparse decks get mock fill for local preview.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import {
  getPresetRendererLoader,
  isLuxePresetId,
  isZenithPresetId,
} from "@/components/proposals/_registry/preset-renderers";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";
import { isSparseProposalData } from "@/lib/proposal-data/is-sparse-proposal-data";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export type ProposalRendererProps = PresetRendererProps & {
  /** Official id, or local mock: `residential_zenith` | `zenith` | `luxe`. */
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

  const id = String(presetId);
  const resolvedData =
    (isZenithPresetId(id) || isLuxePresetId(id)) && isSparseProposalData(data)
      ? MOCK_ZENITH_DATA
      : data;

  return <Renderer {...rest} data={resolvedData} />;
}
