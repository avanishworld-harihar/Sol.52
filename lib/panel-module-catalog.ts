import type { PanelSpec } from "@/lib/panel-layout";

/** Small installer-facing catalog for Design Studio Phase 2 (not proposal-coupled). */
export const PANEL_MODULE_CATALOG: PanelSpec[] = [
  {
    catalog_id: "generic-540",
    manufacturer: "Generic",
    model: "540W Mono",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "generic-550",
    manufacturer: "Generic",
    model: "550W Mono",
    wattage: 550,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "generic-580",
    manufacturer: "Generic",
    model: "580W Mono",
    wattage: 580,
    width_mm: 1134,
    height_mm: 2279,
  },
];

export const DEFAULT_PANEL_MODULE = PANEL_MODULE_CATALOG[1]!;

export function panelModuleLabel(spec: PanelSpec): string {
  const brand = spec.manufacturer?.trim() || "Module";
  return `${brand} · ${spec.model} · ${spec.wattage}W`;
}
