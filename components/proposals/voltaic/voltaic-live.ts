/**
 * Voltaic — engineering model.
 *
 * Everything an engineering submittal needs that `ProposalData` does not carry:
 * temperature-corrected string sizing, cable schedule, structural wind case,
 * a line-item bill of materials down to connectors and earthing electrodes, and
 * the commissioning test matrix.
 *
 * All of it is derived from the quoted system (kW, module wattage, brands) plus
 * `residentialTechnicalSpecs`. Nothing here reads Design Studio layouts or SLD
 * assets — those stay a separate product surface.
 */

import { computeResidentialEngineeringMetrics } from "@/lib/proposal-engineering-metrics";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import {
  inverterBrandsLabel,
  resolveProposalPanelBrand,
  wireBrandsLabel,
} from "@/lib/residential-deck-helpers";

export type VoltaicLang = "en" | "hi";

/* ── Module electrical model ─────────────────────────────────────────────
 * Half-cut mono PERC / TOPCon residential modules sit in a narrow band, so a
 * per-watt model tracks real datasheets closely enough for a design summary.
 * Values are presented as indicative and confirmed against the final datasheet.
 */
const CELL_VOC_V = 0.755; // per cell at STC
const CELLS_PER_MODULE = 144; // 72 half-cut pairs
const VOC_TEMP_COEFF_PCT_PER_C = -0.27;
const MIN_CELL_TEMP_C = 2; // cold winter morning, worst case for Voc
const MAX_CELL_TEMP_C = 70; // hot roof, worst case for Vmp

/** Residential string inverters clamp DC input here. */
const INVERTER_MAX_DC_V = 550;
const INVERTER_MPPT_MIN_V = 120;

export type VoltaicStringDesign = {
  moduleVocV: number;
  moduleVmpV: number;
  moduleIscA: number;
  moduleImpA: number;
  /** Voc at the coldest expected cell temperature — sets the string ceiling. */
  vocColdV: number;
  /** Vmp at the hottest expected cell temperature — sets the string floor. */
  vmpHotV: number;
  maxModulesPerString: number;
  minModulesPerString: number;
  modulesPerString: number;
  stringCount: number;
  /** Modules on the last string when the array does not divide evenly. */
  remainderModules: number;
  stringVocColdV: number;
  stringVmpV: number;
  stringIscA: number;
  mpptCount: number;
  headroomPct: number;
};

export function voltaicStringDesign(
  panelCount: number,
  panelWatt: number
): VoltaicStringDesign {
  const moduleVocV = Math.round(CELL_VOC_V * CELLS_PER_MODULE * 10) / 10;
  const moduleVmpV = Math.round(moduleVocV * 0.83 * 10) / 10;
  const moduleImpA = Math.round((panelWatt / moduleVmpV) * 10) / 10;
  const moduleIscA = Math.round(moduleImpA * 1.06 * 10) / 10;

  const coldFactor = 1 + (VOC_TEMP_COEFF_PCT_PER_C / 100) * (MIN_CELL_TEMP_C - 25);
  const hotFactor = 1 + (VOC_TEMP_COEFF_PCT_PER_C / 100) * (MAX_CELL_TEMP_C - 25);
  const vocColdV = Math.round(moduleVocV * coldFactor * 10) / 10;
  const vmpHotV = Math.round(moduleVmpV * hotFactor * 10) / 10;

  const maxModulesPerString = Math.max(1, Math.floor(INVERTER_MAX_DC_V / vocColdV));
  const minModulesPerString = Math.max(1, Math.ceil(INVERTER_MPPT_MIN_V / vmpHotV));

  const count = Math.max(1, panelCount);
  let modulesPerString = Math.min(maxModulesPerString, count);
  let stringCount = Math.ceil(count / modulesPerString);
  /* Prefer balanced strings when the array splits evenly. */
  if (stringCount > 1) {
    const balanced = Math.ceil(count / stringCount);
    if (balanced >= minModulesPerString && balanced <= maxModulesPerString) {
      modulesPerString = balanced;
      stringCount = Math.ceil(count / modulesPerString);
    }
  }
  const remainderModules = count - modulesPerString * (stringCount - 1);

  const stringVocColdV = Math.round(vocColdV * modulesPerString);
  const stringVmpV = Math.round(moduleVmpV * modulesPerString);

  return {
    moduleVocV,
    moduleVmpV,
    moduleIscA,
    moduleImpA,
    vocColdV,
    vmpHotV,
    maxModulesPerString,
    minModulesPerString,
    modulesPerString,
    stringCount,
    remainderModules,
    stringVocColdV,
    stringVmpV,
    stringIscA: moduleIscA,
    mpptCount: stringCount > 1 ? 2 : 1,
    headroomPct: Math.round((1 - stringVocColdV / INVERTER_MAX_DC_V) * 100),
  };
}

export const VOLTAIC_INVERTER_MAX_DC_V = INVERTER_MAX_DC_V;
export const VOLTAIC_MIN_CELL_TEMP_C = MIN_CELL_TEMP_C;
export const VOLTAIC_MAX_CELL_TEMP_C = MAX_CELL_TEMP_C;
export const VOLTAIC_VOC_TEMP_COEFF = VOC_TEMP_COEFF_PCT_PER_C;

/* ── Cable schedule ──────────────────────────────────────────────────── */

export type VoltaicCableRun = {
  ref: string;
  from: string;
  to: string;
  cores: string;
  sizeSqMm: number;
  lengthM: number;
  currentA: number;
  voltageDropPct: number;
  method: string;
};

const COPPER_RESISTIVITY = 0.0175; // ohm·mm²/m at 20°C

function dcVoltageDropPct(
  currentA: number,
  lengthM: number,
  sizeSqMm: number,
  systemV: number
): number {
  if (systemV <= 0 || sizeSqMm <= 0) return 0;
  const drop = (2 * COPPER_RESISTIVITY * lengthM * currentA) / sizeSqMm;
  return Math.round((drop / systemV) * 100 * 100) / 100;
}

function acVoltageDropPct(
  currentA: number,
  lengthM: number,
  sizeSqMm: number,
  systemV: number,
  threePhase: boolean
): number {
  if (systemV <= 0 || sizeSqMm <= 0) return 0;
  const factor = threePhase ? 1.732 : 2;
  const drop = (factor * COPPER_RESISTIVITY * lengthM * currentA) / sizeSqMm;
  return Math.round((drop / systemV) * 100 * 100) / 100;
}

export function voltaicCableSchedule(
  design: VoltaicStringDesign,
  opts: {
    systemKw: number;
    dcRunM: number;
    acRunM: number;
    dcSqMm: number;
    threePhase: boolean;
  }
): VoltaicCableRun[] {
  const acVolts = opts.threePhase ? 415 : 230;
  const acCurrent =
    Math.round(
      ((opts.systemKw * 1000) / (acVolts * (opts.threePhase ? 1.732 : 1) * 0.98)) * 10
    ) / 10;
  const acSize = acCurrent > 32 ? 10 : acCurrent > 24 ? 6 : 4;

  return [
    {
      ref: "DC-1",
      from: "PV array (string +/−)",
      to: "DCDB",
      cores: `2 × 1C`,
      sizeSqMm: opts.dcSqMm,
      lengthM: opts.dcRunM,
      currentA: design.stringIscA,
      voltageDropPct: dcVoltageDropPct(
        design.stringIscA,
        opts.dcRunM,
        opts.dcSqMm,
        design.stringVmpV
      ),
      method: "UV-stable, on tray / conduit",
    },
    {
      ref: "DC-2",
      from: "DCDB",
      to: "Inverter MPPT",
      cores: `2 × 1C`,
      sizeSqMm: opts.dcSqMm,
      lengthM: 3,
      currentA: design.stringIscA * design.stringCount,
      voltageDropPct: dcVoltageDropPct(
        design.stringIscA * design.stringCount,
        3,
        opts.dcSqMm,
        design.stringVmpV
      ),
      method: "In conduit, IP65 gland entry",
    },
    {
      ref: "AC-1",
      from: "Inverter",
      to: "ACDB",
      cores: opts.threePhase ? "4C + E" : "3C + E",
      sizeSqMm: acSize,
      lengthM: 3,
      currentA: acCurrent,
      voltageDropPct: acVoltageDropPct(acCurrent, 3, acSize, acVolts, opts.threePhase),
      method: "FR / FRLS, in conduit",
    },
    {
      ref: "AC-2",
      from: "ACDB",
      to: "Net meter / main DB",
      cores: opts.threePhase ? "4C + E" : "3C + E",
      sizeSqMm: acSize,
      lengthM: opts.acRunM,
      currentA: acCurrent,
      voltageDropPct: acVoltageDropPct(
        acCurrent,
        opts.acRunM,
        acSize,
        acVolts,
        opts.threePhase
      ),
      method: "FR / FRLS, in conduit",
    },
    {
      ref: "E-1",
      from: "Array frame + structure",
      to: "Earth pit A",
      cores: "1C bare / green",
      sizeSqMm: 6,
      lengthM: Math.max(6, Math.round(opts.dcRunM * 0.6)),
      currentA: 0,
      voltageDropPct: 0,
      method: "Continuous bonding, IS 3043",
    },
    {
      ref: "E-2",
      from: "Inverter body + ACDB",
      to: "Earth pit B",
      cores: "1C green",
      sizeSqMm: 6,
      lengthM: 6,
      currentA: 0,
      voltageDropPct: 0,
      method: "Separate pit, IS 3043",
    },
  ];
}

/* ── Structural case ─────────────────────────────────────────────────── */

export type VoltaicStructuralCase = {
  windSpeedKmph: number;
  designWindPressurePa: number;
  moduleAreaM2: number;
  arrayAreaM2: number;
  upliftPerModuleN: number;
  ballastOrAnchorNote: string;
  rowPitchM: number;
  clearanceMm: number;
  tiltDeg: number;
  azimuthLabel: string;
};

export function voltaicStructuralCase(opts: {
  panelCount: number;
  tiltDeg: number;
  isHi: boolean;
}): VoltaicStructuralCase {
  const windSpeedKmph = 150; // IS 875 Part 3 basic wind zone for most of central India
  const windMs = windSpeedKmph / 3.6;
  /* q = 0.6 Vz² (N/m²), IS 875 Part 3 */
  const designWindPressurePa = Math.round(0.6 * windMs * windMs);
  const moduleAreaM2 = 2.28; // ~2278 × 1134 mm
  const arrayAreaM2 = Math.round(opts.panelCount * moduleAreaM2 * 10) / 10;
  /* Net uplift coefficient ~1.2 on a tilted rooftop array. */
  const upliftPerModuleN = Math.round(
    designWindPressurePa * moduleAreaM2 * 1.2 * Math.cos((opts.tiltDeg * Math.PI) / 180)
  );

  return {
    windSpeedKmph,
    designWindPressurePa,
    moduleAreaM2,
    arrayAreaM2,
    upliftPerModuleN,
    ballastOrAnchorNote: opts.isHi
      ? "रासायनिक एंकर के साथ RCC पर बोल्टेड बेस प्लेट"
      : "Bolted base plate on RCC with chemical anchors",
    rowPitchM:
      Math.round((moduleAreaM2 / 2.28) * (1.13 * Math.cos((opts.tiltDeg * Math.PI) / 180) + 0.9) * 100) /
      100,
    clearanceMm: 300,
    tiltDeg: opts.tiltDeg,
    azimuthLabel: opts.isHi ? "दक्षिण (180°)" : "South (180°)",
  };
}

/* ── Bill of materials ───────────────────────────────────────────────── */

export type VoltaicBomLine = {
  ref: string;
  item: string;
  make: string;
  spec: string;
  qty: string;
  standard: string;
  warranty: string;
  /** Why this part matters — the detail customers rarely get. */
  note?: string;
};

export type VoltaicBomGroup = {
  code: string;
  title: string;
  lines: VoltaicBomLine[];
};

function brandOf(
  data: ProposalData,
  match: RegExp,
  fallback: string
): { brand: string; spec: string; warranty: string } {
  const row = data.bom.find((b) => match.test(`${b.name} ${b.spec} ${b.brand}`));
  return {
    brand: row?.brand?.trim() || fallback,
    spec: row?.spec?.trim() || "",
    warranty: row?.warranty?.trim() || "—",
  };
}

export type VoltaicEquipmentMakes = {
  panel: string;
  inverter: string;
  wire: string;
};

/** Panel / inverter / wire makes from Proposal Builder, then BOM snapshot. */
export function resolveVoltaicEquipmentMakes(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): VoltaicEquipmentMakes {
  const cfg = pptInput?.residentialConfig ?? null;
  const panelBom = brandOf(data, /panel|module/i, "");
  const inverterBom = brandOf(data, /inverter/i, "");
  const cableBom = brandOf(data, /cable|wire|cabling/i, "");

  const panel = cfg
    ? resolveProposalPanelBrand(cfg, panelBom.brand || "Tier-1")
    : panelBom.brand || "Tier-1";
  const inverter = cfg
    ? inverterBrandsLabel(cfg.inverterBrandOptions, inverterBom.brand || "Tier-1")
    : inverterBom.brand || "Tier-1";
  const wire = cfg
    ? wireBrandsLabel(cfg.pricing, cableBom.brand || "Polycab")
    : cableBom.brand || "Polycab / Havells";

  return { panel, inverter, wire };
}

/**
 * Major equipment, split into real line items rather than rolled-up rows.
 * Every line carries make, spec, quantity with unit, the standard it is bought
 * against, and its warranty term.
 */
export function voltaicMajorBom(
  data: ProposalData,
  design: VoltaicStringDesign,
  opts: {
    panelCount: number;
    panelWatt: number;
    systemKw: number;
    threePhase: boolean;
    isHi: boolean;
    makes?: VoltaicEquipmentMakes;
  }
): VoltaicBomGroup[] {
  const hi = opts.isHi;
  const panel = brandOf(data, /panel|module/i, "Tier-1");
  const inverter = brandOf(data, /inverter/i, "Tier-1");
  const structure = brandOf(data, /structure|mount/i, "HDG GI");
  const panelMake = opts.makes?.panel?.trim() || panel.brand;
  const inverterMake = opts.makes?.inverter?.trim() || inverter.brand;
  const acVolts = opts.threePhase ? "415 V, 3Φ" : "230 V, 1Φ";

  return [
    {
      code: "10",
      title: hi ? "जनरेशन उपकरण" : "Generation equipment",
      lines: [
        {
          ref: "10.1",
          item: hi ? "पीवी मॉड्यूल" : "PV module",
          make: panelMake,
          spec: `${opts.panelWatt} Wp · Mono PERC / TOPCon · ${design.moduleVocV} V Voc · ${design.moduleIscA} A Isc`,
          qty: `${opts.panelCount} ${hi ? "नग" : "nos"}`,
          standard: "IEC 61215 / 61730 · IS 14286 · ALMM",
          warranty: panel.warranty || (hi ? "30 वर्ष प्रदर्शन" : "30 yr performance"),
          note: hi
            ? "हर मॉड्यूल पर फ्लैश-टेस्ट रिपोर्ट; डिस्पैच से पहले सीरियल नंबर दर्ज किए जाते हैं"
            : "Flash-test report per module; serial numbers recorded before dispatch",
        },
        {
          ref: "10.2",
          item: hi ? "स्ट्रिंग इन्वर्टर" : "String inverter",
          make: inverterMake,
          spec: `${opts.systemKw} kW · ${design.mpptCount} MPPT · ${acVolts} · IP65`,
          qty: `1 ${hi ? "नग" : "no"}`,
          standard: "IEC 62109-1/2 · CEA grid code",
          warranty: inverter.warranty || (hi ? "10 वर्ष" : "10 yr"),
          note: hi
            ? "एंटी-आइलैंडिंग सुरक्षा; DISCOM सिंक्रोनाइज़ेशन के लिए ग्रिड-टाई प्रमाणित"
            : "Anti-islanding protection; grid-tie certified for DISCOM synchronisation",
        },
      ],
    },
    {
      code: "20",
      title: hi ? "माउंटिंग स्ट्रक्चर" : "Mounting structure",
      lines: [
        {
          ref: "20.1",
          item: hi ? "मॉड्यूल माउंटिंग स्ट्रक्चर" : "Module mounting structure",
          make: structure.brand,
          spec: hi
            ? `हॉट-डिप गैल्वनाइज़्ड MS · ≥80 µm कोटिंग · ${design.modulesPerString}-अप टेबल`
            : `Hot-dip galvanized MS · ≥80 µm coating · ${design.modulesPerString}-up tables`,
          qty: `${Math.max(1, Math.ceil(opts.panelCount / 4))} ${hi ? "सेट" : "sets"}`,
          standard: "IS 875 Part 3 · IS 4759 galvanizing",
          warranty: structure.warranty || (hi ? "10 वर्ष" : "10 yr"),
          note: hi
            ? "150 km/h विंड ज़ोन के लिए डिज़ाइन; जंग से बचाव हेतु कोई फील्ड कटिंग नहीं"
            : "Designed for the 150 km/h wind zone; no field cutting, to keep galvanizing intact",
        },
        {
          ref: "20.2",
          item: hi ? "बेस प्लेट और केमिकल एंकर" : "Base plate & chemical anchor",
          make: "Hilti / Fischer",
          spec: hi ? "M12 एंकर · SS 304 फास्टनर" : "M12 anchor · SS 304 fasteners",
          qty: `${Math.max(4, Math.ceil(opts.panelCount / 2)) * 2} ${hi ? "नग" : "nos"}`,
          standard: "ETA approved anchor",
          warranty: hi ? "स्ट्रक्चर के साथ" : "With structure",
          note: hi
            ? "छत की वॉटरप्रूफिंग बनाए रखने के लिए हर पेनिट्रेशन सील किया जाता है"
            : "Every penetration is sealed to keep the roof waterproofing intact",
        },
      ],
    },
  ];
}

/** Balance of system — the parts most quotations hide inside "cabling & accessories". */
export function voltaicBalanceBom(
  design: VoltaicStringDesign,
  cables: VoltaicCableRun[],
  opts: { threePhase: boolean; panelCount: number; isHi: boolean; wireMake?: string }
): VoltaicBomGroup[] {
  const hi = opts.isHi;
  const wireMake = opts.wireMake?.trim() || "Polycab / Havells";
  const dcRun = cables.find((c) => c.ref === "DC-1");
  const acRun = cables.find((c) => c.ref === "AC-2");
  const dcTotalM = cables
    .filter((c) => c.ref.startsWith("DC"))
    .reduce((sum, c) => sum + c.lengthM * 2, 0);
  const acTotalM = cables
    .filter((c) => c.ref.startsWith("AC"))
    .reduce((sum, c) => sum + c.lengthM, 0);

  return [
    {
      code: "30",
      title: hi ? "केबल और कनेक्टर" : "Cables & connectors",
      lines: [
        {
          ref: "30.1",
          item: hi ? "DC सोलर केबल" : "DC solar cable",
          make: wireMake,
          spec: `${dcRun?.sizeSqMm ?? 4} mm² · 1.5 kV DC · ${hi ? "UV स्थिर, XLPE" : "UV-stable XLPE"}`,
          qty: `${Math.round(dcTotalM)} m`,
          standard: "TUV 2PfG 1169 / IEC 62930",
          warranty: hi ? "25 वर्ष सेवा जीवन" : "25 yr service life",
          note: hi
            ? "लाल/काला अलग रंग-कोड ताकि सर्विसिंग में पोलैरिटी की गलती न हो"
            : "Red/black colour coding so polarity can never be mistaken during service",
        },
        {
          ref: "30.2",
          item: hi ? "AC केबल" : "AC cable",
          make: wireMake,
          spec: `${acRun?.sizeSqMm ?? 4} mm² · ${acRun?.cores ?? "3C + E"} · FRLS`,
          qty: `${Math.round(acTotalM)} m`,
          standard: "IS 694 · IS 7098",
          warranty: hi ? "25 वर्ष सेवा जीवन" : "25 yr service life",
        },
        {
          ref: "30.3",
          item: hi ? "MC4 कनेक्टर जोड़े" : "MC4 connector pairs",
          make: "Stäubli / Amphenol",
          spec: hi ? "IP68 · 1.5 kV DC · 30 A" : "IP68 · 1.5 kV DC · 30 A",
          qty: `${design.stringCount * 2 + 2} ${hi ? "जोड़े" : "pairs"}`,
          standard: "IEC 62852",
          warranty: hi ? "10 वर्ष" : "10 yr",
          note: hi
            ? "ओरिजिनल क्रिम्पिंग टूल से लगाए जाते हैं — ढीला कनेक्टर DC आर्क का सबसे बड़ा कारण है"
            : "Crimped with the OEM tool — a loose connector is the single biggest cause of DC arcing",
        },
        {
          ref: "30.4",
          item: hi ? "केबल टाई, ग्लैंड, कंड्यूट" : "Cable ties, glands & conduit",
          make: "Hensel / Comet",
          spec: hi ? "UV-प्रतिरोधी टाई · IP68 ग्लैंड · 25 mm PVC कंड्यूट" : "UV-resistant ties · IP68 glands · 25 mm PVC conduit",
          qty: `1 ${hi ? "लॉट" : "lot"}`,
          standard: "IS 9537",
          warranty: "—",
        },
      ],
    },
    {
      code: "40",
      title: hi ? "सुरक्षा और स्विचगियर" : "Protection & switchgear",
      lines: [
        {
          ref: "40.1",
          item: "DCDB",
          make: "Hensel / Elmex",
          spec: `${design.stringCount} ${hi ? "स्ट्रिंग इनपुट" : "string input"} · ${hi ? "फ्यूज़" : "gPV fuse"} + Type II SPD · IP65`,
          qty: `1 ${hi ? "नग" : "no"}`,
          standard: "IEC 61439 · IEC 61643-31",
          warranty: hi ? "5 वर्ष" : "5 yr",
          note: hi
            ? "हर स्ट्रिंग पर अलग फ्यूज़ ताकि एक स्ट्रिंग की खराबी पूरे ऐरे को बंद न करे"
            : "Per-string fusing so one faulty string never takes the whole array offline",
        },
        {
          ref: "40.2",
          item: "ACDB",
          make: "Schneider / Legrand",
          spec: opts.threePhase
            ? `4P MCB + Type II SPD · IP65`
            : `DP MCB + Type II SPD · IP65`,
          qty: `1 ${hi ? "नग" : "no"}`,
          standard: "IEC 61439 · IS 8828",
          warranty: hi ? "5 वर्ष" : "5 yr",
        },
        {
          ref: "40.3",
          item: hi ? "DC आइसोलेटर" : "DC isolator",
          make: "Santon / Salzer",
          spec: `1000 V DC · ${Math.max(16, Math.ceil(design.stringIscA * 1.25))} A · ${hi ? "लॉक करने योग्य" : "lockable"}`,
          qty: `${design.stringCount} ${hi ? "नग" : "nos"}`,
          standard: "IEC 60947-3",
          warranty: hi ? "5 वर्ष" : "5 yr",
          note: hi
            ? "मेंटेनेंस के दौरान ऐरे को सुरक्षित रूप से अलग करने के लिए"
            : "Lets the array be safely isolated for maintenance without touching the grid side",
        },
        {
          ref: "40.4",
          item: hi ? "सर्ज प्रोटेक्शन (SPD)" : "Surge protection (SPD)",
          make: "Phoenix / Citel",
          spec: hi ? "Type II · DC व AC दोनों तरफ" : "Type II · both DC and AC side",
          qty: `2 ${hi ? "सेट" : "sets"}`,
          standard: "IEC 61643",
          warranty: hi ? "5 वर्ष" : "5 yr",
        },
      ],
    },
    {
      code: "50",
      title: hi ? "अर्थिंग और लाइटनिंग" : "Earthing & lightning",
      lines: [
        {
          ref: "50.1",
          item: hi ? "कॉपर-बॉन्डेड अर्थ इलेक्ट्रोड" : "Copper-bonded earth electrode",
          make: "Ashlok / JMV",
          spec: hi ? "17.2 mm × 3 m · बैकफिल कंपाउंड सहित" : "17.2 mm × 3 m · with backfill compound",
          qty: `2 ${hi ? "पिट" : "pits"}`,
          standard: "IS 3043 · IEC 62561",
          warranty: hi ? "10 वर्ष" : "10 yr",
          note: hi
            ? "ऐरे और इन्वर्टर के लिए अलग-अलग पिट; मापी गई प्रतिरोधकता ≤1 Ω रिपोर्ट की जाती है"
            : "Separate pits for array and inverter; measured resistance ≤1 Ω is reported at handover",
        },
        {
          ref: "50.2",
          item: hi ? "लाइटनिंग अरेस्टर" : "Lightning arrester",
          make: "JMV / Ashlok",
          spec: hi ? "ESE / स्पाइक टाइप · छत पर सबसे ऊँचे बिंदु पर" : "ESE / spike type · at the highest roof point",
          qty: `1 ${hi ? "नग" : "no"}`,
          standard: "IS/IEC 62305",
          warranty: hi ? "10 वर्ष" : "10 yr",
        },
        {
          ref: "50.3",
          item: hi ? "अर्थिंग स्ट्रिप और लग" : "Earthing strip & lugs",
          make: "Dowells",
          spec: hi ? "25 × 3 mm GI स्ट्रिप · टिन्ड कॉपर लग" : "25 × 3 mm GI strip · tinned copper lugs",
          qty: `1 ${hi ? "लॉट" : "lot"}`,
          standard: "IS 3043",
          warranty: "—",
        },
      ],
    },
    {
      code: "60",
      title: hi ? "मीटरिंग, मॉनिटरिंग और दस्तावेज़" : "Metering, monitoring & documentation",
      lines: [
        {
          ref: "60.1",
          item: hi ? "बाइ-डायरेक्शनल नेट मीटर" : "Bi-directional net meter",
          make: "DISCOM approved",
          spec: opts.threePhase ? "3Φ · Class 1.0" : "1Φ · Class 1.0",
          qty: `1 ${hi ? "नग" : "no"}`,
          standard: "IS 16444 · state SERC",
          warranty: hi ? "DISCOM के अनुसार" : "Per DISCOM",
          note: hi
            ? "आवेदन, निरीक्षण और मीटर लगवाने तक की पूरी प्रक्रिया हम संभालते हैं"
            : "We handle the full application, inspection and meter installation process",
        },
        {
          ref: "60.2",
          item: hi ? "मॉनिटरिंग (Wi-Fi डोंगल / ऐप)" : "Monitoring (Wi-Fi dongle / app)",
          make: "Inverter OEM",
          spec: hi ? "प्रति-स्ट्रिंग जनरेशन · अलर्ट" : "Per-string generation · fault alerts",
          qty: `1 ${hi ? "नग" : "no"}`,
          standard: "—",
          warranty: hi ? "इन्वर्टर के साथ" : "With inverter",
        },
        {
          ref: "60.3",
          item: hi ? "लेबल, साइनेज और ड्रॉइंग सेट" : "Labels, signage & drawing set",
          make: "—",
          spec: hi
            ? "DC/AC चेतावनी लेबल · SLD · अर्थिंग टेस्ट रिपोर्ट"
            : "DC/AC warning labels · SLD · earthing test report",
          qty: `1 ${hi ? "सेट" : "set"}`,
          standard: "IS/IEC 62446",
          warranty: "—",
          note: hi
            ? "हैंडओवर पर पूरा दस्तावेज़ सेट — भविष्य में कोई भी इलेक्ट्रीशियन सिस्टम समझ सकता है"
            : "A complete document set at handover, so any electrician can understand the system later",
        },
      ],
    },
  ];
}

/* ── Commissioning ───────────────────────────────────────────────────── */

export type VoltaicTest = {
  ref: string;
  test: string;
  method: string;
  acceptance: string;
};

export function voltaicCommissioningTests(
  design: VoltaicStringDesign,
  isHi: boolean
): VoltaicTest[] {
  return [
    {
      ref: "T1",
      test: isHi ? "स्ट्रिंग पोलैरिटी" : "String polarity",
      method: isHi ? "DCDB पर मल्टीमीटर" : "Multimeter at DCDB",
      acceptance: isHi ? "सभी स्ट्रिंग सही पोलैरिटी" : "All strings correct polarity",
    },
    {
      ref: "T2",
      test: isHi ? "ओपन सर्किट वोल्टेज (Voc)" : "Open-circuit voltage (Voc)",
      method: isHi ? "प्रति स्ट्रिंग मापन" : "Measured per string",
      acceptance: `${Math.round(design.stringVocColdV * 0.9)}–${design.stringVocColdV} V`,
    },
    {
      ref: "T3",
      test: isHi ? "शॉर्ट सर्किट करंट (Isc)" : "Short-circuit current (Isc)",
      method: isHi ? "क्लैम्प मीटर, पूर्ण धूप" : "Clamp meter, full irradiance",
      acceptance: `≈ ${design.stringIscA} A ±10%`,
    },
    {
      ref: "T4",
      test: isHi ? "इंसुलेशन प्रतिरोध" : "Insulation resistance",
      method: isHi ? "500 V मेगर, ऐरे–अर्थ" : "500 V megger, array to earth",
      acceptance: "≥ 1 MΩ",
    },
    {
      ref: "T5",
      test: isHi ? "अर्थ प्रतिरोध" : "Earth resistance",
      method: isHi ? "अर्थ टेस्टर, हर पिट" : "Earth tester, each pit",
      acceptance: "≤ 1 Ω",
    },
    {
      ref: "T6",
      test: isHi ? "अर्थ कंटिन्युटी बॉन्डिंग" : "Earth continuity bonding",
      method: isHi ? "फ्रेम से पिट तक" : "Frame to pit",
      acceptance: "< 0.5 Ω",
    },
    {
      ref: "T7",
      test: isHi ? "इन्वर्टर ग्रिड सिंक" : "Inverter grid sync",
      method: isHi ? "कमीशनिंग रिपोर्ट" : "Commissioning report",
      acceptance: isHi ? "एंटी-आइलैंडिंग सफल" : "Anti-islanding trip verified",
    },
    {
      ref: "T8",
      test: isHi ? "थर्मल जाँच" : "Thermal scan",
      method: isHi ? "जोड़ों की IR जाँच" : "IR check on terminations",
      acceptance: isHi ? "कोई हॉट-स्पॉट नहीं" : "No hot-spot above ambient +20 °C",
    },
  ];
}

/* ── One-call model ──────────────────────────────────────────────────── */

export type VoltaicEngineeringModel = {
  metrics: ReturnType<typeof computeResidentialEngineeringMetrics>;
  design: VoltaicStringDesign;
  cables: VoltaicCableRun[];
  structural: VoltaicStructuralCase;
  tests: VoltaicTest[];
  threePhase: boolean;
  dcRunM: number;
  acRunM: number;
  dcSqMm: number;
  inverterLocation?: string;
  sanctionedLoadKw?: number;
  discom?: string;
  consumerId?: string;
};

export function buildVoltaicEngineering(
  data: ProposalData,
  pptInput: PremiumProposalPptInput | null | undefined,
  summary: ProposalDeckSummary | null | undefined,
  lang: VoltaicLang
): VoltaicEngineeringModel {
  const isHi = lang === "hi";
  const panelWatt = summary?.panelWatt ?? pptInput?.residentialConfig?.solar?.watt ?? 540;
  const systemKw = data.meta.systemKw || summary?.systemKw || 0;
  const panelCount =
    summary?.panels ?? Math.max(1, Math.ceil((systemKw * 1000 * 1.15) / panelWatt));

  const fallbackSummary = {
    systemKw,
    panels: panelCount,
    panelWatt,
    annualGen: data.closing.annualUnits || Math.round(systemKw * 1460),
    coverage: 100,
  } as ProposalDeckSummary;

  const metrics = computeResidentialEngineeringMetrics(summary ?? fallbackSummary, {
    location: pptInput?.location,
    state: pptInput?.state,
    siteLat: pptInput?.residentialTechnicalSpecs?.mounting?.siteLat,
  });

  const design = voltaicStringDesign(panelCount, panelWatt);
  const layout = pptInput?.residentialTechnicalSpecs?.layout;
  const threePhase =
    pptInput?.residentialConfig?.pricing?.connectionPhase === "three_phase" ||
    /three/i.test(pptInput?.customerProfile?.phase ?? "");
  const dcRunM = layout?.dcRunLengthM ?? 15;
  const acRunM = layout?.acRunLengthM ?? 8;
  const dcSqMm = layout?.cableDcSqMm ?? 4;

  const tiltDeg =
    pptInput?.residentialTechnicalSpecs?.mounting?.actualTiltDeg ??
    data.engineering.tiltDeg ??
    metrics.tiltDeg;

  return {
    metrics,
    design,
    cables: voltaicCableSchedule(design, {
      systemKw,
      dcRunM,
      acRunM,
      dcSqMm,
      threePhase,
    }),
    structural: voltaicStructuralCase({ panelCount, tiltDeg, isHi }),
    tests: voltaicCommissioningTests(design, isHi),
    threePhase,
    dcRunM,
    acRunM,
    dcSqMm,
    inverterLocation: layout?.inverterLocation,
    sanctionedLoadKw: pptInput?.customerProfile?.sanctionedLoadKw,
    discom: pptInput?.discom ?? undefined,
    consumerId: pptInput?.customerProfile?.consumerId,
  };
}
