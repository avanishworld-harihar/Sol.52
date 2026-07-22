/**
 * Resolve authoritative bill_month from consumption history / PDF / AI.
 * MP "Last Six Months" tables omit the current month — current ≈ max(recent history) + 1.
 */

const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

const BILL_MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

export type BillMonthParts = { year: number; monthIndex: number };

export function parseBillMonthParts(raw: string | null | undefined): BillMonthParts | null {
  const text = String(raw ?? "").trim().toLowerCase();
  if (!text) return null;
  const yearMatch = text.match(/(20\d{2}|\d{2})\b/);
  if (!yearMatch) return null;
  let year = Number.parseInt(yearMatch[1], 10);
  if (!Number.isFinite(year)) return null;
  if (year < 100) year += 2000;
  const monthToken = text.match(/[a-z]+/)?.[0] ?? "";
  const monthIndex = BILL_MONTH_MAP[monthToken];
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
}

export function formatBillMonthLabel(parts: BillMonthParts): string {
  return `${MONTH_SHORT[parts.monthIndex]}-${parts.year}`;
}

export function addMonthsToBillMonth(parts: BillMonthParts, delta: number): BillMonthParts {
  const total = parts.year * 12 + parts.monthIndex + delta;
  return {
    year: Math.floor(total / 12),
    monthIndex: ((total % 12) + 12) % 12
  };
}

export function isCalendarCurrentBillMonth(raw: string | null | undefined, now = new Date()): boolean {
  const parts = parseBillMonthParts(raw);
  if (!parts) return false;
  return parts.year === now.getFullYear() && parts.monthIndex === now.getMonth();
}

/**
 * Infer current bill month from Last-Six-Months history rows.
 * Ignores same-month-last-year outliers that sit ~12 months behind the recent cluster.
 */
export function inferBillMonthFromHistory(
  history: Array<{ month?: string | null; units?: number | null }> | null | undefined
): BillMonthParts | null {
  const parsed = (history ?? [])
    .map((row) => parseBillMonthParts(row?.month))
    .filter((p): p is BillMonthParts => Boolean(p));
  if (parsed.length < 2) return null;

  const totals = parsed.map((p) => p.year * 12 + p.monthIndex);
  const absMax = Math.max(...totals);
  // Keep the dense recent window (drop YoY row ~12 months back).
  const recentTotals = totals.filter((t) => absMax - t <= 7);
  if (recentTotals.length < 1) return null;
  const recentMax = Math.max(...recentTotals);
  return addMonthsToBillMonth(
    { year: Math.floor(recentMax / 12), monthIndex: recentMax % 12 },
    1
  );
}

export type ResolveBillMonthInput = {
  aiBillMonth?: string | null;
  localBillMonth?: string | null;
  consumptionHistory?: Array<{ month?: string | null; units?: number | null }> | null;
  /** Soft hint from UI e.g. "Bill around Jan 2026" for secondary uploads */
  expectedMonthHint?: string | null;
};

/**
 * Pick the best bill_month label. History inference wins when available.
 */
export function resolveAuthoritativeBillMonth(input: ResolveBillMonthInput): string {
  const inferred = inferBillMonthFromHistory(input.consumptionHistory);
  const ai = parseBillMonthParts(input.aiBillMonth);
  const local = parseBillMonthParts(input.localBillMonth);
  const expected = parseBillMonthParts(input.expectedMonthHint);

  if (inferred) {
    // If AI/local claim "today" but history says otherwise, trust history.
    return formatBillMonthLabel(inferred);
  }

  // Secondary upload: prefer expected window when AI clearly hallucinated calendar "now".
  if (
    expected &&
    ai &&
    isCalendarCurrentBillMonth(input.aiBillMonth) &&
    (ai.year !== expected.year || ai.monthIndex !== expected.monthIndex)
  ) {
    if (local && (local.year !== ai.year || local.monthIndex !== ai.monthIndex)) {
      return formatBillMonthLabel(local);
    }
    // Keep AI only if it matches expected; otherwise prefer local or expected label.
    if (local) return formatBillMonthLabel(local);
    return formatBillMonthLabel(expected);
  }

  // Prefer local PDF when it disagrees with an AI "today" hallucination.
  if (local && ai && isCalendarCurrentBillMonth(input.aiBillMonth)) {
    if (local.year !== ai.year || local.monthIndex !== ai.monthIndex) {
      return formatBillMonthLabel(local);
    }
  }

  if (ai) return formatBillMonthLabel(ai);
  if (local) return formatBillMonthLabel(local);
  if (expected) return formatBillMonthLabel(expected);
  return (input.aiBillMonth || input.localBillMonth || "").trim();
}
