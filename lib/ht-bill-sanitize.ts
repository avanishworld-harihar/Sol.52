import type { ParsedBillShape } from "@/lib/bill-parse";

const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

const MONTH_INDEX: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function billMonthKey(raw: string | undefined): (typeof MONTH_KEYS)[number] | null {
  const token = String(raw ?? "").trim().toLowerCase().match(/[a-z]+/)?.[0] ?? "";
  const index = MONTH_INDEX[token];
  return Number.isInteger(index) ? MONTH_KEYS[index] : null;
}

export function isHtParsedBill(
  parsed: ParsedBillShape,
  hint: "auto" | "lt" | "ht" = "auto"
): boolean {
  if (hint === "ht") return true;
  const signature = [
    parsed.connection_type,
    parsed.tariff_category,
    parsed.supply_voltage,
    parsed.purpose_of_supply,
  ].join(" ");
  return (
    /\bHT\b|\bHV[-\s]?\d|(?:11|33|66|132)\s*k?v\b/i.test(signature) ||
    numberOrNull(parsed.contract_demand_kva) != null ||
    numberOrNull(parsed.kvah_units) != null ||
    Boolean(parsed.tod_units)
  );
}

/**
 * HT/HV bills print raw AMR accumulator readings, MF-adjusted kWh, kVAh and MD
 * in one dense table. This guard makes the printed final kWh authoritative.
 */
export function sanitizeHtBillConsumption(
  input: ParsedBillShape,
  hint: "auto" | "lt" | "ht" = "auto"
): ParsedBillShape {
  if (!isHtParsedBill(input, hint)) return input;

  const parsed: ParsedBillShape = { ...input };
  const notes = [...(parsed.strict_audit_notes ?? [])];
  const printedKwh = numberOrNull(parsed.kwh_units);
  const todSum = parsed.tod_units
    ? Object.values(parsed.tod_units).reduce<number>(
        (sum, value) => sum + Math.max(0, numberOrNull(value) ?? 0),
        0
      )
    : 0;
  const currentKwh =
    printedKwh && printedKwh > 0
      ? printedKwh
      : todSum > 0
        ? Math.round(todSum)
        : numberOrNull(parsed.metered_unit_consumption);

  parsed.connection_type = "HT";

  if (currentKwh != null && currentKwh > 0) {
    parsed.metered_unit_consumption = currentKwh;
    if (printedKwh == null && todSum > 0) parsed.kwh_units = currentKwh;

    const currentKey = billMonthKey(parsed.bill_month);
    const existingMonths = { ...(parsed.months ?? {}) };
    const otherValues = MONTH_KEYS
      .filter((key) => key !== currentKey)
      .map((key) => numberOrNull(existingMonths[key]))
      .filter((value): value is number => value != null && value > 0);

    // Raw HT AMR readings are often a few thousand while monthly use is tens
    // of thousands. If every "history" value is less than half current use,
    // it is almost certainly the Previous Reading Details accumulator table.
    const looksLikeRawReadingHistory =
      currentKwh >= 10_000 &&
      otherValues.length > 0 &&
      otherValues.every((value) => value < currentKwh * 0.5);

    if (looksLikeRawReadingHistory) {
      parsed.months = {};
      parsed.consumption_history = [];
      notes.push("HT raw AMR Previous Reading Details excluded from monthly consumption.");
    } else {
      parsed.months = existingMonths;
    }

    if (currentKey) parsed.months = { ...(parsed.months ?? {}), [currentKey]: Math.round(currentKwh) };
    notes.push(`HT current consumption locked to final supplied kWh: ${Math.round(currentKwh)}.`);
  }

  parsed.strict_audit_notes = Array.from(new Set(notes)).slice(0, 30);
  return parsed;
}
