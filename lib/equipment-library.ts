import { z } from "zod";
import {
  buildIndicativeInverterProfile,
  buildIndicativeModuleProfile,
  inverterProfileSchema,
  pvModuleProfileSchema,
  type InverterProfile,
  type PvModuleProfile,
} from "@/lib/equipment-engineering";

export const equipmentSourceStateSchema = z.object({
  equipmentId: z.string().min(1).max(120),
  url: z.string().url(),
  checkedAt: z.string(),
  contentHash: z.string().optional(),
  status: z.enum(["current", "changed", "review_required", "fetch_failed"]),
  message: z.string().max(500).optional(),
});

export const equipmentLibrarySchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().min(1),
  modules: z.array(pvModuleProfileSchema).max(2_000),
  inverters: z.array(inverterProfileSchema).max(2_000),
  sources: z.array(equipmentSourceStateSchema).max(4_000).default([]),
  lastSyncedAt: z.string().nullable().default(null),
});

export type EquipmentLibrary = z.infer<typeof equipmentLibrarySchema>;
export type EquipmentSourceState = z.infer<typeof equipmentSourceStateSchema>;

const waaree700: PvModuleProfile = {
  ...buildIndicativeModuleProfile({
    manufacturer: "Waaree",
    model: "BiN-03-700",
    watt: 700,
  }),
  id: "waaree-bin-03-700",
  model: "BiN-03-700",
  technology: "TOPCon N-Type bifacial",
  efficiencyPct: 22.32,
  widthMm: 1302,
  heightMm: 2390,
  cells: "132 half-cut",
  verification: "review_required",
  source: {
    kind: "manufacturer_page",
    url: "https://shop.waaree.com/waaree-700wp-topcon-n-type-bifacial-solar-panel-m12-g2g-132-cells-dual-glass-high-efficiency-solar-module-for-rooftop-commercial-use/",
  },
};

const sungrowMg5rl: InverterProfile = {
  id: "sungrow-mg5rl",
  manufacturer: "Sungrow",
  model: "MG5RL",
  ratedAcKw: 5,
  phase: "single_phase",
  maxPvPowerKw: 10,
  maxDcVoltageV: 500,
  startupVoltageV: 50,
  mpptMinV: 40,
  mpptMaxV: 425,
  mpptCount: 2,
  stringsPerMppt: 1,
  maxInputCurrentPerMpptA: 20,
  maxShortCircuitCurrentPerMpptA: 25,
  maxDcAcRatio: 1.6,
  verification: "verified",
  revision: 1,
  source: {
    kind: "manufacturer_datasheet",
    url: "https://info-support.sungrowpower.com/datasheet-materials/de58dcf3-84b9-4f96-af76-f00a9df37dfa.pdf",
  },
};

const sungrowSg110cx: InverterProfile = {
  id: "sungrow-sg110cx",
  manufacturer: "Sungrow",
  model: "SG110CX",
  ratedAcKw: 110,
  phase: "three_phase",
  maxPvPowerKw: 143,
  maxDcVoltageV: 1_100,
  startupVoltageV: 250,
  mpptMinV: 200,
  mpptMaxV: 1_000,
  mpptCount: 9,
  stringsPerMppt: 2,
  maxInputCurrentPerMpptA: 26,
  maxShortCircuitCurrentPerMpptA: 40,
  maxDcAcRatio: 1.3,
  verification: "verified",
  revision: 1,
  source: {
    kind: "manufacturer_datasheet",
    url: "https://en.sungrowpower.com/upload/documentFile/DS_SG110CX%20Datasheet_V14_EN.pdf.pdf",
  },
};

export const BUILT_IN_EQUIPMENT_LIBRARY: EquipmentLibrary = equipmentLibrarySchema.parse({
  schemaVersion: 1,
  revision: 1,
  modules: [waaree700],
  inverters: [sungrowMg5rl, sungrowSg110cx],
  sources: [],
  lastSyncedAt: null,
});

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function resolveModuleProfile(
  library: EquipmentLibrary,
  input: { catalogId?: string | null; manufacturer?: string | null; model?: string | null; watt: number }
): PvModuleProfile {
  const byId = input.catalogId
    ? library.modules.find((entry) => entry.id === input.catalogId)
    : undefined;
  if (byId) return byId;
  const manufacturer = norm(input.manufacturer);
  const model = norm(input.model);
  const exact = library.modules.find(
    (entry) =>
      entry.watt === Math.round(input.watt) &&
      (!manufacturer || norm(entry.manufacturer) === manufacturer) &&
      (!model || norm(entry.model) === model)
  );
  return exact ?? buildIndicativeModuleProfile(input);
}

export function resolveInverterProfile(
  library: EquipmentLibrary,
  input: {
    catalogId?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    ratedAcKw: number;
    phase?: "single_phase" | "three_phase";
  }
): InverterProfile {
  const byId = input.catalogId
    ? library.inverters.find((entry) => entry.id === input.catalogId)
    : undefined;
  if (byId) return byId;
  const manufacturer = norm(input.manufacturer);
  const model = norm(input.model);
  const exact = library.inverters.find(
    (entry) =>
      (!manufacturer || norm(entry.manufacturer) === manufacturer) &&
      (!model || norm(entry.model) === model) &&
      Math.abs(entry.ratedAcKw - input.ratedAcKw) <= 0.2
  );
  return exact ?? buildIndicativeInverterProfile(input);
}

export function mergeEquipmentLibraries(
  base: EquipmentLibrary,
  incoming: Pick<EquipmentLibrary, "modules" | "inverters">
): EquipmentLibrary {
  const moduleMap = new Map(base.modules.map((entry) => [entry.id, entry]));
  const inverterMap = new Map(base.inverters.map((entry) => [entry.id, entry]));
  incoming.modules.forEach((entry) => moduleMap.set(entry.id, pvModuleProfileSchema.parse(entry)));
  incoming.inverters.forEach((entry) => inverterMap.set(entry.id, inverterProfileSchema.parse(entry)));
  return equipmentLibrarySchema.parse({
    ...base,
    revision: base.revision + 1,
    modules: [...moduleMap.values()],
    inverters: [...inverterMap.values()],
  });
}
