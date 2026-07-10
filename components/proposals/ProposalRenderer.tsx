/**
 * ProposalRenderer — registry-first entry for all presets.
 * Accepts official preset ids or local mock aliases (`zenith` / `residential_zenith`).
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import { getPresetRendererLoader } from "@/components/proposals/_registry/preset-renderers";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export type ProposalRendererProps = PresetRendererProps & {
  /** Official id, or local mock: `residential_zenith` | `zenith`. */
  presetId: ProposalPresetId | string;
};

export async function ProposalRenderer({
  presetId,
  ...rest
}: ProposalRendererProps) {
  const load = getPresetRendererLoader(presetId);
  const mod = await load();
  const Renderer = mod.default;
  return <Renderer {...rest} />;
}
