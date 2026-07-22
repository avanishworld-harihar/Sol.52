import type { PanelSpec } from "@/lib/panel-layout";

/**
 * Curated India-market modules for Design Studio packing.
 * Sizes are typical mono frame footprints (mm) — not live-scraped.
 * Custom org modules live in browser storage (see custom helpers below).
 */
function mod(
  catalog_id: string,
  manufacturer: string,
  wattage: number,
  width_mm: number,
  height_mm: number
): PanelSpec {
  return {
    catalog_id,
    manufacturer,
    model: `${wattage}W Mono`,
    wattage,
    width_mm,
    height_mm,
  };
}

/** Common large-format footprints used across Indian Tier-1 SKUs. */
const F540 = [1134, 2278] as const;
const F580 = [1134, 2279] as const;
const F600 = [1134, 2384] as const;
const F650 = [1303, 2384] as const;
const F700 = [1303, 2465] as const;

export const PANEL_MODULE_CATALOG: PanelSpec[] = [
  // Waaree
  mod("waaree-540", "Waaree", 540, ...F540),
  mod("waaree-550", "Waaree", 550, ...F540),
  mod("waaree-575", "Waaree", 575, ...F540),
  mod("waaree-580", "Waaree", 580, ...F580),
  mod("waaree-590", "Waaree", 590, ...F580),
  mod("waaree-600", "Waaree", 600, ...F600),
  mod("waaree-610", "Waaree", 610, ...F600),
  mod("waaree-650", "Waaree", 650, ...F650),
  mod("waaree-670", "Waaree", 670, ...F650),
  mod("waaree-700", "Waaree", 700, ...F700),

  // Adani Solar
  mod("adani-540", "Adani Solar", 540, ...F540),
  mod("adani-550", "Adani Solar", 550, ...F540),
  mod("adani-575", "Adani Solar", 575, ...F540),
  mod("adani-585", "Adani Solar", 585, ...F580),
  mod("adani-600", "Adani Solar", 600, ...F600),
  mod("adani-610", "Adani Solar", 610, ...F600),
  mod("adani-650", "Adani Solar", 650, ...F650),
  mod("adani-700", "Adani Solar", 700, ...F700),

  // Tata Power Solar
  mod("tata-540", "Tata Power Solar", 540, ...F540),
  mod("tata-550", "Tata Power Solar", 550, ...F540),
  mod("tata-580", "Tata Power Solar", 580, ...F580),
  mod("tata-600", "Tata Power Solar", 600, ...F600),
  mod("tata-650", "Tata Power Solar", 650, ...F650),

  // Vikram Solar
  mod("vikram-540", "Vikram Solar", 540, ...F540),
  mod("vikram-550", "Vikram Solar", 550, ...F540),
  mod("vikram-575", "Vikram Solar", 575, ...F540),
  mod("vikram-600", "Vikram Solar", 600, ...F600),
  mod("vikram-650", "Vikram Solar", 650, ...F650),
  mod("vikram-700", "Vikram Solar", 700, ...F700),

  // RenewSys
  mod("renewsys-540", "RenewSys", 540, ...F540),
  mod("renewsys-550", "RenewSys", 550, ...F540),
  mod("renewsys-580", "RenewSys", 580, ...F580),
  mod("renewsys-600", "RenewSys", 600, ...F600),
  mod("renewsys-650", "RenewSys", 650, ...F650),

  // Gautam Solar
  mod("gautam-540", "Gautam Solar", 540, ...F540),
  mod("gautam-550", "Gautam Solar", 550, ...F540),
  mod("gautam-580", "Gautam Solar", 580, ...F580),
  mod("gautam-600", "Gautam Solar", 600, ...F600),

  // Premier Energies
  mod("premier-545", "Premier Energies", 545, ...F540),
  mod("premier-580", "Premier Energies", 580, ...F580),
  mod("premier-600", "Premier Energies", 600, ...F600),
  mod("premier-650", "Premier Energies", 650, ...F650),

  // Luminous
  mod("luminous-580", "Luminous", 580, ...F580),
  mod("luminous-600", "Luminous", 600, ...F600),
  mod("luminous-650", "Luminous", 650, ...F650),

  // Generic fallbacks
  mod("generic-540", "Generic", 540, ...F540),
  mod("generic-550", "Generic", 550, ...F540),
  mod("generic-580", "Generic", 580, ...F580),
  mod("generic-600", "Generic", 600, ...F600),
  mod("generic-650", "Generic", 650, ...F650),
  mod("generic-700", "Generic", 700, ...F700),
  mod("generic-750", "Generic", 750, ...F700),
];

const CUSTOM_STORAGE_KEY = "sol52-custom-panel-modules-v1";

function slugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function readCustomPanelModules(): PanelSpec[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PanelSpec[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.model === "string" &&
        typeof item.wattage === "number" &&
        typeof item.width_mm === "number" &&
        typeof item.height_mm === "number"
    );
  } catch {
    return [];
  }
}

function writeCustomPanelModules(items: PanelSpec[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
}

/** Built-in + browser custom modules (Design Studio client). */
export function getPanelModuleCatalog(): PanelSpec[] {
  const custom = readCustomPanelModules();
  if (custom.length === 0) return PANEL_MODULE_CATALOG;
  const seen = new Set(PANEL_MODULE_CATALOG.map((item) => item.catalog_id ?? item.model));
  const extras = custom.filter((item) => {
    const key = item.catalog_id ?? item.model;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...PANEL_MODULE_CATALOG, ...extras];
}

export function upsertCustomPanelModule(input: {
  manufacturer: string;
  wattage: number;
  width_mm: number;
  height_mm: number;
}): PanelSpec {
  const manufacturer = input.manufacturer.trim() || "Custom";
  const wattage = Math.round(input.wattage);
  const width_mm = Math.round(input.width_mm);
  const height_mm = Math.round(input.height_mm);
  const catalog_id = `custom-${slugPart(manufacturer)}-${wattage}-${width_mm}x${height_mm}`;
  const next: PanelSpec = {
    catalog_id,
    manufacturer,
    model: `${wattage}W Mono (custom)`,
    wattage,
    width_mm,
    height_mm,
  };
  const existing = readCustomPanelModules().filter((item) => item.catalog_id !== catalog_id);
  writeCustomPanelModules([next, ...existing]);
  return next;
}

export function removeCustomPanelModule(catalogId: string): void {
  writeCustomPanelModules(
    readCustomPanelModules().filter((item) => item.catalog_id !== catalogId)
  );
}

export const DEFAULT_PANEL_MODULE =
  PANEL_MODULE_CATALOG.find((item) => item.catalog_id === "waaree-550") ??
  PANEL_MODULE_CATALOG[0]!;

export function panelModuleBrands(catalog: PanelSpec[] = getPanelModuleCatalog()): string[] {
  return Array.from(
    new Set(catalog.map((item) => item.manufacturer?.trim() || "Generic").filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export function panelModulesForBrand(
  brand: string,
  catalog: PanelSpec[] = getPanelModuleCatalog()
): PanelSpec[] {
  return catalog
    .filter((item) => (item.manufacturer?.trim() || "Generic") === brand)
    .sort((a, b) => a.wattage - b.wattage);
}

export function panelModuleLabel(spec: PanelSpec): string {
  const brand = spec.manufacturer?.trim() || "Module";
  return `${brand} · ${spec.wattage}W`;
}

/** Parse "5 kW", "5kW", "5.5" → number or null. */
export function parseCapacityKwText(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Prefer brand + watt match; else closest watt in catalog. */
export function resolvePanelSpecFromProject(opts: {
  panelWatt?: number | null;
  panelBrand?: string | null;
}): PanelSpec {
  const catalog = getPanelModuleCatalog();
  const watt = opts.panelWatt != null && opts.panelWatt > 0 ? opts.panelWatt : null;
  const brandHint = opts.panelBrand?.trim().toLowerCase() ?? "";

  if (watt != null && brandHint) {
    const brandMatch = catalog.find(
      (item) =>
        item.wattage === watt &&
        (item.manufacturer?.trim().toLowerCase().includes(brandHint) ||
          brandHint.includes(item.manufacturer?.trim().toLowerCase() ?? ""))
    );
    if (brandMatch) return brandMatch;
  }

  if (watt != null) {
    let best = catalog[0]!;
    let bestDelta = Math.abs(best.wattage - watt);
    for (const item of catalog) {
      const delta = Math.abs(item.wattage - watt);
      if (delta < bestDelta) {
        best = item;
        bestDelta = delta;
      }
    }
    return best;
  }

  if (brandHint) {
    const byBrand = catalog.find((item) =>
      item.manufacturer?.trim().toLowerCase().includes(brandHint)
    );
    if (byBrand) return byBrand;
  }

  return DEFAULT_PANEL_MODULE;
}
