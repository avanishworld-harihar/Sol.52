/**
 * Lumina — live ProposalData only. No Harihar / Satna / 5 kW / ₹2.2L / Waaree fallbacks.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";

export const LUMINA_HERO_PHOTO = "/assets/proposals/canvas-cover-solar-home.jpg";
export const LUMINA_CLOSE_PHOTO = "/assets/proposals/lumina-close-indian-luxury-terrace.jpg";
export const LUMINA_CLOSE_ALT =
  "Indian luxury rooftop with an 8–9 ft elevated solar plant, garden and sofa under the array, and a couple at the glass railing";

export function luminaBrand(data: ProposalData): string {
  return data.meta.brandName?.trim() || data.closing.installerName?.trim() || "SOL.52";
}

export function luminaBrandParts(data: ProposalData): { head: string; tail: string } {
  const brand = luminaBrand(data);
  const parts = brand.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { head: brand, tail: "" };
  return { head: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
}

export function luminaNetInvestment(data: ProposalData): number {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  if (gross <= 0) return 0;
  if (subsidy > 0 && data.economics.netInr > 0) return Math.round(data.economics.netInr);
  return Math.round(gross);
}

export function luminaAnnualUnits(data: ProposalData): number {
  return data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
}

export function luminaLocation(data: ProposalData): string {
  return data.meta.locationLine?.trim() || data.engineering.cityLabel?.trim() || "";
}

export function luminaIssueDate(generatedAt?: string): string {
  const d = generatedAt ? new Date(generatedAt) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatLuminaKw(kw: number): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(1);
}

export function luminaMonthlySavings(data: ProposalData): number {
  if (data.economics.monthlySavingsInr > 0) return Math.round(data.economics.monthlySavingsInr);
  if (data.closing.annualSavingsInr > 0) return Math.round(data.closing.annualSavingsInr / 12);
  return 0;
}

export function luminaAnnualSavings(data: ProposalData): number {
  if (data.closing.annualSavingsInr > 0) return Math.round(data.closing.annualSavingsInr);
  if (data.economics.monthlySavingsInr > 0) return Math.round(data.economics.monthlySavingsInr * 12);
  return 0;
}

export function luminaYearlyBill(data: ProposalData): number {
  if (data.bill.hasData && data.bill.yearlyBillInr > 0) return Math.round(data.bill.yearlyBillInr);
  return 0;
}

export function luminaLifetime(data: ProposalData): number {
  if (data.closing.lifetimeWealthInr > 0) return data.closing.lifetimeWealthInr;
  if (data.economics.lifetimeProfitInr > 0) return data.economics.lifetimeProfitInr;
  return 0;
}

function findBom(items: ProposalBomItem[], test: RegExp): ProposalBomItem | null {
  return items.find((item) => test.test(`${item.name} ${item.brand} ${item.spec}`)) ?? null;
}

export type LuminaHardwareRow = {
  role: string;
  title: string;
  detail: string;
  chips: string[];
  image: string;
  accent?: boolean;
};

const LUMINA_HW_IMAGES: Array<{ match: RegExp; src: string }> = [
  { match: /waaree|waree|adani|panel|module|pv\b/i, src: "/assets/hardware/panel.png" },
  { match: /inverter|mppt|ongrid|havells/i, src: "/assets/hardware/inverter.png" },
  { match: /structure|mount|jsw|mms|racking/i, src: "/assets/hardware/structure.png" },
  { match: /cable|wire|polycab|conductor/i, src: "/assets/hardware/cable.png" },
];

function luminaHardwareImage(hay: string): string {
  for (const row of LUMINA_HW_IMAGES) {
    if (row.match.test(hay)) return row.src;
  }
  return "/assets/hardware/default.svg";
}

function uniqueChips(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw?.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.slice(0, 4);
}

function rowFromBom(
  item: ProposalBomItem,
  role: string,
  accent?: boolean
): LuminaHardwareRow {
  const hay = `${item.name} ${item.brand} ${item.spec}`;
  const title = item.brand?.trim() || item.name;
  const specLine = [item.spec, item.warranty].filter(Boolean).join(" · ");
  const point = item.technicalPoints?.find((p) => p.trim())?.trim();
  const detail =
    point && point.toLowerCase() !== title.toLowerCase()
      ? point
      : specLine && specLine.toLowerCase() !== title.toLowerCase()
        ? specLine
        : item.description?.trim() && item.description.trim().toLowerCase() !== title.toLowerCase()
          ? item.description.trim()
          : role;
  return {
    role,
    title,
    detail,
    chips: uniqueChips([item.spec, item.warranty, item.name !== item.brand ? item.name : undefined]),
    image: luminaHardwareImage(hay),
    accent,
  };
}

/** Typical central-India rooftop share of year-1 yield. Applied only to live annual units. */
const LUMINA_MONTH_SHARE: ReadonlyArray<{ m: string; share: number; peak: boolean }> = [
  { m: "JAN", share: 0.072, peak: false },
  { m: "FEB", share: 0.078, peak: false },
  { m: "MAR", share: 0.092, peak: true },
  { m: "APR", share: 0.098, peak: true },
  { m: "MAY", share: 0.105, peak: true },
  { m: "JUN", share: 0.095, peak: true },
  { m: "JUL", share: 0.068, peak: false },
  { m: "AUG", share: 0.065, peak: false },
  { m: "SEP", share: 0.082, peak: false },
  { m: "OCT", share: 0.095, peak: true },
  { m: "NOV", share: 0.088, peak: false },
  { m: "DEC", share: 0.062, peak: false },
];

export type LuminaMonthRow = { m: string; val: number; peak: boolean };

export function luminaMonthlyForecast(data: ProposalData): LuminaMonthRow[] {
  const annual = luminaAnnualUnits(data);
  if (!(annual > 0)) {
    return LUMINA_MONTH_SHARE.map((row) => ({ m: row.m, val: 0, peak: row.peak }));
  }
  return LUMINA_MONTH_SHARE.map((row) => ({
    m: row.m,
    val: Math.round(annual * row.share),
    peak: row.peak,
  }));
}

export type LuminaTermCard = { title: string; body: string };

export function luminaTermCards(data: ProposalData): LuminaTermCard[] {
  const raw = (data.terms.conditions ?? []).map((t) => t.trim()).filter(Boolean);
  const cards: LuminaTermCard[] = raw.slice(0, 4).map((text) => {
    const split = text.match(/^(.{8,48}?)[:.—–-]\s+(.+)$/);
    if (split) return { title: split[1].trim(), body: split[2].trim() };
    const words = text.split(/\s+/);
    if (words.length > 8) {
      return { title: words.slice(0, 5).join(" "), body: text };
    }
    return { title: text.slice(0, 42), body: text };
  });

  const warranties = (data.warranty.highlights ?? [])
    .filter((h) => h.label?.trim() && h.value?.trim())
    .slice(0, 2)
    .map((h) => ({
      title: h.label.trim(),
      body: [h.value, h.unit, h.label].filter(Boolean).join(" "),
    }));

  if (cards.length > 0) return cards;
  return warranties;
}

export function luminaHardwareRows(data: ProposalData): LuminaHardwareRow[] {
  const items = (data.bom ?? []).filter((b) => b.name?.trim());
  const panel = findBom(items, /panel|module|pv\b/i);
  const inverter = findBom(items, /inverter/i);
  const structure = findBom(items, /mount|structure|racking|mms/i);
  const cable = findBom(items, /cable|wire|conductor/i);
  const earth = findBom(items, /earth|earthing|cu\s*rod|copper\s*rod|gi\s*pipe/i);

  const rows: LuminaHardwareRow[] = [];
  if (panel) rows.push(rowFromBom(panel, "Solar modules"));
  if (inverter) rows.push(rowFromBom(inverter, "Inverter", true));
  if (structure) rows.push(rowFromBom(structure, "Mounting structure"));
  if (cable) rows.push(rowFromBom(cable, "DC + AC cabling"));

  if (earth) {
    const live = rowFromBom(earth, "Earthing");
    const hasQty = /3\s*nos|17\s*mm/i.test(`${live.detail} ${live.chips.join(" ")} ${earth.spec}`);
    rows.push({
      ...live,
      chips: uniqueChips([...live.chips, "3 nos", "17 mm copper rod"]),
      detail: hasQty
        ? live.detail
        : [live.detail, "3 nos · 17 mm copper rod"].filter(Boolean).join(" · "),
    });
  } else {
    rows.push({
      role: "Earthing",
      title: "Copper earth rod",
      detail: "3 nos · 17 mm copper rod · IS 3043 earth pit",
      chips: ["3 nos", "17 mm", "IS 3043"],
      image: "/assets/hardware/default.svg",
    });
  }

  return rows.slice(0, 5);
}
