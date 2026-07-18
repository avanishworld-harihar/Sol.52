/**
 * HT (High Tension) solar savings engine — MPPKVVCL HV-3.x (MP DISCOM rules).
 *
 * Verified against MPERC FY 2026-27 + MPPKVVCL HV-3.1.B bill
 * (Vaishnoo Floor Mills, May-2026):
 *   CD 500 kVA · MD 415.92 · Billing Demand 450 (90% CD floor)
 *   Fixed 450 × ₹641 · Energy 59,112 kWh × ₹7.75 · PF 0.87 surcharge
 *   TOD1 −7.5% (night) · TOD2 +20% · TOD3 −20% (solar hours) · TOD4 +20%
 *
 * MP rules encoded here:
 *  1. Energy billed on **kWh** (not kVAh) — MPERC continues kWh for HT/EHT.
 *  2. Demand/fixed charges LOCKED — billing demand = max(MD, 90% CD).
 *  3. Solar offsets **TOD3 only** (−20% solar-hour window). TOD1 = night;
 *     TOD2/TOD4 = peak (+20%). Night rebate seasonal (7.5% Oct–May, 10% Jun–Sep).
 *  4. Load-factor energy slabs: ≤50% LF ₹7.75, >50% LF ₹6.70 (33 kV).
 *  5. PF surcharge avoidable via APFC — not counted as solar savings.
 *  6. Accelerated depreciation (Section 32): 40% WDV × tax rate.
 */

import {
  MP_HV31_33KV,
  mpHv31BlendedEnergyRateInrPerKwh,
  mpHvNightRebatePct,
  type MpHv31Tariff,
} from "@/lib/mp-hv-tariff";

export type HtTodZoneKey = "tod1" | "tod2" | "tod3" | "tod4";

export type HtTodZoneProfile = {
  key: HtTodZoneKey;
  /** Adjustment on base rate as a signed fraction (rebate negative). */
  adjPct: number;
  /** True when solar generation window overlaps this zone. */
  solarWindow: boolean;
  /** Billing treatment label. */
  treatment: "rebate" | "surcharge";
};

/**
 * Build MP HT ToD profile for a bill month.
 * TOD3 = sole solar window (−20%). TOD1 = seasonal night rebate. TOD2/4 = +20% peak.
 */
export function buildMpHtTodProfile(
  billMonth?: string | null,
  tariff: MpHv31Tariff = MP_HV31_33KV
): HtTodZoneProfile[] {
  const nightPct = mpHvNightRebatePct(billMonth, tariff);
  return [
    {
      key: "tod3",
      adjPct: tariff.tod.solarHoursRebatePct,
      solarWindow: true,
      treatment: "rebate",
    },
    {
      key: "tod1",
      adjPct: nightPct,
      solarWindow: false,
      treatment: "rebate",
    },
    {
      key: "tod2",
      adjPct: tariff.tod.peakSurchargePct,
      solarWindow: false,
      treatment: "surcharge",
    },
    {
      key: "tod4",
      adjPct: tariff.tod.peakSurchargePct,
      solarWindow: false,
      treatment: "surcharge",
    },
  ];
}

/** @deprecated Prefer buildMpHtTodProfile(billMonth) — kept for callers without a month. */
export const MP_HT_TOD_PROFILE: HtTodZoneProfile[] = buildMpHtTodProfile("MAY-2026");

export type HtBillInputs = {
  contractDemandKva?: number;
  billingDemandKva?: number;
  maxDemandKva?: number;
  avgPowerFactor?: number;
  /** kVAh metered (informational on MP — energy is kWh-billed). */
  kvahUnits?: number;
  /** kWh (active) units — MP energy billing basis. */
  kwhUnits?: number;
  todUnits?: Partial<Record<HtTodZoneKey, number>>;
  energyChargesInr?: number;
  demandChargesInr?: number;
  electricityDutyInr?: number;
  fppasInr?: number;
  pfSurchargeInr?: number;
  /** Bill month label e.g. "MAY-2026" — drives seasonal night ToD rebate. */
  billMonth?: string | null;
};

export type HtSolarEngineInput = {
  bill: HtBillInputs;
  systemKw: number;
  annualSolarKwh?: number;
  grossCostInr?: number;
  taxRatePct?: number;
  /** Optional tariff override (defaults to MP HV-3.1 33 kV FY 2026-27). */
  tariff?: MpHv31Tariff;
  /** Optional ToD profile override. */
  todProfile?: HtTodZoneProfile[];
};

export type HtTodOffsetResult = {
  offsetByZone: Partial<Record<HtTodZoneKey, number>>;
  netUnitsByZone: Partial<Record<HtTodZoneKey, number>>;
  exportedUnits: number;
  originalEnergyChargeInr: number;
  newEnergyChargeInr: number;
  energySavingsInr: number;
};

export type HtSolarEngineResult = {
  powerFactor: number;
  /** Always "kwh" for MP HT (MPERC kWh billing). */
  billingBasis: "kwh";
  /** Blended / slab-aware base energy rate ₹/kWh. */
  baseRatePerUnit: number;
  /** Effective ₹/kWh including duty + FPPAS riders when bill lines exist. */
  effectiveRatePerUnit: number;
  annualSolarKwh: number;
  /** Annual kWh offset by solar (TOD3 window). */
  annualUnitsSaved: number;
  annualExportedUnits: number;
  daytimeOffsetShare: number;
  daytimeCapped: boolean;
  annualEnergySavingsInr: number;
  todOffset: HtTodOffsetResult | null;
  annualDemandChargesInr: number;
  billingDemandKva: number | null;
  annualPfSurchargeInr: number;
  adDepreciationY1Inr: number;
  adTaxBenefitY1Inr: number;
  demandUtilization: number | null;
  /** Monthly load factor used for slab selection (0–1), when computable. */
  loadFactor: number | null;
  notes: string[];
};

const DEFAULT_DAYTIME_SHARE = 0.55; // ~TOD3 share when ToD rows missing
const AD_RATE = 0.4;
const DEFAULT_TAX_RATE_PCT = 25.17;
const YIELD_KWH_PER_KW = 1450;

function pos(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function r2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** MP rule: billing demand = max(recorded MD, 90% of contract demand). */
export function computeBillingDemandKva(
  maxDemandKva?: number,
  contractDemandKva?: number,
  floorPct: number = MP_HV31_33KV.billingDemandFloorPct
): number | null {
  const md = pos(maxDemandKva);
  const cd = pos(contractDemandKva);
  if (md <= 0 && cd <= 0) return null;
  return Math.max(md, cd * floorPct);
}

/** Share of consumption inside solar-window ToD zones (TOD3 only for MP HV). */
export function daytimeShareFromTod(
  tod?: Partial<Record<HtTodZoneKey, number>>,
  profile: HtTodZoneProfile[] = MP_HT_TOD_PROFILE
): number {
  if (!tod) return DEFAULT_DAYTIME_SHARE;
  let solar = 0;
  let total = 0;
  for (const zone of profile) {
    const u = pos(tod[zone.key]);
    total += u;
    if (zone.solarWindow) solar += u;
  }
  if (total <= 0) return DEFAULT_DAYTIME_SHARE;
  return Math.min(1, Math.max(0, solar / total));
}

/**
 * Monthly ToD-aware solar offset (kWh domain):
 *  - Solar offsets TOD3 only (−20% solar-hour units).
 *  - Surplus exports to grid at base-rate credit (MP net-metering).
 *  - TOD1 night + TOD2/TOD4 peak surcharges survive without BESS.
 */
export function computeHtTodOffset(input: {
  solarKwhMonth: number;
  todUnits: Partial<Record<HtTodZoneKey, number>>;
  baseRatePerKwh: number;
  todProfile: HtTodZoneProfile[];
  exportCreditRatePerKwh?: number;
}): HtTodOffsetResult {
  const rate = pos(input.baseRatePerKwh) || MP_HV31_33KV.energyInrPerKwhUpTo50Lf;
  const exportRate = pos(input.exportCreditRatePerKwh) || rate;
  const profile = input.todProfile;

  const offsetByZone: Partial<Record<HtTodZoneKey, number>> = {};
  const netUnitsByZone: Partial<Record<HtTodZoneKey, number>> = {};

  let originalEnergyChargeInr = 0;
  for (const zone of profile) {
    const units = pos(input.todUnits[zone.key]);
    originalEnergyChargeInr += units * rate * (1 + zone.adjPct);
    netUnitsByZone[zone.key] = units;
  }

  let solarLeft = Math.max(0, input.solarKwhMonth);
  for (const zone of profile) {
    if (!zone.solarWindow || solarLeft <= 0) continue;
    const units = pos(input.todUnits[zone.key]);
    const applied = Math.min(units, solarLeft);
    offsetByZone[zone.key] = Math.round(applied);
    netUnitsByZone[zone.key] = Math.round(units - applied);
    solarLeft -= applied;
  }
  const exportedUnits = Math.round(solarLeft);

  let newChargeBeforeCredit = 0;
  for (const zone of profile) {
    const net = pos(netUnitsByZone[zone.key]);
    newChargeBeforeCredit += net * rate * (1 + zone.adjPct);
  }
  const exportCreditInr = exportedUnits * exportRate;
  const newEnergyChargeInr = Math.max(0, newChargeBeforeCredit - exportCreditInr);

  return {
    offsetByZone,
    netUnitsByZone,
    exportedUnits,
    originalEnergyChargeInr: Math.round(originalEnergyChargeInr),
    newEnergyChargeInr: Math.round(newEnergyChargeInr),
    energySavingsInr: Math.round(originalEnergyChargeInr - newEnergyChargeInr),
  };
}

export function computeHtSolarSavings(input: HtSolarEngineInput): HtSolarEngineResult {
  const notes: string[] = [];
  const bill = input.bill ?? {};
  const tariff = input.tariff ?? MP_HV31_33KV;
  const profile =
    input.todProfile ?? buildMpHtTodProfile(bill.billMonth, tariff);

  const pfRaw = Number(bill.avgPowerFactor);
  const powerFactor = Number.isFinite(pfRaw) && pfRaw >= 0.5 && pfRaw <= 1 ? pfRaw : 0.9;
  if (powerFactor !== pfRaw) {
    notes.push("Power factor missing/invalid on bill — assumed 0.90 for LF estimate.");
  }

  const annualSolarKwh =
    pos(input.annualSolarKwh) > 0
      ? pos(input.annualSolarKwh)
      : Math.round(pos(input.systemKw) * YIELD_KWH_PER_KW);

  const billingDemandKva =
    pos(bill.billingDemandKva) > 0
      ? pos(bill.billingDemandKva)
      : computeBillingDemandKva(
          bill.maxDemandKva,
          bill.contractDemandKva,
          tariff.billingDemandFloorPct
        );

  // MP HT: energy is kWh-billed. kVAh is informational only.
  const kwh = pos(bill.kwhUnits);
  const energyInr = pos(bill.energyChargesInr);
  notes.push(
    "MP HT energy billed on kWh (MPERC) — kVAh/PF amplification not applied to solar savings."
  );

  // LF-aware blended rate from official slabs; prefer bill-implied when present.
  let baseRatePerUnit = tariff.energyInrPerKwhUpTo50Lf;
  let loadFactor: number | null = null;
  if (kwh > 0 && billingDemandKva != null && billingDemandKva > 0) {
    baseRatePerUnit = mpHv31BlendedEnergyRateInrPerKwh({
      kwh,
      billingDemandKva,
      powerFactor,
      tariff,
    });
    const maxKwh = billingDemandKva * powerFactor * 24 * 30;
    loadFactor = maxKwh > 0 ? r2(Math.min(1, kwh / maxKwh)) : null;
    if (loadFactor != null) {
      notes.push(
        `Load factor ≈ ${(loadFactor * 100).toFixed(0)}% — energy slabs ₹${tariff.energyInrPerKwhUpTo50Lf}/kWh (≤50% LF) / ₹${tariff.energyInrPerKwhAbove50Lf}/kWh (>50% LF).`
      );
    }
  }
  if (kwh > 0 && energyInr > 0) {
    const implied = r2(energyInr / kwh);
    // Prefer printed bill energy rate when it is in a sensible band.
    if (implied >= 4 && implied <= 12) baseRatePerUnit = implied;
  }
  if (kwh <= 0 && energyInr <= 0) {
    notes.push(
      `Bill energy line unavailable — using HV-3.1 33 kV ≤50% LF rate ₹${tariff.energyInrPerKwhUpTo50Lf}/kWh.`
    );
  }

  const ridersInr = pos(bill.fppasInr) + pos(bill.electricityDutyInr);
  const effectiveRatePerUnit =
    kwh > 0 ? r2((energyInr + ridersInr) / kwh || baseRatePerUnit) : baseRatePerUnit;

  const monthlySolarKwh = annualSolarKwh / 12;
  const daytimeOffsetShare = daytimeShareFromTod(bill.todUnits, profile);
  const hasTod =
    bill.todUnits != null && profile.some((z) => pos(bill.todUnits?.[z.key]) > 0);

  let todOffset: HtTodOffsetResult | null = null;
  let annualUnitsSaved = 0;
  let annualExportedUnits = 0;
  let annualEnergySavingsInr = 0;
  let daytimeCapped = false;

  if (hasTod) {
    todOffset = computeHtTodOffset({
      solarKwhMonth: monthlySolarKwh,
      todUnits: bill.todUnits ?? {},
      baseRatePerKwh: baseRatePerUnit,
      todProfile: profile,
    });
    const monthlyOffset = Object.values(todOffset.offsetByZone).reduce(
      (sum, v) => sum + pos(v),
      0
    );
    annualUnitsSaved = Math.round(monthlyOffset * 12);
    annualExportedUnits = todOffset.exportedUnits * 12;
    daytimeCapped = todOffset.exportedUnits > 0;
    const dutyRatePerKwh = kwh > 0 ? pos(bill.electricityDutyInr) / kwh : 0;
    annualEnergySavingsInr = Math.round(
      (todOffset.energySavingsInr + monthlyOffset * dutyRatePerKwh) * 12
    );
    notes.push(
      "Solar offsets TOD3 (solar-hour −20% window) only; TOD1 night + TOD2/TOD4 peak remain without BESS."
    );
    if (daytimeCapped) {
      notes.push(
        "Solar exceeds TOD3 daytime consumption — surplus exports at base-rate credit; BESS would unlock peak-zone savings."
      );
    }
  } else {
    const annualKwhDemand = kwh > 0 ? kwh * 12 : 0;
    const daytimeCap =
      annualKwhDemand > 0 ? annualKwhDemand * daytimeOffsetShare : Infinity;
    annualUnitsSaved = Math.round(Math.min(annualSolarKwh, daytimeCap));
    daytimeCapped = Number.isFinite(daytimeCap) && annualSolarKwh > daytimeCap;
    annualExportedUnits = daytimeCapped
      ? Math.round(annualSolarKwh - annualUnitsSaved)
      : 0;
    // TOD3 net rate ≈ base × (1 − 20%) when offsetting solar-hour units.
    const solarWindowRate = baseRatePerUnit * (1 + tariff.tod.solarHoursRebatePct);
    annualEnergySavingsInr = Math.round(
      annualUnitsSaved * solarWindowRate + annualExportedUnits * baseRatePerUnit
    );
    notes.push(
      "ToD rows unavailable — offset capped at estimated TOD3 (solar-hour) share; savings at −20% net rate."
    );
  }

  const annualDemandChargesInr =
    pos(bill.demandChargesInr) > 0
      ? Math.round(pos(bill.demandChargesInr) * 12)
      : billingDemandKva != null
        ? Math.round(billingDemandKva * tariff.demandChargeInrPerKva * 12)
        : 0;
  if (annualDemandChargesInr > 0) {
    notes.push(
      `Demand charges locked at ₹${tariff.demandChargeInrPerKva}/kVA × billing demand (90% CD floor) — not in solar savings.`
    );
  }

  const annualPfSurchargeInr = Math.round(pos(bill.pfSurchargeInr) * 12);
  if (annualPfSurchargeInr > 0) {
    notes.push(
      "PF surcharge is avoidable with an APFC / capacitor-bank panel — not counted as solar savings. Solar inverters do not eliminate grid PF surcharge."
    );
  }

  const gross = pos(input.grossCostInr);
  const taxRate = pos(input.taxRatePct) > 0 ? pos(input.taxRatePct) : DEFAULT_TAX_RATE_PCT;
  const adDepreciationY1Inr = Math.round(gross * AD_RATE);
  const adTaxBenefitY1Inr = Math.round((adDepreciationY1Inr * taxRate) / 100);

  const cd = pos(bill.contractDemandKva);
  const md = pos(bill.maxDemandKva) > 0 ? pos(bill.maxDemandKva) : pos(bill.billingDemandKva);
  const demandUtilization = cd > 0 && md > 0 ? r2(md / cd) : null;

  return {
    powerFactor,
    billingBasis: "kwh",
    baseRatePerUnit,
    effectiveRatePerUnit,
    annualSolarKwh,
    annualUnitsSaved,
    annualExportedUnits,
    daytimeOffsetShare: r2(daytimeOffsetShare),
    daytimeCapped,
    annualEnergySavingsInr,
    todOffset,
    annualDemandChargesInr,
    billingDemandKva: billingDemandKva != null ? r2(billingDemandKva) : null,
    annualPfSurchargeInr,
    adDepreciationY1Inr,
    adTaxBenefitY1Inr,
    demandUtilization,
    loadFactor,
    notes,
  };
}

/** True when parsed bill signals an HT connection. */
export function isHtBill(signals: {
  supplyVoltage?: string | null;
  tariffCategory?: string | null;
  contractDemandKva?: number | string | null;
  kvahUnits?: number | string | null;
}): boolean {
  const voltage = String(signals.supplyVoltage ?? "").trim();
  if (/\b(11|33|66|132|220)\s*KV\b/i.test(voltage)) return true;
  if (/\bHV[-\s.]?\d/i.test(String(signals.tariffCategory ?? ""))) return true;
  if (pos(signals.contractDemandKva) >= 50 && pos(signals.kvahUnits) > 0) return true;
  return false;
}
