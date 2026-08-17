/**
 * ProposalRenderer — registry-first entry for all presets.
 * Zenith / Luxe / Blueprint are ProposalData-native; sparse decks get mock fill for local preview.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import {
  getPresetRendererLoader,
  isBlueprintPresetId,
  isLuxePresetId,
  isZenithPresetId,
} from "@/components/proposals/_registry/preset-renderers";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";
import { ProposalPageFit } from "@/components/proposals/_shared/proposal-page-fit";
import { isSparseProposalData } from "@/lib/proposal-data/is-sparse-proposal-data";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export type ProposalRendererProps = PresetRendererProps & {
  /** Official id, or local mock: `residential_zenith` | `zenith` | `luxe` | `blueprint`. */
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
    (isZenithPresetId(id) || isLuxePresetId(id) || isBlueprintPresetId(id)) &&
    isSparseProposalData(data)
      ? MOCK_ZENITH_DATA
      : data;

  /*
   * Every preset — residential, commercial, and anything added later — renders
   * inside the shared fit shell so one A4 layout serves phone, tablet, desktop
   * and print instead of each preset inventing its own tablet behaviour.
   */
  return (
    <ProposalPageFit>
      <Renderer {...rest} data={resolvedData} />
    </ProposalPageFit>
  );
}
