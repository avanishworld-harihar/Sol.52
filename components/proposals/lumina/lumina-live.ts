/**
 * Lumina — live ProposalData only. No Harihar / Satna / 5 kW / ₹2.2L / Waaree fallbacks.
 */

import type { ProposalBillMonth, ProposalBomItem, ProposalData } from "@/lib/proposal-data";

export const LUMINA_HERO_PHOTO = "/assets/proposals/lumina-cover-friends-center.jpg";
export const LUMINA_HERO_ALT =
  "Family and friends gathered under an elevated rooftop solar plant at evening, guitar and sofas centered on this terrace";
export const LUMINA_CLOSE_PHOTO = "/assets/proposals/lumina-close-look-out.jpg";
export const LUMINA_CLOSE_ALT =
  "Indian couple at the rooftop glass railing with coffee, both looking out at the sunset, elevated solar plant behind them";

export function luminaBrand(data: ProposalData): string {
  return data.meta.brandName?.trim() || data.closing.installerName?.trim() || "";
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
  if (data.bill.yearlyBillInr > 0) return Math.round(data.bill.yearlyBillInr);
  const totals = data.bill.totals?.netInr ?? 0;
  if (totals > 0) return Math.round(totals);
  const fromMonths = (data.bill.months ?? []).reduce((sum, m) => sum + (m.netInr || 0), 0);
  if (fromMonths > 0) return Math.round(fromMonths);
  return 0;
}

export function luminaMonthlyBill(data: ProposalData): number {
  const months = (data.bill.months ?? []).filter((m) => m.netInr > 0);
  if (months.length > 0) {
    const sum = months.reduce((s, m) => s + m.netInr, 0);
    return Math.round(sum / months.length);
  }
  const yearly = luminaYearlyBill(data);
  return yearly > 0 ? Math.round(yearly / 12) : 0;
}

export function luminaBillMonths(data: ProposalData): ProposalData["bill"]["months"] {
  return (data.bill.months ?? []).filter((m) => m.units > 0 || m.netInr > 0);
}

export function luminaLifetime(data: ProposalData): number {
  if (data.closing.lifetimeWealthInr > 0) return data.closing.lifetimeWealthInr;
  if (data.economics.lifetimeProfitInr > 0) return data.economics.lifetimeProfitInr;
  return 0;
}


export type LuminaHwKind = "panel" | "inverter" | "structure" | "dcdb" | "acdb" | "earth";

export type LuminaHardwareRow = {
  kind: LuminaHwKind;
  role: string;
  title: string;
  detail: string;
  chips: string[];
  image: string;
  accent?: boolean;
};

/** Commercial BOM headings / specs (tiered BOM + system architecture). Local copy — do not import commercial blocks. */
type LuminaHwCatalog = {
  kind: LuminaHwKind;
  role: string;
  title: string;
  detail: string;
  chips: string[];
  accent?: boolean;
};

const LUMINA_HW_CATALOG: Record<LuminaHwKind, LuminaHwCatalog> = {
  panel: {
    kind: "panel",
    role: "Solar PV Modules",
    title: "Tier-1 ALMM-listed",
    detail: "BIS / MNRE listed PV modules",
    chips: ["25 yr linear", "ALMM"],
  },
  inverter: {
    kind: "inverter",
    role: "String Inverter",
    title: "IEC 62109",
    detail: "On-grid string inverter · MPPT · IP65 · LCD",
    chips: ["MPPT", "IP65", "5 yr standard"],
    accent: true,
  },
  structure: {
    kind: "structure",
    role: "Module Mounting Structure",
    title: "IS 2062, zinc ≥ 85 µm",
    detail: "Hot-dip galvanised MS / Aluminium, wind-load engineered",
    chips: ["HDG", "10 yr structural"],
  },
  dcdb: {
    kind: "dcdb",
    role: "DCDB (DC Distribution Box)",
    title: "Havells / Phoenix",
    detail: "Fuse + Type II SPD · protects DC side (panels → inverter)",
    chips: ["1 nos", "Type II SPD", "Fuse"],
  },
  acdb: {
    kind: "acdb",
    role: "ACDB (AC Distribution Box)",
    title: "Havells / Schneider",
    detail: "IP54 weatherproof · MCB + RCCB + SPD + energy meter",
    chips: ["1 nos", "IP54", "MCB + RCCB + SPD"],
  },
  earth: {
    kind: "earth",
    role: "Earthing System",
    title: "Copper-bonded / GI",
    detail: "3 nos × 17 mm copper rod · IS 3043 earth pit",
    chips: ["3 nos", "17 mm copper rod", "IS 3043"],
  },
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

function bomHay(item: ProposalBomItem): string {
  return `${item.name} ${item.brand} ${item.spec}`;
}

function isCombinedProtect(item: ProposalBomItem): boolean {
  const hay = bomHay(item);
  const name = item.name;
  return (
    (/acdb/i.test(hay) && /dcdb/i.test(hay)) ||
    /protection|safety/i.test(name)
  );
}

function claimBom(
  items: ProposalBomItem[],
  used: Set<number>,
  pred: (item: ProposalBomItem) => boolean
): ProposalBomItem | null {
  const idx = items.findIndex((item, i) => !used.has(i) && pred(item));
  if (idx < 0) return null;
  used.add(idx);
  return items[idx];
}

function pickLiveDetail(item: ProposalBomItem, title: string, fallback: string): string {
  const points = (item.technicalPoints ?? []).map((p) => p.trim()).filter(Boolean);
  const joined = points.slice(0, 2).join(" · ");
  const specLine = [item.spec, item.warranty].filter(Boolean).join(" · ");
  const desc = item.description?.trim() ?? "";
  const candidates = [joined, specLine, desc];
  for (const raw of candidates) {
    const v = raw.trim();
    if (!v) continue;
    if (v.toLowerCase() === title.toLowerCase()) continue;
    return v;
  }
  return fallback;
}

function extractSideSpec(item: ProposalBomItem | null, side: "dcdb" | "acdb"): string | null {
  if (!item) return null;
  const blob = [item.spec, item.description, ...(item.technicalPoints ?? [])]
    .filter(Boolean)
    .join(" · ");
  const re = side === "dcdb" ? /dcdb\s*[:·]\s*([^·]+)/i : /acdb\s*[:·]\s*([^·]+)/i;
  const match = blob.match(re)?.[1]?.trim();
  return match || null;
}

function rowFromCatalog(
  kind: LuminaHwKind,
  item: ProposalBomItem | null,
  extras?: { title?: string; detail?: string; chips?: Array<string | undefined> }
): LuminaHardwareRow {
  const catalog = LUMINA_HW_CATALOG[kind];
  const title = extras?.title?.trim() || item?.brand?.trim() || catalog.title;
  const liveDetail = item ? pickLiveDetail(item, title, catalog.detail) : "";
  const detail = extras?.detail?.trim() || liveDetail || catalog.detail;
  const hay = item ? bomHay(item) : catalog.role;
  const combined = item ? isCombinedProtect(item) : false;
  const specChip =
    item?.spec && item.spec.length <= 42 && !(/acdb/i.test(item.spec) && /dcdb/i.test(item.spec))
      ? item.spec
      : undefined;
  const nameChip =
    item && item.name !== item.brand && !combined && !/protection|safety/i.test(item.name)
      ? item.name
      : undefined;
  return {
    kind,
    role: catalog.role,
    title,
    detail,
    chips: uniqueChips([
      ...(extras?.chips ?? []),
      specChip,
      item?.warranty,
      nameChip,
      ...catalog.chips,
    ]),
    image: luminaHardwareImage(hay),
    accent: catalog.accent,
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

export type LuminaMonthRow = {
  m: string;
  val: number;
  peak: boolean;
  /** Live bill consumption for this calendar month; null when no bill series. */
  billUnits: number | null;
};

const MONTH_KEY_TO_INDEX: Record<string, number> = {
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
  जन: 0,
  फर: 1,
  मार: 2,
  अप्र: 3,
  मई: 4,
  जून: 5,
  जू: 5,
  जुल: 6,
  अग: 7,
  सित: 8,
  सि: 8,
  अक्ट: 9,
  नव: 10,
  दिस: 11,
};

function monthIndexFromLabel(label: string): number | null {
  const raw = label.trim();
  if (!raw) return null;
  const key3 = raw.slice(0, 3).toLowerCase();
  if (key3 in MONTH_KEY_TO_INDEX) return MONTH_KEY_TO_INDEX[key3]!;
  const key2 = raw.slice(0, 2).toLowerCase();
  if (key2 in MONTH_KEY_TO_INDEX) return MONTH_KEY_TO_INDEX[key2]!;
  const full = raw.toLowerCase();
  const idx = LUMINA_MONTH_SHARE.findIndex((row) => full.startsWith(row.m.toLowerCase()));
  return idx >= 0 ? idx : null;
}

function mapBillUnitsByCalendarMonth(
  billMonths: ProposalBillMonth[] | undefined
): Array<number | null> {
  const out: Array<number | null> = Array.from({ length: 12 }, () => null);
  if (!billMonths?.length) return out;
  for (const row of billMonths) {
    const idx = monthIndexFromLabel(row.label);
    if (idx == null) continue;
    out[idx] = Math.max(0, Math.round(Number(row.units) || 0));
  }
  return out;
}

export function luminaHasBillUnits(data: ProposalData): boolean {
  return (data.bill.months ?? []).some((m) => m.units > 0);
}

export function luminaBillYearUnits(data: ProposalData): number {
  return (data.bill.months ?? []).reduce((sum, m) => sum + (m.units > 0 ? m.units : 0), 0);
}

export function luminaMonthlyForecast(data: ProposalData): LuminaMonthRow[] {
  const annual = luminaAnnualUnits(data);
  const billByMonth = mapBillUnitsByCalendarMonth(data.bill.months);
  const showBill = luminaHasBillUnits(data);
  return LUMINA_MONTH_SHARE.map((row, i) => ({
    m: row.m,
    val: annual > 0 ? Math.round(annual * row.share) : 0,
    peak: row.peak,
    billUnits: showBill ? billByMonth[i] : null,
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
  const used = new Set<number>();

  const panel = claimBom(
    items,
    used,
    (it) => /panel|module|pv\b/i.test(bomHay(it)) && !/inverter/i.test(it.name)
  );
  const inverter = claimBom(items, used, (it) => /inverter/i.test(bomHay(it)));
  const structure = claimBom(items, used, (it) =>
    /mount|structure|racking|mms/i.test(bomHay(it))
  );
  const dcdb = claimBom(
    items,
    used,
    (it) => /\bdcdb\b|dc\s*distribution/i.test(bomHay(it)) && !isCombinedProtect(it)
  );
  const acdb = claimBom(
    items,
    used,
    (it) => /\bacdb\b|ac\s*distribution/i.test(bomHay(it)) && !isCombinedProtect(it)
  );
  const earth = claimBom(items, used, (it) => {
    const nameBrand = `${it.name} ${it.brand}`;
    if (/earth|earthing|cu\s*rod|copper\s*rod|gi\s*pipe/i.test(nameBrand)) return true;
    return /earth|earthing/i.test(bomHay(it)) && !isCombinedProtect(it);
  });
  const sharedProtect = claimBom(
    items,
    used,
    (it) => isCombinedProtect(it) || /protection|safety|spd|mcb/i.test(bomHay(it))
  );

  const dcdbItem = dcdb ?? sharedProtect;
  const acdbItem = acdb ?? sharedProtect;
  const dcdbSide = extractSideSpec(dcdbItem, "dcdb");
  const acdbSide = extractSideSpec(acdbItem, "acdb");

  const earthLive = earth ? rowFromCatalog("earth", earth) : rowFromCatalog("earth", null);
  const earthBlob = `${earthLive.detail} ${earthLive.chips.join(" ")} ${earth?.spec ?? ""}`;
  const earthHasQty = /3\s*nos|17\s*mm/i.test(earthBlob);

  return [
    rowFromCatalog("panel", panel),
    rowFromCatalog("inverter", inverter),
    rowFromCatalog("structure", structure),
    rowFromCatalog("dcdb", dcdbItem, {
      detail: dcdb
        ? undefined
        : dcdbSide
          ? `${dcdbSide.trim()} · panels → inverter`
          : LUMINA_HW_CATALOG.dcdb.detail,
    }),
    rowFromCatalog("acdb", acdbItem, {
      detail: acdb
        ? undefined
        : acdbSide
          ? `IP54 · ${acdbSide.trim()} · energy meter`
          : LUMINA_HW_CATALOG.acdb.detail,
    }),
    {
      ...earthLive,
      chips: uniqueChips([...earthLive.chips, "3 nos", "17 mm copper rod", "IS 3043"]),
      detail: earthHasQty
        ? earthLive.detail
        : [earthLive.detail, "3 nos × 17 mm copper rod"].filter(Boolean).join(" · "),
    },
  ];
}
