import type { PanelSpec } from "@/lib/panel-layout";

/**
 * Common India-market module sizes for Design Studio Phase 2.
 * Dimensions are typical 72-cell / large-format mono frames (mm).
 * Not coupled to proposal pricing snapshots.
 */
export const PANEL_MODULE_CATALOG: PanelSpec[] = [
  {
    catalog_id: "adani-540",
    manufacturer: "Adani Solar",
    model: "540W Mono",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "adani-550",
    manufacturer: "Adani Solar",
    model: "550W Mono",
    wattage: 550,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "waaree-540",
    manufacturer: "Waaree",
    model: "540W Mono",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "waaree-550",
    manufacturer: "Waaree",
    model: "550W Mono",
    wattage: 550,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "waaree-580",
    manufacturer: "Waaree",
    model: "580W Mono",
    wattage: 580,
    width_mm: 1134,
    height_mm: 2279,
  },
  {
    catalog_id: "gautam-540",
    manufacturer: "Gautam Solar",
    model: "540W Mono",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "gautam-550",
    manufacturer: "Gautam Solar",
    model: "550W Mono",
    wattage: 550,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "renewsys-540",
    manufacturer: "RenewSys",
    model: "540W Mono",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "renewsys-550",
    manufacturer: "RenewSys",
    model: "550W Mono",
    wattage: 550,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "premier-545",
    manufacturer: "Premier Energies",
    model: "545W Mono",
    wattage: 545,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "tata-540",
    manufacturer: "Tata Power Solar",
    model: "540W Mono",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "tata-550",
    manufacturer: "Tata Power Solar",
    model: "550W Mono",
    wattage: 550,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "vikram-540",
    manufacturer: "Vikram Solar",
    model: "540W Mono",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "vikram-575",
    manufacturer: "Vikram Solar",
    model: "575W Mono",
    wattage: 575,
    width_mm: 1134,
    height_mm: 2278,
  },
  {
    catalog_id: "lorex-580",
    manufacturer: "Luminous",
    model: "580W Mono",
    wattage: 580,
    width_mm: 1134,
    height_mm: 2279,
  },
  {
    catalog_id: "generic-600",
    manufacturer: "Generic",
    model: "600W Mono",
    wattage: 600,
    width_mm: 1134,
    height_mm: 2384,
  },
];

export const DEFAULT_PANEL_MODULE =
  PANEL_MODULE_CATALOG.find((item) => item.catalog_id === "waaree-550") ??
  PANEL_MODULE_CATALOG[0]!;

export function panelModuleBrands(): string[] {
  return Array.from(
    new Set(
      PANEL_MODULE_CATALOG.map((item) => item.manufacturer?.trim() || "Generic").filter(Boolean)
    )
  );
}

export function panelModulesForBrand(brand: string): PanelSpec[] {
  return PANEL_MODULE_CATALOG.filter(
    (item) => (item.manufacturer?.trim() || "Generic") === brand
  );
}

export function panelModuleLabel(spec: PanelSpec): string {
  const brand = spec.manufacturer?.trim() || "Module";
  return `${brand} · ${spec.wattage}W`;
}
