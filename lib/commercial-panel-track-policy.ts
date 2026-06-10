/**
 * Commercial panel track policy — Non-DCR panels + catalog rates when:
 *   • connection is commercial / industrial / HT, OR
 *   • plant size is above 8 kW
 */

import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import {
  getActiveCatalogEntry,
  syncSolarAndPricingFromEntry,
} from "@/lib/residential-brand-catalog";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export const COMMERCIAL_NON_DCR_KW_THRESHOLD = 8;

export type CommercialPanelTrack = "dcr" | "non_dcr";

export function panelTypeFromTrack(track: CommercialPanelTrack): "DCR" | "NON_DCR" {
  return track === "non_dcr" ? "NON_DCR" : "DCR";
}

/** True when bill/CRM connection text indicates C&I / HT supply. */
export function isCommercialConnectionType(connectionType: string | null | undefined): boolean {
  const raw = (connectionType ?? "").trim();
  if (!raw) return false;
  if (!isPmSuryaGharSubsidyEligible(raw)) return true;
  return /commercial|industrial|\bht\b|high tension|extra high/i.test(raw);
}

/** Non-DCR when C&I connection or plant strictly above 8 kW. */
export function commercialRequiresNonDcrTrack(
  connectionType: string | null | undefined,
  plantKw: number
): boolean {
  if (isCommercialConnectionType(connectionType)) return true;
  return plantKw > COMMERCIAL_NON_DCR_KW_THRESHOLD;
}

export function resolveCommercialPanelTrack(
  connectionType: string | null | undefined,
  plantKw: number
): CommercialPanelTrack {
  return commercialRequiresNonDcrTrack(connectionType, plantKw) ? "non_dcr" : "dcr";
}

/** Apply track + refresh Smart catalog gross / implied ₹/Wp on the pricing config. */
export function applyCommercialPanelTrackPolicy(
  config: ResidentialProposalConfig,
  connectionType?: string | null
): ResidentialProposalConfig {
  const conn = (connectionType ?? config.connectionType ?? "").trim();
  const track = resolveCommercialPanelTrack(conn, config.solar.plantCapacityKw);
  const entry = getActiveCatalogEntry(config);

  let next: ResidentialProposalConfig = {
    ...config,
    ...(conn ? { connectionType: conn } : {}),
    solar: { ...config.solar, panelTrack: track },
  };

  if (entry) {
    next = syncSolarAndPricingFromEntry(next, entry, track);
  }

  return next;
}
