/**
 * Commercial BOM — DCR / Non-DCR solar module lines inside proposal_pricing.line_items.
 */

import { PANEL_CATALOG, type PanelType } from "@/lib/commercial-panel-catalog";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import {
  defaultLabelForKind,
  lineItemTotalInr,
  newPricingLineId,
  type PanelTrack,
  type PricingLineItem,
} from "@/lib/proposal-pricing-lines";
import { defaultCatalogCategoryForLineKind } from "@/lib/epc-component-catalog";

export const COMMERCIAL_PANEL_WATT_PRESETS = [540, 550, 575, 580, 590, 625, 700] as const;

export function isTrackedCommercialPanelLine(L: PricingLineItem): boolean {
  return L.kind === "panels" && (L.panel_track === "dcr" || L.panel_track === "non_dcr");
}

export function moduleCountForPlant(systemKw: number, watt: number): number {
  const w = Math.max(100, Math.round(Number(watt) || 540));
  const kw = Math.max(0, Number(systemKw) || 0);
  if (kw <= 0) return 1;
  return Math.max(1, Math.ceil((kw * 1000) / w));
}

/** DC nameplate (kWp) from AC plant size — e.g. 100 kW @ 540 Wp → 100.44 kWp */
export function commercialDcCapacityKwp(systemKw: number, watt = 540): number {
  const w = Math.max(100, Math.round(Number(watt) || 540));
  const modules = moduleCountForPlant(systemKw, w);
  return Math.round((modules * w) / 10) / 100;
}

export function ratePerWpFromPanelLine(line: PricingLineItem): number {
  const watt = Math.max(100, Math.round(Number(line.watt) || 540));
  const qty = Math.max(1, Number(line.quantity) || 1);
  const total = lineItemTotalInr(line);
  const plantWp = qty * watt;
  if (plantWp <= 0) return 0;
  return Math.round((total / plantWp) * 100) / 100;
}

export function brandIdFromLineBrand(brand: string): string {
  const b = brand.trim();
  if (!b) return "waaree";
  const byLabel = PANEL_CATALOG.find((e) => e.brandLabel.toLowerCase() === b.toLowerCase());
  if (byLabel) return byLabel.brandId;
  const byId = PANEL_CATALOG.find((e) => e.brandId === b.toLowerCase());
  if (byId) return byId.brandId;
  return b.toLowerCase().replace(/\s+/g, "-").slice(0, 40);
}

function panelTypeForTrack(track: PanelTrack): PanelType {
  return track === "dcr" ? "DCR" : "NON_DCR";
}

export function findCatalogIdForTrack(brandId: string, watt: number, track: PanelTrack): string | null {
  const entry = PANEL_CATALOG.find(
    (e) => e.brandId === brandId && e.watt === watt && e.panelType === panelTypeForTrack(track)
  );
  return entry?.id ?? null;
}

export function createCommercialPanelLine(
  track: PanelTrack,
  systemKw: number,
  seed?: Partial<PricingLineItem>
): PricingLineItem {
  const watt = seed?.watt ?? 540;
  const moduleCount = moduleCountForPlant(systemKw, watt);
  const defaultRateWp = track === "dcr" ? 42 : 38;
  const brand = seed?.brand ?? "Waaree";
  return {
    id: seed?.id ?? newPricingLineId(),
    kind: "panels",
    label:
      seed?.label ??
      (track === "dcr" ? "Solar modules (DCR)" : "Solar modules (Non-DCR)"),
    brand,
    quantity: seed?.quantity ?? moduleCount,
    unit_rate_inr: seed?.unit_rate_inr ?? Math.round(watt * defaultRateWp),
    unit: seed?.unit ?? "nos",
    catalog_category: "solar_panels",
    panel_track: track,
    watt,
    technology: seed?.technology ?? (track === "dcr" ? "Mono PERC" : "PERC"),
    notes: seed?.notes,
  };
}

/** Ensures one DCR panel line in the BOM (Non-DCR lines removed). */
export function ensureCommercialPanelLines(lines: PricingLineItem[], systemKw: number): PricingLineItem[] {
  let next = lines.filter((l) => !(l.kind === "panels" && l.panel_track === "non_dcr"));
  const tracks: PanelTrack[] = ["dcr"];

  for (const track of tracks) {
    const existing = next.findIndex((l) => l.kind === "panels" && l.panel_track === track);
    if (existing >= 0) continue;

    const untrackedIdx = next.findIndex((l) => l.kind === "panels" && !l.panel_track);
    if (untrackedIdx >= 0) {
      const u = next[untrackedIdx];
      next[untrackedIdx] = {
        ...u,
        panel_track: "dcr",
        label: "Solar modules (DCR)",
        watt: u.watt ?? 540,
        technology: u.technology ?? "Mono PERC",
      };
      continue;
    }

    const firstPanelIdx = next.findIndex((l) => l.kind === "panels");
    const line = createCommercialPanelLine(track, systemKw);
    if (firstPanelIdx >= 0) {
      next.splice(firstPanelIdx, 0, line);
    } else {
      next.unshift(line);
    }
  }

  next = next.filter((l) => !(l.kind === "panels" && !l.panel_track));

  return next;
}

export function recalcCommercialPanelQuantities(lines: PricingLineItem[], systemKw: number): PricingLineItem[] {
  return lines.map((L) => {
    if (!isTrackedCommercialPanelLine(L)) return L;
    const watt = Math.max(100, Math.round(Number(L.watt) || 540));
    return { ...L, quantity: moduleCountForPlant(systemKw, watt) };
  });
}

export function defaultCommercialPanelLineItems(
  opts: {
    hardware_inr: number;
    installation_inr: number;
    structure_inr: number;
    subsidy_inr: number;
    discount_inr: number;
    system_kw: number;
    panelBrandHint?: string | null;
  }
): PricingLineItem[] {
  const brand = (opts.panelBrandHint ?? "").trim() || "Waaree";
  const dcr = createCommercialPanelLine("dcr", opts.system_kw, { brand });

  const seed = (
    kind: PricingLineItem["kind"],
    extra: Partial<Pick<PricingLineItem, "brand" | "unit_rate_inr" | "unit">>
  ): PricingLineItem => ({
    id: newPricingLineId(),
    kind,
    label: defaultLabelForKind(kind),
    brand: extra.brand ?? "",
    quantity: 1,
    unit_rate_inr: extra.unit_rate_inr ?? 0,
    unit: extra.unit ?? "nos",
    catalog_category: defaultCatalogCategoryForLineKind(kind),
  });

  const panelHardware = Math.max(0, Math.round(opts.hardware_inr));
  if (panelHardware > 0) {
    dcr.unit_rate_inr = Math.round(panelHardware / Math.max(1, dcr.quantity));
  }

  return [
    dcr,
    seed("inverter", {}),
    seed("structure", { unit_rate_inr: Math.max(0, Math.round(opts.structure_inr)) }),
    seed("acdb_dcdb", {}),
    seed("cabling", {}),
    seed("earthing", {}),
    seed("installation", { unit_rate_inr: Math.max(0, Math.round(opts.installation_inr)) }),
    seed("transportation", {}),
    seed("net_metering", {}),
    seed("electricals", {}),
    seed("battery", {}),
    seed("subsidy", { unit_rate_inr: Math.max(0, Math.round(opts.subsidy_inr)) }),
    seed("discount", { unit_rate_inr: Math.max(0, Math.round(opts.discount_inr)) }),
  ];
}

/** Maps BOM panel lines → commercialConfig for web DCR comparison blocks. */
export function syncCommercialConfigFromPanelLines(
  config: CommercialProposalConfig,
  lines: PricingLineItem[],
  _systemKw: number
): CommercialProposalConfig {
  const dcrLine = lines.find((l) => l.kind === "panels" && l.panel_track === "dcr");
  if (!dcrLine) return config;

  const reg = { ...(config.panelRegistry ?? {}) };
  const overrides = { ...(reg.overrides ?? {}) };
  const watt = Math.max(100, Math.round(Number(dcrLine.watt) || 540));
  const brandId = brandIdFromLineBrand(dcrLine.brand);
  const catalogId =
    findCatalogIdForTrack(brandId, watt, "dcr") ?? `${brandId}-${watt}-dcr`;
  const rate = ratePerWpFromPanelLine(dcrLine);
  overrides[catalogId] = { ...overrides[catalogId], ratePerWpInr: rate };
  reg.selectedDcrCatalogId = catalogId;

  const next: CommercialProposalConfig = {
    ...config,
    panelRegistry: { ...reg, overrides, selectedNonDcrCatalogId: undefined },
    panel: {
      catalogId,
      brandId,
      watt,
      panelType: "DCR",
      ratePerWpInr: rate,
      technology: dcrLine.technology,
    },
    dcrComparison: {
      enabled: false,
      brandId,
      watt,
    },
  };

  return next;
}
