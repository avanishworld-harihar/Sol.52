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
  parserVersion: z.string().max(40).optional(),
  extractedFields: z.array(z.string().max(80)).max(40).optional(),
  candidate: z.object({
    kind: z.enum(["module", "inverter"]),
    confidence: z.number().min(0).max(1),
    extractedAt: z.string(),
    changedFields: z.array(z.string().max(80)).max(40),
    profile: z.union([pvModuleProfileSchema, inverterProfileSchema]),
  }).optional(),
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

const WAAREE_BIN08_SOURCE =
  "https://waaree.com/upload/media/elite_series_bin_08_565_600_wel_epd_565_600_144_bin_hc_09_03012025_1756378918.pdf";

const waareeBin08Rows = [
  [565, 43.56, 12.97, 51.9, 13.75, 21.87],
  [570, 43.71, 13.04, 52.1, 13.81, 22.07],
  [575, 43.86, 13.11, 52.3, 13.87, 22.26],
  [580, 44.01, 13.18, 52.5, 13.93, 22.45],
  [585, 44.15, 13.25, 52.7, 13.99, 22.65],
  [590, 44.29, 13.32, 52.9, 14.05, 22.84],
  [595, 44.44, 13.39, 53.1, 14.11, 23.03],
  [600, 44.61, 13.45, 53.3, 14.17, 23.23],
] as const;

const waareeBin08Modules: PvModuleProfile[] = waareeBin08Rows.map(
  ([watt, vmpV, impA, vocV, iscA, efficiencyPct]) => ({
    id: `waaree-bin-08-${watt}`,
    manufacturer: "Waaree",
    model: `BiN-08-${watt}`,
    watt,
    technology: "N-Type TOPCon bifacial dual-glass",
    vocV,
    vmpV,
    iscA,
    impA,
    vocTempCoeffPctC: -0.26,
    pmaxTempCoeffPctC: -0.3,
    maxSystemVoltageV: 1_500,
    efficiencyPct,
    widthMm: 1_134,
    heightMm: 2_278,
    cells: "144 half-cut",
    verification: "verified",
    revision: 1,
    source: { kind: "manufacturer_datasheet", url: WAAREE_BIN08_SOURCE },
  })
);

const ADANI_SHINE_SOURCE =
  "https://www.adanisolar.com/-/media/Project/AdaniSolar/Downloads/pdf/newdatasheet1/Shine-TOPCon-G2G-modules-Gen-II.pdf";

const adaniShineModules: PvModuleProfile[] = [
  [575, 43.78, 13.14, 52.3, 13.89, 22.3],
  [580, 43.98, 13.19, 52.5, 13.95, 22.5],
].map(([watt, vmpV, impA, vocV, iscA, efficiencyPct]) => ({
  id: `adani-shine-asb-m10-144-${watt}`,
  manufacturer: "Adani Solar",
  model: `ASB-M10-144-${watt}`,
  watt,
  technology: "N-Type TOPCon bifacial dual-glass",
  vocV,
  vmpV,
  iscA,
  impA,
  vocTempCoeffPctC: -0.24,
  pmaxTempCoeffPctC: -0.32,
  maxSystemVoltageV: 1_500,
  efficiencyPct,
  widthMm: 1_133,
  heightMm: 2_278,
  cells: "144 half-cut",
  verification: "verified",
  revision: 1,
  source: { kind: "manufacturer_datasheet", url: ADANI_SHINE_SOURCE },
}));

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

const sungrowSg5RsL: InverterProfile = {
  id: "sungrow-sg5-0rs-l",
  manufacturer: "Sungrow",
  model: "SG5.0RS-L",
  ratedAcKw: 5,
  phase: "single_phase",
  maxPvPowerKw: 7.5,
  maxDcVoltageV: 600,
  startupVoltageV: 50,
  mpptMinV: 40,
  mpptMaxV: 560,
  mpptCount: 2,
  stringsPerMppt: 1,
  maxInputCurrentPerMpptA: 16,
  maxShortCircuitCurrentPerMpptA: 20,
  maxDcAcRatio: 1.5,
  verification: "verified",
  revision: 1,
  source: {
    kind: "manufacturer_datasheet",
    url: "https://info-support.sungrowpower.com/application/pdf/2023/07/03/DS_20230617_SG4.0_5.0_6.0RS-L_Datasheet_V13_EN%EF%BC%88India%EF%BC%89.pdf",
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

const additionalModuleBrands = [
  "Vikram Solar",
  "RenewSys",
  "LONGi",
  "Jinko Solar",
  "Tata Power Solar",
  "Rayzon Solar",
  "Premier Energies",
] as const;
const additionalModuleWatts = [540, 550, 575, 580, 590, 600, 610, 625] as const;

/**
 * Brand-aware design envelopes make additional manufacturers selectable today,
 * without presenting guessed electrical values as manufacturer-verified data.
 * The sync/review pipeline can replace each stable id with an approved datasheet
 * revision later, without changing saved proposal selections.
 */
const additionalIndicativeModules: PvModuleProfile[] = additionalModuleBrands.flatMap((manufacturer) =>
  additionalModuleWatts.map((watt) =>
    buildIndicativeModuleProfile({ manufacturer, model: `${watt} W design envelope`, watt })
  )
);

const additionalInverterBrands = [
  "Polycab",
  "Waaree",
  "Havells",
  "Vesole",
  "Luminous",
  "Solis",
  "Growatt",
  "GoodWe",
  "Delta",
] as const;
const residentialInverterRatings = [3, 5, 6, 8, 10] as const;
const commercialInverterRatings = [10, 15, 20, 25, 50, 100] as const;

const additionalIndicativeInverters: InverterProfile[] = additionalInverterBrands.flatMap(
  (manufacturer) => [
    ...residentialInverterRatings.map((ratedAcKw) =>
      buildIndicativeInverterProfile({
        manufacturer,
        model: `${ratedAcKw} kW single-phase design envelope`,
        ratedAcKw,
        phase: "single_phase",
      })
    ),
    ...commercialInverterRatings.map((ratedAcKw) =>
      buildIndicativeInverterProfile({
        manufacturer,
        model: `${ratedAcKw} kW three-phase design envelope`,
        ratedAcKw,
        phase: "three_phase",
      })
    ),
  ]
);

export const BUILT_IN_EQUIPMENT_LIBRARY: EquipmentLibrary = equipmentLibrarySchema.parse({
  schemaVersion: 1,
  revision: 1,
  modules: [
    waaree700,
    ...waareeBin08Modules,
    ...adaniShineModules,
    ...additionalIndicativeModules,
  ],
  inverters: [
    sungrowMg5rl,
    sungrowSg5RsL,
    sungrowSg110cx,
    ...additionalIndicativeInverters,
  ],
  sources: [],
  lastSyncedAt: null,
});

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function manufacturerKey(value: string | null | undefined): string {
  return norm(value)
    .replace(/\b(?:solar|energies|energy|power|limited|ltd|pvt|private)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveModuleProfile(
  library: EquipmentLibrary,
  input: { catalogId?: string | null; manufacturer?: string | null; model?: string | null; watt: number }
): PvModuleProfile {
  const byId = input.catalogId
    ? library.modules.find((entry) => entry.id === input.catalogId)
    : undefined;
  if (byId) return byId;
  const manufacturer = manufacturerKey(input.manufacturer);
  const model = norm(input.model);
  const exact = library.modules.find(
    (entry) =>
      entry.watt === Math.round(input.watt) &&
      (!manufacturer || manufacturerKey(entry.manufacturer) === manufacturer) &&
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
  const manufacturer = manufacturerKey(input.manufacturer);
  const model = norm(input.model);
  const exact = library.inverters.find(
    (entry) =>
      (!manufacturer || manufacturerKey(entry.manufacturer) === manufacturer) &&
      (!model || norm(entry.model) === model) &&
      (!input.phase || entry.phase === input.phase) &&
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

/** Promote one quarantined official-source candidate after human review. */
export function approveEquipmentCandidate(
  library: EquipmentLibrary,
  equipmentId: string
): EquipmentLibrary {
  const source = library.sources.find((entry) => entry.equipmentId === equipmentId);
  if (!source?.candidate) throw new Error("No review candidate is available for this equipment.");
  const candidate = source.candidate;
  const modules = [...library.modules];
  const inverters = [...library.inverters];
  if (candidate.kind === "module") {
    const index = modules.findIndex((entry) => entry.id === equipmentId);
    if (index < 0) throw new Error("Module profile not found.");
    const profile = pvModuleProfileSchema.parse({
      ...candidate.profile,
      id: equipmentId,
      verification: "verified",
    });
    modules[index] = profile;
  } else {
    const index = inverters.findIndex((entry) => entry.id === equipmentId);
    if (index < 0) throw new Error("Inverter profile not found.");
    const profile = inverterProfileSchema.parse({
      ...candidate.profile,
      id: equipmentId,
      verification: "verified",
    });
    inverters[index] = profile;
  }
  return equipmentLibrarySchema.parse({
    ...library,
    revision: library.revision + 1,
    modules,
    inverters,
    sources: library.sources.map((entry) =>
      entry.equipmentId === equipmentId
        ? {
            ...entry,
            status: "current" as const,
            message: `Revision approved with ${candidate.changedFields.length} reviewed engineering field(s).`,
            candidate: undefined,
          }
        : entry
    ),
  });
}
