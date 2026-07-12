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

/** C&I string inverters are typically supplied as 100 kW units. */
export const COMMERCIAL_INVERTER_UNIT_KW = 100;

/** How many 100 kW-class string inverters for a plant (100 kW → 1, 300 kW → 3). */
export function commercialInverterQuantity(systemKw: number): number {
  const kw = Math.max(0, Number(systemKw) || 0);
  if (kw <= 0) return 1;
  return Math.max(1, Math.ceil(kw / COMMERCIAL_INVERTER_UNIT_KW));
}

/** Nameplate kW per inverter unit shown on BOM / architecture. */
export function commercialInverterUnitKw(systemKw: number): number {
  const kw = Math.max(0, Number(systemKw) || 0);
  if (kw <= 0) return COMMERCIAL_INVERTER_UNIT_KW;
  if (kw <= COMMERCIAL_INVERTER_UNIT_KW) return Math.round(kw * 10) / 10;
  return COMMERCIAL_INVERTER_UNIT_KW;
}

/**
 * GI pipe earthing electrodes for C&I — 2 per 100 kW plant (min 4).
 * Example: 100 kW → 4, 300 kW → 6, 500 kW → 10.
 */
export function commercialEarthingElectrodeCount(systemKw: number): number {
  const kw = Math.max(0, Number(systemKw) || 0);
  if (kw <= 0) return 4;
  return Math.max(4, Math.ceil(kw / COMMERCIAL_INVERTER_UNIT_KW) * 2);
}
