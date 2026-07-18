/**
 * MPERC HV-3.1 Industrial tariff — 33 kV supply (MP DISCOMs).
 *
 * Source: MPERC Retail Supply Tariff Order FY 2026-27
 * (effective Apr-2026). Cross-checked against MPPKVVCL HV-3.1.B bill
 * (Vaishnoo Floor Mills, May-2026): Fixed 450 kVA × ₹641, Energy 59,112 × ₹7.75.
 *
 * Billing basis: kWh (MPERC continues kWh billing for HT/EHT — kVAh is
 * metered for monitoring but energy charges are levied on kWh).
 */

export type MpHvVoltageClass = "11kV" | "33kV" | "132kV" | "220kV";

export type MpHv31Tariff = {
  category: "HV-3.1";
  label: string;
  voltage: MpHvVoltageClass;
  /** Monthly fixed / demand charge ₹ per kVA of billing demand. */
  demandChargeInrPerKva: number;
  /**
   * Energy charge ₹/kWh when monthly load factor ≤ 50%.
   * Load factor = kWh / (billingDemandKva × PF × hoursInMonth) — when PF
   * unknown, DISCOM bills often apply the ≤50% slab on the printed energy line.
   */
  energyInrPerKwhUpTo50Lf: number;
  /** Energy charge ₹/kWh for consumption in excess of 50% load factor. */
  energyInrPerKwhAbove50Lf: number;
  /** Billing demand floor as fraction of contract demand (MPERC General Terms). */
  billingDemandFloorPct: number;
  /**
   * ToD adjustments as signed fractions of the normal energy charge.
   * Solar-hour and peak slots follow MoP Electricity (Rights of Consumers)
   * ToD rules as applied on MP HT bills; night rebate is seasonal (MPERC).
   */
  tod: {
    /** TOD3 — solar hours (~9 AM–5 PM): −20% rebate. Sole solar-offset window. */
    solarHoursRebatePct: number;
    /** TOD2 / TOD4 — peak / non-solar surcharge slots: +20%. */
    peakSurchargePct: number;
    /** TOD1 — night off-peak (10 PM–6 AM): Oct–May. */
    nightRebateOctMayPct: number;
    /** TOD1 — night off-peak (10 PM–6 AM): Jun–Sep. */
    nightRebateJunSepPct: number;
  };
};

/** Official HV-3.1 Industrial @ 33 kV — FY 2026-27. */
export const MP_HV31_33KV_FY_2026_27: MpHv31Tariff = {
  category: "HV-3.1",
  label: "HV-3.1 Industrial · 33 kV",
  voltage: "33kV",
  demandChargeInrPerKva: 641,
  energyInrPerKwhUpTo50Lf: 7.75,
  energyInrPerKwhAbove50Lf: 6.7,
  billingDemandFloorPct: 0.9,
  tod: {
    solarHoursRebatePct: -0.2,
    peakSurchargePct: 0.2,
    nightRebateOctMayPct: -0.075,
    nightRebateJunSepPct: -0.1,
  },
};

/** Default active schedule for MP HT industrial proposals. */
export const MP_HV31_33KV = MP_HV31_33KV_FY_2026_27;

/**
 * Night ToD rebate % for a bill month.
 * MPERC: Oct–May → 7.5%; Jun–Sep → 10%.
 */
export function mpHvNightRebatePct(
  billMonth?: string | null,
  tariff: MpHv31Tariff = MP_HV31_33KV
): number {
  const m = parseBillMonthIndex(billMonth);
  // Jun=5 … Sep=8 → 10%; else (Oct–May) → 7.5%
  if (m != null && m >= 5 && m <= 8) return tariff.tod.nightRebateJunSepPct;
  return tariff.tod.nightRebateOctMayPct;
}

/** 0=Jan … 11=Dec from labels like "MAY-2026", "May 2026", "2026-05". */
export function parseBillMonthIndex(billMonth?: string | null): number | null {
  if (!billMonth?.trim()) return null;
  const s = billMonth.trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})/);
  if (iso) {
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? month - 1 : null;
  }
  const named = s.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i
  );
  if (!named) return null;
  const map: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  return map[named[1]!.slice(0, 3).toLowerCase()] ?? null;
}

/**
 * Split monthly kWh into ≤50% LF and >50% LF slabs.
 * Hours ≈ 24 × daysInMonth (default 30). PF defaults to bill PF or 0.9.
 */
export function splitEnergyByLoadFactor(input: {
  kwh: number;
  billingDemandKva: number;
  powerFactor?: number;
  daysInMonth?: number;
  tariff?: MpHv31Tariff;
}): { upTo50Kwh: number; above50Kwh: number; loadFactor: number; thresholdKwh: number } {
  const tariff = input.tariff ?? MP_HV31_33KV;
  const kwh = Math.max(0, input.kwh);
  const bd = Math.max(0, input.billingDemandKva);
  const pf =
    typeof input.powerFactor === "number" &&
    input.powerFactor >= 0.5 &&
    input.powerFactor <= 1
      ? input.powerFactor
      : 0.9;
  const days = input.daysInMonth && input.daysInMonth > 0 ? input.daysInMonth : 30;
  const hours = 24 * days;
  const maxPossibleKwh = bd > 0 ? bd * pf * hours : 0;
  const thresholdKwh = maxPossibleKwh > 0 ? maxPossibleKwh * 0.5 : 0;
  const loadFactor = maxPossibleKwh > 0 ? Math.min(1, kwh / maxPossibleKwh) : 0;
  if (thresholdKwh <= 0) {
    return { upTo50Kwh: kwh, above50Kwh: 0, loadFactor, thresholdKwh: 0 };
  }
  const upTo50Kwh = Math.min(kwh, thresholdKwh);
  const above50Kwh = Math.max(0, kwh - thresholdKwh);
  void tariff;
  return { upTo50Kwh, above50Kwh, loadFactor, thresholdKwh };
}

/** Blended ₹/kWh for a month given LF split (or flat ≤50% rate when BD unknown). */
export function mpHv31BlendedEnergyRateInrPerKwh(input: {
  kwh: number;
  billingDemandKva?: number;
  powerFactor?: number;
  daysInMonth?: number;
  tariff?: MpHv31Tariff;
}): number {
  const tariff = input.tariff ?? MP_HV31_33KV;
  const kwh = Math.max(0, input.kwh);
  if (kwh <= 0) return tariff.energyInrPerKwhUpTo50Lf;
  const bd = Math.max(0, input.billingDemandKva ?? 0);
  if (bd <= 0) return tariff.energyInrPerKwhUpTo50Lf;
  const split = splitEnergyByLoadFactor({
    kwh,
    billingDemandKva: bd,
    powerFactor: input.powerFactor,
    daysInMonth: input.daysInMonth,
    tariff,
  });
  const cost =
    split.upTo50Kwh * tariff.energyInrPerKwhUpTo50Lf +
    split.above50Kwh * tariff.energyInrPerKwhAbove50Lf;
  return Math.round((cost / kwh) * 100) / 100;
}
