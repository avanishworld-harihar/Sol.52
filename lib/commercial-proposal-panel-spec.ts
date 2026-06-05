/**
 * Resolve commercial panel watt, technology, and module count from proposal settings.
 */

import { PANEL_CATALOG } from "@/lib/commercial-panel-catalog";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import { moduleCountForPlant } from "@/lib/commercial-bom-panels";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";

export type ResolvedCommercialPanelSpec = {
  panelWatt: number;
  panelTechnology: string;
  moduleCount: number;
  /** e.g. "575 Wp TOPCon (N-Type)" */
  panelSpecLabel: string;
};

export function resolveCommercialPanelSpec(
  systemKw: number,
  commercialConfig: CommercialProposalConfig | null | undefined,
  summary?: Pick<ProposalDeckSummary, "panelWatt" | "panels">
): ResolvedCommercialPanelSpec {
  const cc = commercialConfig;
  const catalogEntry = cc?.panel?.catalogId
    ? PANEL_CATALOG.find((p) => p.id === cc.panel!.catalogId) ?? null
    : null;

  const panelWatt =
    cc?.panel?.watt ?? catalogEntry?.watt ?? summary?.panelWatt ?? 540;
  const panelTechnology =
    cc?.panel?.technology?.trim() ||
    catalogEntry?.technology ||
    "Mono PERC";
  const moduleCount = moduleCountForPlant(systemKw, panelWatt);
  const panelSpecLabel = `${panelWatt} Wp ${panelTechnology}`;

  return { panelWatt, panelTechnology, moduleCount, panelSpecLabel };
}

/** Central string inverter qty for C&I rooftop proposals. */
export function commercialInverterQuantity(systemKw: number): number {
  if (systemKw <= 150) return 1;
  return Math.max(1, Math.ceil(systemKw / 100));
}
