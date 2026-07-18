import type { ParsedBillShape } from "@/lib/bill-parse";

/** Manual entry on the proposal screen; merged over OCR/Gemini bill parse for PDF/HTML export. */
export type ManualProposalCustomer = {
  /** CRM / who to call — from selected lead or walk-in entry */
  leadContactName: string;
  /** Contact / CRM mobile number */
  leadPhone: string;
  /** Registered mobile number printed on electricity bill (may differ from lead phone) */
  billPhone: string;
  /** Name printed on electricity bill — may differ from lead contact */
  officialBillName: string;
  city: string;
  discom: string;
  state: string;
  /** Tariff area: urban | rural (optional). */
  area: string;
  /** Site locality / landmark (optional). */
  location: string;
  consumerId: string;
  meterNumber: string;
  connectionDate: string;
  phase: string;
  connectionType: string;
  sanctionedLoad: string;
  billingAddress: string;
  tariffCategory: string;
  /** Printed purpose/use — aligns with OCR purpose_of_supply. */
  purposeOfSupply: string;
  /** Contract demand as printed (kVA); optional for demand-based LV2. */
  contractDemandKva: string;
  /* ── HT (High Tension) bill fields — shown when connection is HT ── */
  /** Maximum/billing demand recorded this month (kVA). */
  maxDemandKva: string;
  /** Average power factor from bill (0–1, e.g. 0.87). */
  avgPowerFactor: string;
  /** kVAh billed units for the reference month (HT bills on apparent energy). */
  kvahUnits: string;
};

function coalesce(manual: string, parsed?: string) {
  const t = manual.trim();
  if (t) return t;
  const p = parsed?.trim();
  return p || undefined;
}

function manualHasAny(manual: ManualProposalCustomer) {
  return Object.values(manual).some((v) => String(v ?? "").trim().length > 0);
}

/** Merge latest + previous bill scans (latest wins per field). */
export function mergeParsedBills(
  latest: ParsedBillShape | null,
  previous: ParsedBillShape | null
): ParsedBillShape | null {
  if (!latest && !previous) return null;
  if (!previous) return latest;
  if (!latest) return previous;
  return {
    ...previous,
    ...latest,
    name: latest.name?.trim() || previous.name?.trim() || undefined,
    district: latest.district?.trim() || previous.district?.trim() || undefined,
    discom: latest.discom?.trim() || previous.discom?.trim() || undefined,
    state: latest.state?.trim() || previous.state?.trim() || undefined,
    consumer_id: latest.consumer_id?.trim() || previous.consumer_id?.trim() || undefined,
    meter_number: latest.meter_number?.trim() || previous.meter_number?.trim() || undefined,
    connection_date: latest.connection_date?.trim() || previous.connection_date?.trim() || undefined,
    phase: latest.phase?.trim() || previous.phase?.trim() || undefined,
    connection_type: latest.connection_type?.trim() || previous.connection_type?.trim() || undefined,
    sanctioned_load: latest.sanctioned_load?.trim() || previous.sanctioned_load?.trim() || undefined,
    address: latest.address?.trim() || previous.address?.trim() || undefined,
    tariff_category: latest.tariff_category?.trim() || previous.tariff_category?.trim() || undefined,
    purpose_of_supply:
      latest.purpose_of_supply?.trim() || previous.purpose_of_supply?.trim() || undefined,
    contract_demand_kva: latest.contract_demand_kva ?? previous.contract_demand_kva,
    supply_voltage: latest.supply_voltage ?? previous.supply_voltage,
    max_demand_kva: latest.max_demand_kva ?? previous.max_demand_kva,
    billing_demand_kva: latest.billing_demand_kva ?? previous.billing_demand_kva,
    avg_power_factor: latest.avg_power_factor ?? previous.avg_power_factor,
    kvah_units: latest.kvah_units ?? previous.kvah_units,
    kwh_units: latest.kwh_units ?? previous.kwh_units,
    tod_units: latest.tod_units ?? previous.tod_units,
    tod_amounts_inr: latest.tod_amounts_inr ?? previous.tod_amounts_inr,
    demand_charges_inr: latest.demand_charges_inr ?? previous.demand_charges_inr,
    bill_month: latest.bill_month ?? previous.bill_month,
    months: latest.months ?? previous.months,
    consumption_history: latest.consumption_history?.length
      ? latest.consumption_history
      : previous.consumption_history,
  };
}

/** Prefer typed manual fields; fall back to parsed bill. */
export function mergeCustomerForProposal(
  manual: ManualProposalCustomer,
  parsed: ParsedBillShape | null
): ParsedBillShape | null {
  if (!parsed && !manualHasAny(manual)) return null;
  return {
    ...parsed,
    name: coalesce(manual.officialBillName, parsed?.name),
    district: coalesce(manual.city, parsed?.district),
    discom: coalesce(manual.discom, parsed?.discom),
    state: coalesce(manual.state, parsed?.state),
    consumer_id: coalesce(manual.consumerId, parsed?.consumer_id),
    meter_number: coalesce(manual.meterNumber, parsed?.meter_number),
    connection_date: coalesce(manual.connectionDate, parsed?.connection_date),
    phase: coalesce(manual.phase, parsed?.phase),
    connection_type: coalesce(manual.connectionType, parsed?.connection_type),
    sanctioned_load: coalesce(manual.sanctionedLoad, parsed?.sanctioned_load),
    address: coalesce(manual.billingAddress, parsed?.address),
    tariff_category: coalesce(manual.tariffCategory, parsed?.tariff_category),
    purpose_of_supply: coalesce(
      manual.purposeOfSupply,
      (parsed?.purpose_of_supply ?? parsed?.connection_type) as string | undefined
    ),
    contract_demand_kva:
      manual.contractDemandKva.trim().length > 0
        ? manual.contractDemandKva.trim()
        : parsed?.contract_demand_kva ?? undefined,
    max_demand_kva:
      manual.maxDemandKva.trim().length > 0
        ? manual.maxDemandKva.trim()
        : parsed?.max_demand_kva ?? undefined,
    avg_power_factor:
      manual.avgPowerFactor.trim().length > 0
        ? manual.avgPowerFactor.trim()
        : parsed?.avg_power_factor ?? undefined,
    kvah_units:
      manual.kvahUnits.trim().length > 0
        ? manual.kvahUnits.trim()
        : parsed?.kvah_units ?? undefined,
    bill_month: parsed?.bill_month,
    months: parsed?.months
  };
}
