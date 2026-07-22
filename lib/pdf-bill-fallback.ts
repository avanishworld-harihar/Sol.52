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
  // Prefer history-table inference: MP "Last Six Months" omits the current month,
  // so current ≈ max(recent history rows) + 1. This avoids grabbing the wrong
  // "Bill Month" from reading-table column headers / previous periods.
  try {
    const historyRows = extractMpHistoryUnitRows(text);
    if (historyRows.length >= 2) {
      const totals = historyRows.map((r) => r.stamp.year * 12 + r.stamp.monthIndex);
      const absMax = Math.max(...totals);
      const recent = historyRows
        .map((r) => r.stamp)
        .filter((s) => absMax - (s.year * 12 + s.monthIndex) <= 7);
      if (recent.length > 0) {
        const recentMax = Math.max(...recent.map((s) => s.year * 12 + s.monthIndex));
        const nextTotal = recentMax + 1;
        const year = Math.floor(nextTotal / 12);
        const monthIndex = ((nextTotal % 12) + 12) % 12;
        const key = (["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const)[
          monthIndex
        ];
        return {
          raw: `${key.toUpperCase()}-${year}`,
          key,
          monthIndex,
          year,
          pos: -1
        };
      }
    }
  } catch {
    // fall through
  }

  // Header-only explicit label (require : or - after Bill Month so we skip table headers).
  const headerArea = text.slice(0, Math.min(text.length, 2800));
  const byLabel = headerArea.match(/Bill\s*Month\s*[:\-]\s*([A-Z]{3,9}\s*[-/ ]\s*'?\d{2,4})/i)?.[1];
  if (byLabel) {
    const parsed = normalizeMonthToken(byLabel);
    if (parsed) return parsed;
  }

  // Chronological max only from the top of the bill (avoid footer / other noise).
  const headerMonths = months.filter((m) => m.pos >= 0 && m.pos < 2800);
  const pool = headerMonths.length > 0 ? headerMonths : months;
  return (
    [...pool].sort((a, b) => {
      const am = a.year * 12 + a.monthIndex;
      const bm = b.year * 12 + b.monthIndex;
      return bm - am;
    })[0] ?? null
  );
}

type NumberStamp = { value: number; pos: number };

function parseUnitToken(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  // LT domestic/commercial monthly units; reject meter accumulators and years.
  if (n > 5_000) return null;
  if (n >= 1900 && n <= 2100 && Number.isInteger(n)) return null;
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
  const direct = text.match(/Metered\s*Unit\s*Consumption[\s:]*([0-9]{1,5}(?:\.[0-9]{1,2})?)/i)?.[1];
  const parsedDirect = direct ? parseUnitToken(direct) : null;
  if (parsedDirect) return parsedDirect;
  const reverse = text.match(/([0-9]{1,5}(?:\.[0-9]{1,2})?)\s*(?:Metered\s*Unit\s*Consumption|Final\s*Consumption)/i)?.[1];
  return reverse ? parseUnitToken(reverse) : null;
}

/**
 * MP Poorv/Madhya/Paschim domestic layout:
 *   Last Six Months Consumption
 *   Bill Month | Date | Reading | Unit
 *   MAY-2026   01-06-2026  20957  990
 * Prefer the Unit column (last number), never the accumulator Reading.
 */
function extractMpHistoryUnitRows(
  text: string
): Array<{ stamp: MonthStamp; units: number }> {
  const section = extractLastSixMonthsSection(text);
  const rows: Array<{ stamp: MonthStamp; units: number }> = [];
  const rowRx =
    /\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T|TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s*[-/ ]\s*'?(\d{2,4})\b([\s\S]{0,120}?)/gi;
  let match: RegExpExecArray | null = rowRx.exec(section);
  while (match) {
    const stamp = normalizeMonthToken(`${match[1]}-${match[2]}`);
    if (!stamp) {
      match = rowRx.exec(section);
      continue;
    }
    const tail = match[3] ?? "";
    // Stop at next month label so we don't bleed into the following row.
    const nextMonth = tail.search(
      /\b(?:JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T|TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s*[-/ ]\s*'?\d{2,4}\b/i
    );
    const window = nextMonth >= 0 ? tail.slice(0, nextMonth) : tail;
    const nums = [...window.matchAll(/\b(\d{1,7}(?:\.\d{1,2})?)\b/g)]
      .map((m) => Number.parseFloat(m[1].replace(/,/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);

    // Typical row: [day fragments?], date parts, reading (>=1000), unit (<5000).
    // Prefer last number that looks like monthly units and is not a year/date chunk.
    let units: number | null = null;
    for (let i = nums.length - 1; i >= 0; i -= 1) {
      const n = nums[i]!;
      if (n >= 1900 && n <= 2100 && Number.isInteger(n)) continue;
      if (n > 5_000) continue; // accumulator / reading
      if (n < 1) continue;
      // Skip tiny day-of-month leftovers when a larger unit sits earlier in the row.
      if (n <= 31 && nums.some((x, idx) => idx < i && x > 31 && x <= 5_000)) continue;
      units = Math.round(n);
      break;
    }
    if (units != null && units > 0) {
      rows.push({ stamp: { ...stamp, pos: match.index }, units });
    }
    match = rowRx.exec(section);
  }

  // Dedupe by month+year keeping first occurrence (table order).
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.stamp.key}-${row.stamp.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractUnitsByMonth(text: string, targetMonths: MonthStamp[]): Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> {
  const monthsMap: Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> = {};
  const structured = extractMpHistoryUnitRows(text);
  for (const row of structured) {
    const hit = targetMonths.find((t) => t.key === row.stamp.key && t.year === row.stamp.year);
    if (hit) monthsMap[hit.key] = row.units;
  }
  if (Object.keys(monthsMap).length >= 3) return monthsMap;

  const monthHits = collectMonthStamps(text);
  const numberHits = collectNumberStamps(text);
  const usedNumberIndexes = new Set<number>();
  const sortedTargets = [...targetMonths].sort((a, b) => a.pos - b.pos);

  for (const target of sortedTargets) {
    if (monthsMap[target.key]) continue;
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
  const fromStructured = extractMpHistoryUnitRows(fullText);
  const structuredMap: Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> = {};
  for (const row of fromStructured) {
    const delta = monthDiff(latest, row.stamp);
    // Keep current window only (0..11 months back). Drop same-month-last-year rows.
    if (delta < 0 || delta > 11) continue;
    structuredMap[row.stamp.key] = row.units;
  }

  const fromSection = extractUnitsByMonth(extractLastSixMonthsSection(fullText), scopedMonths);
  const fromWholeBill = extractUnitsByMonth(fullText, scopedMonths);
  const latestMetered = extractMeteredUnitForLatest(fullText);
  const merged = applyMpSixMonthTableHeuristic(fullText, {
    ...fromWholeBill,
    ...fromSection,
    ...structuredMap,
  });
  if (latestMetered && latestMetered > 0) merged[latest.key] = latestMetered;
  return merged;
}

function applyMpSixMonthTableHeuristic(
  text: string,
  seed: Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>>
): Partial<Record<keyof NonNullable<ParsedBillShape["months"]>, number>> {
  const structured = extractMpHistoryUnitRows(text);
  if (structured.length >= 3) {
    const merged = { ...seed };
    for (const row of structured) {
      if (!merged[row.stamp.key]) merged[row.stamp.key] = row.units;
    }
    return merged;
  }

  const section = extractLastSixMonthsSection(text);
  const headingIdx = section.search(/Last\s+(?:Six|6)\s+Months?\s+Consumption/i);
  // Support both old "Unit Reading Date" and current "Bill Month | Date | Reading | Unit".
  const headerIdx = Math.max(
    section.search(/Unit\s+Reading\s+Date/i),
    section.search(/Bill\s*Month[\s\S]{0,40}Reading[\s\S]{0,20}Unit/i),
    section.search(/\bDate\b[\s\S]{0,20}\bReading\b[\s\S]{0,20}\bUnit\b/i)
  );
  if (headingIdx < 0 || headerIdx < 0) return seed;

  const monthArea = section.slice(headerIdx, Math.min(section.length, headerIdx + 900));
  const orderedMonths = collectMonthStamps(monthArea).filter((m, idx, arr) =>
    arr.findIndex((x) => x.key === m.key && x.year === m.year) === idx
  );
  if (orderedMonths.length === 0) return seed;

  const numbersArea = section.slice(Math.max(0, headingIdx - 80), Math.min(section.length, headerIdx + 900));
  const pairUnits: number[] = [];
  // Reading (4–6 digits) then Unit (2–4 digits) — take the unit.
  const pairRegex = /\b\d{4,6}(?:\.\d+)?\s+(\d{2,4}(?:\.\d+)?)\b/g;
  let pairMatch: RegExpExecArray | null = pairRegex.exec(numbersArea);
  while (pairMatch) {
    const parsed = parseUnitToken(pairMatch[1]);
    if (parsed) pairUnits.push(parsed);
    pairMatch = pairRegex.exec(numbersArea);
  }
  if (pairUnits.length === 0) return seed;

  const take = Math.min(orderedMonths.length, pairUnits.length);
  const targetMonths = orderedMonths.slice(0, take);
  const targetUnits = pairUnits.slice(0, take);
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
