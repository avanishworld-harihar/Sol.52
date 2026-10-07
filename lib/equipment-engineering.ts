import { z } from "zod";

export const EQUIPMENT_ENGINE_VERSION = "1.0.0";

const sourceMetaSchema = z.object({
  url: z.string().url().optional(),
  kind: z.enum(["manufacturer_page", "manufacturer_datasheet", "manual_verified", "design_envelope"]),
  checkedAt: z.string().optional(),
  contentHash: z.string().optional(),
});

export const pvModuleProfileSchema = z.object({
  id: z.string().min(1).max(120),
  manufacturer: z.string().min(1).max(120),
  model: z.string().min(1).max(160),
  watt: z.number().min(50).max(2_000),
  technology: z.string().max(120).optional(),
  vocV: z.number().positive().max(200),
  vmpV: z.number().positive().max(200),
  iscA: z.number().positive().max(100),
  impA: z.number().positive().max(100),
  vocTempCoeffPctC: z.number().min(-2).max(0),
  pmaxTempCoeffPctC: z.number().min(-2).max(0).optional(),
  maxSystemVoltageV: z.number().positive().max(2_000),
  efficiencyPct: z.number().positive().max(40).optional(),
  widthMm: z.number().int().min(100).max(5_000).optional(),
  heightMm: z.number().int().min(100).max(5_000).optional(),
  cells: z.string().max(80).optional(),
  verification: z.enum(["verified", "indicative", "review_required"]),
  revision: z.number().int().min(1).default(1),
  source: sourceMetaSchema,
});

export const inverterProfileSchema = z.object({
  id: z.string().min(1).max(120),
  manufacturer: z.string().min(1).max(120),
  model: z.string().min(1).max(160),
  ratedAcKw: z.number().positive().max(20_000),
  phase: z.enum(["single_phase", "three_phase"]),
  maxPvPowerKw: z.number().positive().max(30_000).optional(),
  maxDcVoltageV: z.number().positive().max(2_000),
  startupVoltageV: z.number().positive().max(2_000),
  mpptMinV: z.number().positive().max(2_000),
  mpptMaxV: z.number().positive().max(2_000),
  mpptCount: z.number().int().min(1).max(100),
  stringsPerMppt: z.number().int().min(1).max(20),
  maxInputCurrentPerMpptA: z.number().positive().max(1_000),
  maxShortCircuitCurrentPerMpptA: z.number().positive().max(2_000),
  maxDcAcRatio: z.number().min(1).max(3).optional(),
  verification: z.enum(["verified", "indicative", "review_required"]),
  revision: z.number().int().min(1).default(1),
  source: sourceMetaSchema,
});

export type PvModuleProfile = z.infer<typeof pvModuleProfileSchema>;
export type InverterProfile = z.infer<typeof inverterProfileSchema>;

export type EquipmentEngineeringSnapshot = {
  engineVersion: string;
  calculatedAt: string;
  status: "verified" | "indicative" | "invalid";
  module: PvModuleProfile;
  inverter: InverterProfile;
  targetAcKw: number;
  targetDcKw: number;
  actualDcKw: number;
  dcAcRatio: number;
  moduleCount: number;
  minModulesPerString: number;
  maxModulesPerString: number;
  stringCount: number;
  stringSizes: number[];
  mpptAllocation: number[][];
  moduleVocColdV: number;
  moduleVmpHotV: number;
  maxStringVocColdV: number;
  minStringVmpHotV: number;
  maxParallelStringsPerMppt: number;
  maxInputCurrentPerMpptA: number;
  maxShortCircuitCurrentPerMpptA: number;
  warnings: string[];
  errors: string[];
};

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function distribute(total: number, buckets: number): number[] {
  const safeBuckets = Math.max(1, Math.min(total, buckets));
  const base = Math.floor(total / safeBuckets);
  const extra = total % safeBuckets;
  return Array.from({ length: safeBuckets }, (_, index) => base + (index < extra ? 1 : 0));
}

function allocateMppts(stringSizes: number[], mpptCount: number): number[][] {
  const allocation = Array.from({ length: mpptCount }, () => [] as number[]);
  stringSizes.forEach((size, index) => allocation[index % mpptCount].push(size));
  return allocation.filter((rows) => rows.length > 0);
}

/**
 * One deterministic electrical sizing engine for every proposal preset.
 * A result is only `verified` when both selected equipment profiles come from
 * validated manufacturer data; design-envelope fallbacks remain visibly indicative.
 */
export function calculateEquipmentEngineering(input: {
  targetAcKw: number;
  targetDcAcRatio?: number;
  moduleCountOverride?: number | null;
  module: PvModuleProfile;
  inverter: InverterProfile;
  minCellTempC?: number;
  maxCellTempC?: number;
  calculatedAt?: string;
}): EquipmentEngineeringSnapshot {
  const moduleProfile = pvModuleProfileSchema.parse(input.module);
  const inverter = inverterProfileSchema.parse(input.inverter);
  const targetAcKw = Math.max(0.1, input.targetAcKw);
  const requestedRatio = Math.max(1, input.targetDcAcRatio ?? 1.1);
  const allowedRatio = inverter.maxDcAcRatio ?? 1.3;
  const targetDcAcRatio = Math.min(requestedRatio, allowedRatio);
  const targetDcKw = round(targetAcKw * targetDcAcRatio, 3);
  const moduleCount = Math.max(
    1,
    Math.round(input.moduleCountOverride ?? Math.ceil((targetDcKw * 1_000) / moduleProfile.watt))
  );
  const actualDcKw = round((moduleCount * moduleProfile.watt) / 1_000, 3);
  const dcAcRatio = round(actualDcKw / targetAcKw, 3);
  const minCellTempC = input.minCellTempC ?? 2;
  const maxCellTempC = input.maxCellTempC ?? 70;

  const moduleVocColdV = round(
    moduleProfile.vocV *
      (1 + (moduleProfile.vocTempCoeffPctC / 100) * (minCellTempC - 25)),
    2
  );
  const vmpCoeff = moduleProfile.pmaxTempCoeffPctC ?? moduleProfile.vocTempCoeffPctC;
  const moduleVmpHotV = round(
    moduleProfile.vmpV * (1 + (vmpCoeff / 100) * (maxCellTempC - 25)),
    2
  );

  const voltageCeiling = Math.min(inverter.maxDcVoltageV * 0.98, inverter.mpptMaxV);
  const maxModulesPerString = Math.max(1, Math.floor(voltageCeiling / moduleVocColdV));
  const minModulesPerString = Math.max(1, Math.ceil(inverter.mpptMinV / moduleVmpHotV));
  const maxStrings = inverter.mpptCount * inverter.stringsPerMppt;
  const errors: string[] = [];
  const warnings: string[] = [];

  let stringSizes: number[] = [];
  const minimumStringCount = Math.max(1, Math.ceil(moduleCount / maxModulesPerString));
  for (let count = minimumStringCount; count <= Math.min(moduleCount, maxStrings); count += 1) {
    const candidate = distribute(moduleCount, count);
    if (candidate.every((size) => size >= minModulesPerString && size <= maxModulesPerString)) {
      stringSizes = candidate;
      break;
    }
  }

  if (minModulesPerString > maxModulesPerString) {
    errors.push("Selected module voltage is incompatible with the inverter MPPT window.");
  } else if (stringSizes.length === 0) {
    errors.push("Module quantity cannot be distributed within the available MPPT/string inputs.");
  }

  const mpptAllocation = stringSizes.length
    ? allocateMppts(stringSizes, inverter.mpptCount)
    : [];
  const maxParallelStringsPerMppt = Math.max(0, ...mpptAllocation.map((rows) => rows.length));
  const maxInputCurrentPerMpptA = round(maxParallelStringsPerMppt * moduleProfile.impA, 2);
  const maxShortCircuitCurrentPerMpptA = round(
    maxParallelStringsPerMppt * moduleProfile.iscA * 1.25,
    2
  );
  if (maxInputCurrentPerMpptA > inverter.maxInputCurrentPerMpptA) {
    errors.push("Parallel-string operating current exceeds the inverter MPPT input-current limit.");
  }
  if (maxShortCircuitCurrentPerMpptA > inverter.maxShortCircuitCurrentPerMpptA) {
    errors.push("Design short-circuit current exceeds the inverter MPPT short-circuit limit.");
  }
  if (inverter.maxPvPowerKw != null && actualDcKw > inverter.maxPvPowerKw) {
    errors.push("Actual DC array capacity exceeds the inverter maximum PV input power.");
  }
  if (dcAcRatio > allowedRatio) {
    errors.push("DC/AC ratio exceeds the selected inverter limit.");
  }

  const maxStringSize = stringSizes.length ? Math.max(...stringSizes) : 0;
  const minStringSize = stringSizes.length ? Math.min(...stringSizes) : 0;
  const maxStringVocColdV = round(maxStringSize * moduleVocColdV, 1);
  const minStringVmpHotV = round(minStringSize * moduleVmpHotV, 1);

  if (moduleProfile.verification !== "verified") {
    warnings.push("Module electrical values are an indicative design envelope; select a verified model datasheet.");
  }
  if (inverter.verification !== "verified") {
    warnings.push("Inverter limits are indicative; select a verified exact inverter model.");
  }
  if (dcAcRatio < 1 || dcAcRatio > 1.5) {
    warnings.push(`DC/AC ratio ${dcAcRatio.toFixed(2)} needs engineering review.`);
  }

  const status: EquipmentEngineeringSnapshot["status"] =
    errors.length > 0
      ? "invalid"
      : moduleProfile.verification === "verified" && inverter.verification === "verified"
        ? "verified"
        : "indicative";

  return {
    engineVersion: EQUIPMENT_ENGINE_VERSION,
    calculatedAt: input.calculatedAt ?? new Date().toISOString(),
    status,
    module: moduleProfile,
    inverter,
    targetAcKw: round(targetAcKw, 3),
    targetDcKw,
    actualDcKw,
    dcAcRatio,
    moduleCount,
    minModulesPerString,
    maxModulesPerString,
    stringCount: stringSizes.length,
    stringSizes,
    mpptAllocation,
    moduleVocColdV,
    moduleVmpHotV,
    maxStringVocColdV,
    minStringVmpHotV,
    maxParallelStringsPerMppt,
    maxInputCurrentPerMpptA,
    maxShortCircuitCurrentPerMpptA,
    warnings,
    errors,
  };
}

function indicativeModuleEnvelope(watt: number): Omit<PvModuleProfile, "id" | "manufacturer" | "model"> {
  const band = watt >= 650
    ? { vocV: 47.6, vmpV: 39.8, cells: "132 half-cut", efficiencyPct: 22.4, widthMm: 1302, heightMm: 2390 }
    : watt >= 560
      ? { vocV: 51.8, vmpV: 43.4, cells: "144 half-cut", efficiencyPct: 22.1, widthMm: 1134, heightMm: 2279 }
      : watt >= 500
        ? { vocV: 49.8, vmpV: 41.8, cells: "144 half-cut", efficiencyPct: 21.3, widthMm: 1134, heightMm: 2278 }
        : { vocV: 41.8, vmpV: 35, cells: "108 half-cut", efficiencyPct: 20.8, widthMm: 1134, heightMm: 1722 };
  const impA = round(watt / band.vmpV, 2);
  return {
    watt,
    technology: "Datasheet-required module",
    vocV: band.vocV,
    vmpV: band.vmpV,
    impA,
    iscA: round(impA * 1.06, 2),
    vocTempCoeffPctC: -0.27,
    pmaxTempCoeffPctC: -0.35,
    maxSystemVoltageV: 1_500,
    efficiencyPct: band.efficiencyPct,
    widthMm: band.widthMm,
    heightMm: band.heightMm,
    cells: band.cells,
    verification: "indicative",
    revision: 1,
    source: { kind: "design_envelope" },
  };
}

export function buildIndicativeModuleProfile(input: {
  manufacturer?: string | null;
  model?: string | null;
  watt: number;
}): PvModuleProfile {
  const manufacturer = input.manufacturer?.trim() || "Unspecified";
  const watt = Math.max(100, Math.round(input.watt || 540));
  return {
    id: `indicative-${manufacturer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${watt}`,
    manufacturer,
    model: input.model?.trim() || `${watt} W design envelope`,
    ...indicativeModuleEnvelope(watt),
  };
}

export function buildIndicativeInverterProfile(input: {
  manufacturer?: string | null;
  model?: string | null;
  ratedAcKw: number;
  phase?: "single_phase" | "three_phase";
}): InverterProfile {
  const ratedAcKw = Math.max(0.5, input.ratedAcKw || 5);
  const phase = input.phase ?? (ratedAcKw > 10 ? "three_phase" : "single_phase");
  const large = ratedAcKw > 20;
  const manufacturer = input.manufacturer?.trim() || "Unspecified";
  return {
    id: `indicative-${manufacturer.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${ratedAcKw}-${phase}`,
    manufacturer,
    model: input.model?.trim() || `${ratedAcKw} kW design envelope`,
    ratedAcKw,
    phase,
    maxPvPowerKw: round(ratedAcKw * 1.3, 2),
    maxDcVoltageV: large ? 1_100 : 600,
    startupVoltageV: large ? 250 : 120,
    mpptMinV: large ? 200 : 120,
    mpptMaxV: large ? 1_000 : 550,
    mpptCount: large ? Math.max(2, Math.ceil(ratedAcKw / 15)) : 2,
    stringsPerMppt: large ? 2 : 1,
    maxInputCurrentPerMpptA: large ? 32 : 20,
    maxShortCircuitCurrentPerMpptA: large ? 48 : 25,
    maxDcAcRatio: 1.3,
    verification: "indicative",
    revision: 1,
    source: { kind: "design_envelope" },
  };
}
