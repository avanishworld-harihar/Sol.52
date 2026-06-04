/**
 * Commercial panel track policy — DCR (ALMM) only for new quotes.
 * Non-DCR retired from commercial flows (May 2026 compliance path).
 */

import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import {
  getActiveCatalogEntry,
  syncSolarAndPricingFromEntry,
} from "@/lib/residential-brand-catalog";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

/** @deprecated Non-DCR no longer offered — kept for type compat only. */
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

/** @deprecated Always false — commercial quotes use DCR only. */
export function commercialRequiresNonDcrTrack(
  _connectionType: string | null | undefined,
  _plantKw: number
): boolean {
  return false;
}

export function resolveCommercialPanelTrack(
  _connectionType: string | null | undefined,
  _plantKw: number
): CommercialPanelTrack {
  return "dcr";
}

/** Apply DCR track + refresh Smart catalog gross / implied ₹/Wp from rate card. */
export function applyCommercialPanelTrackPolicy(
  config: ResidentialProposalConfig,
  connectionType?: string | null
): ResidentialProposalConfig {
  const conn = (connectionType ?? config.connectionType ?? "").trim();
  const track: CommercialPanelTrack = "dcr";
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
