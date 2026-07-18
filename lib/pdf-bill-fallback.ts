import type { ParsedBillShape } from "@/lib/bill-parse";

const MONTH_TO_KEY: Record<string, keyof NonNullable<ParsedBillShape["months"]>> = {
  jan: "jan",
  january: "jan",
  feb: "feb",
  february: "feb",
  mar: "mar",
  march: "mar",
  apr: "apr",
  april: "apr",
  may: "may",
  jun: "jun",
  june: "jun",
  jul: "jul",
  july: "jul",
  aug: "aug",
  august: "aug",
  sep: "sep",
  sept: "sep",
  september: "sep",
  oct: "oct",
  october: "oct",
  nov: "nov",
  november: "nov",
  dec: "dec"
  ,
  december: "dec"
};

type MonthStamp = { raw: string; key: keyof NonNullable<ParsedBillShape["months"]>; monthIndex: number; year: number; pos: number };

function toMonthIndex(key: keyof NonNullable<ParsedBillShape["months"]>): number {
  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(key);
}

function normalizeYear(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (raw.length === 2) return n >= 70 ? 1900 + n : 2000 + n;
  return n;
}

function normalizeMonthToken(raw: string): MonthStamp | null {
  const m = raw.match(/\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T|TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s*[-/ ]\s*'?(\d{2,4})\b/i);
  if (!m) return null;
  const key = MONTH_TO_KEY[m[1].toLowerCase()];
  const year = normalizeYear(m[2]);
  if (!key || year === null || !Number.isFinite(year)) return null;
  return { raw: `${key.toUpperCase()}-${year}`, key, monthIndex: toMonthIndex(key), year, pos: -1 };
}

function monthDiff(from: MonthStamp, to: MonthStamp): number {
  return (from.year - to.year) * 12 + (from.monthIndex - to.monthIndex);
}

function collectMonthStamps(text: string): MonthStamp[] {
  const out: MonthStamp[] = [];
  const rx = /\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T|TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s*[-/ ]\s*'?(\d{2,4})\b/gi;
  let m: RegExpExecArray | null = rx.exec(text);
  while (m) {
    const parsed = normalizeMonthToken(`${m[1]}-${m[2]}`);
    if (parsed) out.push({ ...parsed, pos: m.index });
    m = rx.exec(text);
  }
  return out;
}

function detectLatestBillMonth(text: string, months: MonthStamp[]): MonthStamp | null {
  const byLabel = text.match(/Bill\s*Month[:\s-]*([A-Z]{3,9}\s*[-/ ]\s*'?\d{2,4})/i)?.[1];
  if (byLabel) {
    const parsed = normalizeMonthToken(byLabel);
    if (parsed) return parsed;
  }
  return (
    [...months].sort((a, b) => {
      const am = a.year * 12 + a.monthIndex;
      const bm = b.year * 12 + b.monthIndex;
      return bm - am;
    })[0] ?? null
  );
}

type NumberStamp = { value: number; pos: number };

function parseUnitToken(raw: string): number | null {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 2000) return null;
  if (n >= 1900 && n <= 2100 && Number.isInteger(n)) return null; // likely year
  return Math.round(n);
}

function collectNumberStamps(text: string): NumberStamp[] {
  const out: NumberStamp[] = [];
  const rx = /\b\d{1,4}(?:\.\d{1,2})?\b/g;
  let m: RegExpExecArray | null = rx.exec(text);
  while (m) {
    const start = m.index;
    const end = start + m[0].length;
    const prevChar = start > 0 ? text[start - 1] : "";
    const nextChar = end < text.length ? text[end] : "";
    if (prevChar === "-" || nextChar === "-" || prevChar === "/") {
      m = rx.exec(text);
      continue; // likely date chunks like 26-01-2026
    }
    const parsed = parseUnitToken(m[0]);
    if (parsed) out.push({ value: parsed, pos: start });
    m = rx.exec(text);
  }
  return out;
}

function extractLastSixMonthsSection(text: string): string {
  const match = /Last\s+(?:Six|6)\s+Months?\s+Consumption/i.exec(text);
  if (!match) return text;
  const start = Math.max(0, match.index - 120);
  return text.slice(start, start + 3400);
}

function extractMeteredUnitForLatest(text: string): number | null {
  const direct = text.match(/Metered\s*Unit\s*Consumption[\s:]*([0-9]{1,4}(?:\.[0-9]{1,2})?)/i)?.[1];
  const parsedDirect = direct ? parseUnitToken(direct) : null;
  if (parsedDirect) return parsedDirect;
  const reverse = text.match(/([0-9]{1,4}(?:\.[0-9]{1,2})?)\s*(?:Metered\s*Unit\s*Consumption|Final\s*Consumption)/i)?.[1];
  return reverse ? parseUnitToken(reverse) : null;
}

function extractUnitsByMonth(text: string, targetMonths: MonthStamp[]): Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> {
  const monthsMap: Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> = {};
  const monthHits = collectMonthStamps(text);
  const numberHits = collectNumberStamps(text);
  const usedNumberIndexes = new Set<number>();
  const sortedTargets = [...targetMonths].sort((a, b) => a.pos - b.pos);

  for (const target of sortedTargets) {
    let bestIdx = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < monthHits.length; i += 1) {
      const hit = monthHits[i];
      if (hit.key !== target.key || hit.year !== target.year) continue;
      for (let j = 0; j < numberHits.length; j += 1) {
        if (usedNumberIndexes.has(j)) continue;
        const n = numberHits[j];
        const distance = Math.abs(n.pos - hit.pos);
        if (distance > 160) continue;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIdx = j;
        }
      }
    }
    if (bestIdx >= 0) {
      monthsMap[target.key] = numberHits[bestIdx].value;
      usedNumberIndexes.add(bestIdx);
    }
  }

  return monthsMap;
}

function buildPreviousMonths(latest: MonthStamp, count: number): MonthStamp[] {
  const out: MonthStamp[] = [];
  for (let i = 1; i <= count; i += 1) {
    const total = latest.year * 12 + latest.monthIndex - i;
    const year = Math.floor(total / 12);
    const monthIndex = ((total % 12) + 12) % 12;
    const key = (["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const)[monthIndex];
    out.push({
      raw: `${key.toUpperCase()}-${year}`,
      key,
      monthIndex,
      year,
      pos: -1
    });
  }
  return out;
}

function extractTextFromRawPdfBytes(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  const textFragments = raw.match(/[A-Za-z0-9\-/:.() ]{4,}/g) ?? [];
  return textFragments.join("\n");
}

async function extractTextWithPdfParse(buffer: Buffer): Promise<string> {
  const nativeImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<unknown>;
  const mod = (await nativeImport("pdf-parse")) as {
    PDFParse?: new (input: { data: Buffer; worker?: boolean; disableWorker?: boolean }) => {
      getText: () => Promise<{ text?: string }>;
      destroy?: () => Promise<void> | void;
    };
    default?: unknown;
  };
  const parserClass =
    mod.PDFParse ?? ((mod.default as { PDFParse?: typeof mod.PDFParse } | undefined)?.PDFParse ?? undefined);
  if (!parserClass) throw new Error("pdf-parse parser class unavailable");

  const parser = new parserClass({ data: buffer, worker: false, disableWorker: true });
  const result = await parser.getText();
  await parser.destroy?.();
  const text = String(result?.text ?? "").trim();
  if (!text) {
    throw new Error("pdf-parse returned empty text");
  }
  return text;
}

function mergeTextUnits(
  fullText: string,
  latest: MonthStamp,
  scopedMonths: MonthStamp[]
): Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> {
  const fromSection = extractUnitsByMonth(extractLastSixMonthsSection(fullText), scopedMonths);
  const fromWholeBill = extractUnitsByMonth(fullText, scopedMonths);
  const latestMetered = extractMeteredUnitForLatest(fullText);
  const merged = applyMpSixMonthTableHeuristic(fullText, { ...fromWholeBill, ...fromSection });
  if (latestMetered && latestMetered > 0) merged[latest.key] = latestMetered;
  return merged;
}

function applyMpSixMonthTableHeuristic(
  text: string,
  seed: Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>>
): Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> {
  const section = extractLastSixMonthsSection(text);
  const headingIdx = section.search(/Last\s+(?:Six|6)\s+Months?\s+Consumption/i);
  const headerIdx = section.search(/Unit\s+Reading\s+Date/i);
  if (headingIdx < 0 || headerIdx < 0 || headerIdx <= headingIdx) return seed;

  const monthArea = section.slice(headerIdx, Math.min(section.length, headerIdx + 650));
  const orderedMonths = collectMonthStamps(monthArea).filter((m, idx, arr) =>
    arr.findIndex((x) => x.key === m.key && x.year === m.year) === idx
  );
  if (orderedMonths.length === 0) return seed;

  const numbersArea = section.slice(Math.max(0, headingIdx - 80), headerIdx);
  const pairUnits: number[] = [];
  const pairRegex = /(\d{2,4}(?:\.\d+)?)\s+\d{4,6}\b/g;
  let pairMatch: RegExpExecArray | null = pairRegex.exec(numbersArea);
  while (pairMatch) {
    const parsed = parseUnitToken(pairMatch[1]);
    if (parsed) pairUnits.push(parsed);
    pairMatch = pairRegex.exec(numbersArea);
  }
  const leadingUnits: number[] = [];
  const leadingRegex = /\b\d{2,4}(?:\.\d+)?\b/g;
  const headingBand = section.slice(Math.max(0, headingIdx - 120), headingIdx);
  let leadMatch: RegExpExecArray | null = leadingRegex.exec(headingBand);
  while (leadMatch) {
    const parsed = parseUnitToken(leadMatch[0]);
    if (parsed) leadingUnits.push(parsed);
    leadMatch = leadingRegex.exec(headingBand);
  }

  const allUnits = [...leadingUnits.slice(-2), ...pairUnits];
  if (allUnits.length === 0) return seed;

  const take = Math.min(orderedMonths.length, allUnits.length);
  const targetMonths = orderedMonths.slice(-take);
  const targetUnits = allUnits.slice(-take);
  const merged = { ...seed };
  for (let i = 0; i < take; i += 1) {
    const month = targetMonths[i];
    const units = targetUnits[i];
    if (!merged[month.key] && units > 0) merged[month.key] = units;
  }
  return merged;
}

/* ── HT / HV bill extraction (MPPKVVCL-style industrial bills) ──────────────
 * HT bills print raw AMR readings, MF-adjusted totals, kVAh, MD and TOD rows.
 * The generic LT extractor caps units at 2000 and mistakes reading-table
 * values for history, so HT bills get a dedicated deterministic pass. */

function looksLikeHtBillText(text: string): boolean {
  return (
    /HV[-\s]?\d/i.test(text) ||
    /Supply\s*Voltage\s*:?\s*(?:11|33|66|132)\s*KV/i.test(text) ||
    (/Cont\.?\s*Demand/i.test(text) && /KVAH/i.test(text)) ||
    /TOD1\s*:/i.test(text)
  );
}

function htNumber(match: RegExpMatchArray | null | undefined): number | null {
  const raw = match?.[1];
  if (!raw) return null;
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Last decimal ₹ amount after a charge label (MP HT bills print
 * "Fixed Charges\n450 * 641  288450.00\nEnergy Charges…"). The computation
 * line ends at the NEXT label line, so cut there before taking the amount.
 */
function htAmountAfterLabel(text: string, label: RegExp, window = 140): number | null {
  const m = label.exec(text);
  if (!m) return null;
  let slice = text.slice(m.index + m[0].length, m.index + m[0].length + window);
  const nextLabel = slice.search(/\n\s*[A-Za-z]{2,}/);
  if (nextLabel > 0) slice = slice.slice(0, nextLabel);
  const amounts = [...slice.matchAll(/-?[\d,]{1,12}\.\d{1,2}\b/g)]
    .map((x) => Number.parseFloat(x[0].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n));
  return amounts.length > 0 ? amounts[amounts.length - 1] : null;
}

function extractHtBillFromText(text: string, latest: MonthStamp | null): ParsedBillShape | null {
  if (!looksLikeHtBillText(text)) return null;

  const kwhUnits = htNumber(text.match(/Net\s*Units\s*Supplied\s*:?\s*([\d,]+(?:\.\d+)?)/i));
  const kvahUnits = htNumber(text.match(/Net\s*KVAH\s*Units\s*Supplied\s*:?\s*([\d,]+(?:\.\d+)?)/i));
  const contractDemand = htNumber(text.match(/Cont\.?\s*Demand\s*:?\s*([\d,]+(?:\.\d+)?)\s*KVA/i));
  const netMaxDemand =
    htNumber(text.match(/Net\s*Max\s*Demand\s*:?\s*([\d,]+(?:\.\d+)?)/i)) ??
    htNumber(text.match(/Total\s*Max\s*Demand\s*:?\s*([\d,]+(?:\.\d+)?)/i));
  const billingDemand = htNumber(text.match(/Billing\s*Demand\s*:?\s*([\d,]+(?:\.\d+)?)/i));
  const powerFactor = htNumber(text.match(/Avg\.?\s*Power\s*Factor\s*:?\s*(0?\.\d+|1(?:\.0+)?)/i));
  const supplyVoltage = text.match(/Supply\s*Voltage\s*:?\s*((?:11|33|66|132)\s*KV)/i)?.[1]?.trim();
  const tariffCategory = text.match(/Tariff\s*(HV[-\s]?[\d][\d.A-Z]*(?:\.[A-Z])?)/i)?.[1]?.trim();
  const multiplyingFactor = htNumber(text.match(/\bMF\b[\s:]*([\d,]{2,5})(?:\.0+)?\b/i));
  const consumerId = text.match(/Cons\.?\s*Code\s*:?\s*([A-Z0-9]{6,20})/i)?.[1]?.trim();

  const todUnits = {
    tod1: htNumber(text.match(/TOD\s*1\s*:?\s*([\d,]+(?:\.\d+)?)/i)),
    tod2: htNumber(text.match(/TOD\s*2\s*:?\s*([\d,]+(?:\.\d+)?)/i)),
    tod3: htNumber(text.match(/TOD\s*3\s*:?\s*([\d,]+(?:\.\d+)?)/i)),
    tod4: htNumber(text.match(/TOD\s*4\s*:?\s*([\d,]+(?:\.\d+)?)/i))
  };
  const hasTod = Object.values(todUnits).some((v) => v != null && v > 0);

  const fixedCharges = htAmountAfterLabel(text, /Fixed\s*Charges/i);
  const energyCharges = htAmountAfterLabel(text, /Energy\s*Charges(?!\s*\))/i);
  const fppas = htAmountAfterLabel(text, /FPPAS\s*on\s*Energy\s*Charges/i);
  const pfSurcharge = htAmountAfterLabel(text, /PF\s*Surcharge/i);
  const duty = htAmountAfterLabel(text, /Electricity\s*Duty/i, 110);
  const currentMonthBill = htNumber(text.match(/CURRENT\s*MONTH\s*BILL\s*:?\s*([\d,]+\.\d{1,2})/i));
  const netPayable = htNumber(text.match(/NET\s*BILL\s*PAYABLE\s*:?\s*(?:Rs\.?)?\s*([\d,]+\.\d{1,2})/i));

  // Require at least the core consumption signal before claiming an HT parse.
  if (kwhUnits == null && kvahUnits == null && !hasTod) return null;

  const discom = /POORVA?\s*KSHETRA/i.test(text)
    ? "MPPKVVCL"
    : /MADHYA\s*KSHETRA/i.test(text)
      ? "MPMKVVCL"
      : /PASCHIM\s*KSHETRA/i.test(text)
        ? "MPPaKVVCL"
        : "";
  const state = discom ? "Madhya Pradesh" : "";

  const months: NonNullable<ParsedBillShape["months"]> = {};
  if (latest && kwhUnits && kwhUnits > 0) {
    months[latest.key] = Math.round(kwhUnits);
  }

  return {
    connection_type: "HT",
    tariff_category: tariffCategory || "",
    supply_voltage: supplyVoltage || null,
    contract_demand_kva: contractDemand,
    max_demand_kva: netMaxDemand,
    billing_demand_kva: billingDemand,
    avg_power_factor: powerFactor,
    kvah_units: kvahUnits,
    kwh_units: kwhUnits,
    tod_units: hasTod ? todUnits : null,
    multiplying_factor: multiplyingFactor,
    metered_unit_consumption: kwhUnits,
    fixed_charges_inr: fixedCharges,
    demand_charges_inr: fixedCharges,
    energy_charges_inr: energyCharges,
    fppas_inr: fppas,
    pf_welding_surcharge_inr: pfSurcharge,
    electricity_duty_inr: duty,
    current_month_bill_amount_inr: currentMonthBill,
    total_amount_payable_inr: netPayable,
    consumer_id: consumerId || "",
    discom,
    state,
    bill_month: latest?.raw ?? "",
    months,
    // HT reading tables are cumulative AMR accumulators — never month history.
    consumption_history: [],
    strict_audit_notes: ["HT bill parsed by deterministic PDF fallback."],
    format_memory: "Parsed from PDF fallback: HT/HV industrial bill layout"
  };
}

export async function parsePdfBillFallback(base64Data: string): Promise<ParsedBillShape | null> {
  const buffer = Buffer.from(base64Data, "base64");
  try {
    const text = (await extractTextWithPdfParse(buffer)) || extractTextFromRawPdfBytes(buffer);
    if (!text) return null;

    const monthStamps = collectMonthStamps(text);
    const latest = detectLatestBillMonth(text, monthStamps);
    if (!latest) return null;

    const htParsed = extractHtBillFromText(text, latest);
    if (htParsed) return htParsed;

    const expectedHistoryMonths = [latest, ...buildPreviousMonths(latest, 5)];
    const scopedMonths = expectedHistoryMonths.filter((m) => {
      const delta = monthDiff(latest, m);
      return delta >= 0 && delta <= 11;
    });
    const unitsByMonth = mergeTextUnits(text, latest, scopedMonths);
    const consumption_history = scopedMonths
      .map((m) => {
        const units = unitsByMonth[m.key];
        return units && units > 0 ? { month: m.raw, units } : null;
      })
      .filter(Boolean) as NonNullable<ParsedBillShape["consumption_history"]>;

    const billMonth = latest.raw;
    const months: NonNullable<ParsedBillShape["months"]> = {};
    for (const row of consumption_history) {
      const parsed = normalizeMonthToken(row.month);
      if (parsed) months[parsed.key] = row.units;
    }

    return {
      bill_month: billMonth,
      months,
      consumption_history,
      format_memory: "Parsed from PDF fallback: Last Six Months Consumption table"
    };
  } catch {
    try {
      const text = extractTextFromRawPdfBytes(buffer);
      if (!text) return null;
      const monthStamps = collectMonthStamps(text);
      const latest = detectLatestBillMonth(text, monthStamps);
      if (!latest) return null;
      const htParsed = extractHtBillFromText(text, latest);
      if (htParsed) return htParsed;
      const expectedHistoryMonths = [latest, ...buildPreviousMonths(latest, 5)];
      const scopedMonths = expectedHistoryMonths.filter((m) => {
        const delta = monthDiff(latest, m);
        return delta >= 0 && delta <= 11;
      });
      const unitsByMonth = mergeTextUnits(text, latest, scopedMonths);
      const consumption_history = scopedMonths
        .map((m) => {
          const units = unitsByMonth[m.key];
          return units && units > 0 ? { month: m.raw, units } : null;
        })
        .filter(Boolean) as NonNullable<ParsedBillShape["consumption_history"]>;
      const months: NonNullable<ParsedBillShape["months"]> = {};
      for (const row of consumption_history) {
        const parsed = normalizeMonthToken(row.month);
        if (parsed) months[parsed.key] = row.units;
      }
      return {
        bill_month: latest.raw,
        months,
        consumption_history,
        format_memory: "Parsed from raw PDF text fallback: Last Six Months Consumption table"
      };
    } catch {
      return null;
    }
  }
}
