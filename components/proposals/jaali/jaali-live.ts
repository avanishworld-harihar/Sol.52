/**
 * Jaali — live ProposalData only. No Harihar / Satna / 5 kW / ₹2.2L / Waaree fallbacks.
 */

import type { ProposalBillMonth, ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import { RESIDENTIAL_ENGINEERING_STANDARDS } from "@/lib/proposal-engineering-metrics";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { recommendedTiltFromLatitude, resolveSiteLatitude } from "@/lib/proposal-site-geo";

export const JAALI_HERO_PHOTO = "/assets/proposals/jaali-cover-day.jpg";
export const JAALI_HERO_ALT =
  "Through a sandstone jaali: quiet haveli courtyard, one south-facing elevated GI MMS table on the terrace";
export const JAALI_CLOSE_PHOTO = "/assets/proposals/jaali-close-evening.jpg";
export const JAALI_CLOSE_ALT =
  "Evening haveli courtyard: Indian family under lattice shadows, solar array on the terrace above";

export function jaaliBrand(data: ProposalData): string {
  return data.meta.brandName?.trim() || data.closing.installerName?.trim() || "";
}

export function jaaliBrandParts(data: ProposalData): { head: string; tail: string } {
  const brand = jaaliBrand(data);
  const parts = brand.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { head: brand, tail: "" };
  return { head: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
}

export function jaaliNetInvestment(data: ProposalData): number {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  if (gross <= 0) return 0;
  if (subsidy > 0 && data.economics.netInr > 0) return Math.round(data.economics.netInr);
  return Math.round(gross);
}

export function jaaliAnnualUnits(data: ProposalData): number {
  return data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
}

export function jaaliLocation(data: ProposalData): string {
  return data.meta.locationLine?.trim() || data.engineering.cityLabel?.trim() || "";
}

export function jaaliIssueDate(generatedAt?: string): string {
  const d = generatedAt ? new Date(generatedAt) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatJaaliKw(kw: number): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(1);
}

export function jaaliMonthlySavings(data: ProposalData): number {
  if (data.economics.monthlySavingsInr > 0) return Math.round(data.economics.monthlySavingsInr);
  if (data.closing.annualSavingsInr > 0) return Math.round(data.closing.annualSavingsInr / 12);
  return 0;
}

export function jaaliAnnualSavings(data: ProposalData): number {
  if (data.closing.annualSavingsInr > 0) return Math.round(data.closing.annualSavingsInr);
  if (data.economics.monthlySavingsInr > 0) return Math.round(data.economics.monthlySavingsInr * 12);
  return 0;
}

export function jaaliYearlyBill(data: ProposalData): number {
  if (data.bill.yearlyBillInr > 0) return Math.round(data.bill.yearlyBillInr);
  const totals = data.bill.totals?.netInr ?? 0;
  if (totals > 0) return Math.round(totals);
  const fromMonths = (data.bill.months ?? []).reduce((sum, m) => sum + (m.netInr || 0), 0);
  if (fromMonths > 0) return Math.round(fromMonths);
  return 0;
}

export function jaaliMonthlyBill(data: ProposalData): number {
  const months = (data.bill.months ?? []).filter((m) => m.netInr > 0);
  if (months.length > 0) {
    const sum = months.reduce((s, m) => s + m.netInr, 0);
    return Math.round(sum / months.length);
  }
  const yearly = jaaliYearlyBill(data);
  return yearly > 0 ? Math.round(yearly / 12) : 0;
}

export function jaaliBillMonths(data: ProposalData): ProposalData["bill"]["months"] {
  return (data.bill.months ?? []).filter((m) => m.units > 0 || m.netInr > 0);
}

export function jaaliLifetime(data: ProposalData): number {
  if (data.closing.lifetimeWealthInr > 0) return data.closing.lifetimeWealthInr;
  if (data.economics.lifetimeProfitInr > 0) return data.economics.lifetimeProfitInr;
  return 0;
}


export type JaaliHwKind = "panel" | "inverter" | "structure" | "dcdb" | "acdb" | "la" | "earth";

export type JaaliHardwareRow = {
  kind: JaaliHwKind;
  role: string;
  title: string;
  detail: string;
  points: string[];
  chips: string[];
  image: string;
  accent?: boolean;
};

/**
 * Golden BOM technical fragments (editorial enrich + System Parts page).
 * Local copy — do not import Golden modules. Earthing stays residential 3 × 17 mm.
 */
type JaaliHwCatalog = {
  kind: JaaliHwKind;
  role: string;
  title: string;
  detail: string;
  extraDetails: string[];
  chips: string[];
  accent?: boolean;
};

const JAALI_HW_CATALOG: Record<JaaliHwKind, JaaliHwCatalog> = {
  panel: {
    kind: "panel",
    role: "Solar PV Modules",
    title: "Tier-1 ALMM-listed",
    detail: "η ≥ 21% · BIS IS 14286 · MNRE ALMM · IEC 61215 & IEC 61730",
    extraDetails: [
      "≥21% module efficiency · ≤0.55%/yr linear degradation after Y1",
      "Mono PERC / TOPCon · PID-resistant · 30 yr performance warranty",
      "BIS IS 14286 · MNRE ALMM · IEC 61215 & IEC 61730",
    ],
    chips: ["30 yr performance", "25 yr linear", "ALMM", "IEC 61215"],
  },
  inverter: {
    kind: "inverter",
    role: "String Inverter",
    title: "IEC 62109",
    detail: "On-grid string inverter · dual MPPT · ≥97.5% max efficiency · IP65",
    extraDetails: [
      "≥97.5% max efficiency · IP65 outdoor enclosure · LCD display",
      "Grid-tie sync · anti-islanding · IEC 62109",
      "Remote monitoring (where applicable) · grid synchronization",
    ],
    chips: ["10 Year", "Dual MPPT", "IP65", "IEC 62109"],
    accent: true,
  },
  structure: {
    kind: "structure",
    role: "Module Mounting Structure",
    title: "IS 2062, zinc ≥ 85 µm",
    detail: "Hot-dip galvanized (HDG) mild steel structure · IS 2062 · zinc ≥ 85 µm",
    extraDetails: [
      "150 km/h wind load (IS 875) · RCC penetration / clamp system",
      "Corrosion-resistant fasteners · 25-year service life",
      "M12/M16 SS 304 chemical anchor · IS 2062 MS · zinc coating ≥ 85 µm",
    ],
    chips: ["10 Year", "HDG", "IS 2062", "Zn ≥ 85 µm"],
  },
  dcdb: {
    kind: "dcdb",
    role: "DCDB (DC Distribution Box)",
    title: "Havells / Phoenix",
    detail: "IP65 enclosure · DC isolator · fuse + Type II SPD · PV array to inverter",
    extraDetails: [
      "Lightning protection · over-current / over-voltage protection",
      "Fuse + Type II SPD · panels → inverter",
      "IP65 enclosure · DC isolator",
    ],
    chips: ["5 Year", "IP65", "DC isolator", "Type II SPD"],
  },
  acdb: {
    kind: "acdb",
    role: "ACDB (AC Distribution Box)",
    title: "Havells / Schneider",
    detail: "IP54 weatherproof · MCB + RCCB + Type II SPD + energy meter · isolator",
    extraDetails: [
      "Lightning protection · over-current / over-voltage protection · IP54",
      "IP54 weatherproof · MCB + RCCB + SPD + energy meter",
      "Isolator · over-current / over-voltage protection",
    ],
    chips: ["5 Year", "IP54", "MCB + RCCB", "SPD"],
  },
  earth: {
    kind: "earth",
    role: "Earthing System",
    title: "Copper-bonded / GI",
    detail: "3 nos × 17 mm copper rod · IS 3043 earth pit · chemical compound · ≤1 Ω",
    extraDetails: [
      "Chemical earthing compound · resistance ≤1 Ω",
      "Bonds inverter, DCDB, ACDB and lightning arrester",
    ],
    chips: ["3 nos", "17 mm", "IS 3043", "≤1 Ω"],
  },
  la: {
    kind: "la",
    role: "Lightning Arrester",
    title: "IEC 62305",
    detail: "Roof air terminal · down conductor to earth pit · array high point",
    extraDetails: [
      "Air terminal at the array high point · down conductor to earth",
      "IEC 62305 Class I/II · NBC lightning protection · bonded earth pit",
    ],
    chips: ["IEC 62305", "Air terminal", "Down conductor", "Bonded earth"],
  },
};

const JAALI_HW_IMAGES: Array<{ match: RegExp; src: string }> = [
  { match: /waaree|waree|adani|panel|module|pv\b/i, src: "/assets/hardware/panel.png" },
  { match: /inverter|mppt|ongrid|havells/i, src: "/assets/hardware/inverter.png" },
  { match: /structure|mount|jsw|mms|racking/i, src: "/assets/hardware/structure.png" },
  { match: /cable|wire|polycab|conductor/i, src: "/assets/hardware/cable.png" },
];

function jaaliHardwareImage(hay: string): string {
  for (const row of JAALI_HW_IMAGES) {
    if (row.match.test(hay)) return row.src;
  }
  return "/assets/hardware/default.svg";
}

function fragKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[·,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function alreadyCovered(hay: string, frag: string): boolean {
  const f = fragKey(frag);
  if (!f) return true;
  if (hay.includes(f)) return true;
  const tokens = f.split(" ").filter((t) => t.length > 2 && !/^(and|the|with|for)$/.test(t));
  if (tokens.length === 0) return false;
  return tokens.every((t) => hay.includes(t));
}

function filterPointsForKind(kind: JaaliHwKind, points: string[]): string[] {
  return points.filter((p) => {
    if (kind === "dcdb")
      return !/\bacdb\b/i.test(p) && !/earthing|earth pit|copper earthing|lightning arrest/i.test(p);
    if (kind === "acdb")
      return !/\bdcdb\b/i.test(p) && !/earthing|earth pit|copper earthing|lightning arrest/i.test(p);
    if (kind === "la")
      return !/\bdcdb\b/i.test(p) && !/\bacdb\b/i.test(p) && !/17\s*mm|copper rod|earth pit/i.test(p);
    if (kind === "earth")
      return !/\bdcdb\b/i.test(p) && !/\bacdb\b/i.test(p) && !/air terminal|lightning arrest/i.test(p);
    return true;
  });
}

function collectPoints(parts: string[], max = 4): string[] {
  const out: string[] = [];
  let hay = "";
  for (const part of parts) {
    if (!part?.trim()) continue;
    for (const frag of part.split(/\s*·\s*/)) {
      const t = frag.trim();
      if (!t || alreadyCovered(hay, t)) continue;
      out.push(t);
      hay = `${hay} ${fragKey(t)}`.trim();
      if (out.length >= max) return out;
    }
  }
  return out;
}

function uniqueChips(values: Array<string | undefined>, details = ""): string[] {
  const seen = new Set<string>();
  const years = new Set<string>();
  const hay = details.toLowerCase();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw?.trim();
    if (!v || v.length > 32) continue;
    const key = v.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    const year = v.match(/(\d+)\s*(yr|year)/i)?.[1];
    if (year) {
      if (years.has(year)) continue;
      years.add(year);
    }
    if (v.length > 14 && hay.includes(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.slice(0, 5);
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
  const joined = points.slice(0, 3).join(" · ");
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
  kind: JaaliHwKind,
  item: ProposalBomItem | null,
  extras?: {
    title?: string;
    detail?: string;
    chips?: Array<string | undefined>;
    prependPoints?: string[];
  }
): JaaliHardwareRow {
  const catalog = JAALI_HW_CATALOG[kind];
  const title = extras?.title?.trim() || item?.brand?.trim() || catalog.title;
  const liveDetail = item ? pickLiveDetail(item, title, catalog.detail) : "";
  const preferred = extras?.detail?.trim() || liveDetail || catalog.detail;
  const livePoints = filterPointsForKind(
    kind,
    (item?.technicalPoints ?? []).map((p) => p.trim()).filter(Boolean)
  );
  const points = collectPoints(
    [...(extras?.prependPoints ?? []), ...livePoints, preferred, ...catalog.extraDetails],
    4
  );
  const detail = points.join(" · ") || catalog.detail;
  const hay = item ? bomHay(item) : catalog.role;
  const combined = item ? isCombinedProtect(item) : false;
  const specChip =
    item?.spec &&
    item.spec.length <= 22 &&
    !(/acdb/i.test(item.spec) && /dcdb/i.test(item.spec))
      ? item.spec
      : undefined;
  const nameChip =
    item &&
    item.name !== item.brand &&
    !combined &&
    !/protection|safety|panels?|modules?|inverter|structure|mounting|dcdb|acdb|earth|lightning|arrester|\bla\b/i.test(
      item.name
    )
      ? item.name
      : undefined;
  return {
    kind,
    role: catalog.role,
    title,
    detail,
    points,
    chips: uniqueChips(
      [...(extras?.chips ?? []), specChip, item?.warranty, nameChip, ...catalog.chips],
      detail
    ),
    image: jaaliHardwareImage(hay),
    accent: catalog.accent,
  };
}

/** Typical central-India rooftop share of year-1 yield. Applied only to live annual units. */
const JAALI_MONTH_SHARE: ReadonlyArray<{ m: string; share: number; peak: boolean }> = [
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

export type JaaliMonthRow = {
  m: string;
  val: number;
  peak: boolean;
  /** Live bill consumption for this calendar month; null when no bill series. */
  billUnits: number | null;
  /** Monthly ₹ saving from live annual saving × this month's share. 0 when no live saving. */
  savingsInr: number;
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
  const idx = JAALI_MONTH_SHARE.findIndex((row) => full.startsWith(row.m.toLowerCase()));
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

export function jaaliHasBillUnits(data: ProposalData): boolean {
  return (data.bill.months ?? []).some((m) => m.units > 0);
}

export function jaaliBillYearUnits(data: ProposalData): number {
  return (data.bill.months ?? []).reduce((sum, m) => sum + (m.units > 0 ? m.units : 0), 0);
}

export function jaaliMonthlyForecast(data: ProposalData): JaaliMonthRow[] {
  const annual = jaaliAnnualUnits(data);
  const annualSave = jaaliAnnualSavings(data);
  const rate = annual > 0 && annualSave > 0 ? annualSave / annual : 0;
  const billByMonth = mapBillUnitsByCalendarMonth(data.bill.months);
  const showBill = jaaliHasBillUnits(data);
  return JAALI_MONTH_SHARE.map((row, i) => {
    const val = annual > 0 ? Math.round(annual * row.share) : 0;
    return {
      m: row.m,
      val,
      peak: row.peak,
      billUnits: showBill ? billByMonth[i] : null,
      savingsInr: rate > 0 && val > 0 ? Math.round(val * rate) : 0,
    };
  });
}

export type JaaliForecastNotes = {
  insightTag: string;
  insightTitle: string;
  insightBody: string;
  savingsBasis: string | null;
};

/** Live ₹/unit only. 0 when year-1 units or savings are missing — never invent a tariff. */
export function jaaliEffectiveSavingRate(data: ProposalData): number {
  const units = jaaliAnnualUnits(data);
  const sav = jaaliAnnualSavings(data);
  if (!(units > 0) || !(sav > 0)) return 0;
  return sav / units;
}

/**
 * Generation-engineering footnote + insight for Seasonal Forecast.
 * Uses live tilt when present; seasonal GHI / soiling copy is climate knowledge, not a fake site audit.
 */
export function jaaliForecastNotes(
  data: ProposalData,
  lang: "en" | "hi" = "en"
): JaaliForecastNotes {
  const hi = lang === "hi";
  const months = jaaliMonthlyForecast(data);
  const annual = jaaliAnnualUnits(data);
  const peakMonths = months.filter((m) => m.peak).map((m) => m.m);
  const peakSpan =
    peakMonths.length >= 2
      ? `${peakMonths[0]}–${peakMonths[peakMonths.length - 1]}`
      : peakMonths[0] || "Mar–Jun";
  const trough = months.reduce((best, m) => (m.val > 0 && m.val < best.val ? m : best), months[0]!);

  const eng = jaaliEngineeringModel(data);
  const tiltLive = data.engineering.tiltDeg && data.engineering.tiltDeg > 0;
  const tiltDeg = tiltLive ? data.engineering.tiltDeg! : eng.siteLatLabel && eng.tiltDeg > 0 ? eng.tiltDeg : 0;

  const parts: string[] = [];
  if (annual > 0) {
    parts.push(
      hi
        ? `Terracotta पट्टियाँ (${peakSpan}) monsoon से पहले की तेज़ धूप (GHI) हैं: सूरज ऊँचा रहता है, आसमान साफ़ रहता है, इसलिए array को साल की सबसे तेज़ रोशनी मिलती है।`
        : `Terracotta bars (${peakSpan}) are pre-monsoon high-GHI months: the sun sits high and skies are typically clear, so the array sees the year’s strongest irradiance.`
    );
    parts.push(
      hi
        ? `बारिश में generation गिरती है क्योंकि monsoon के बादल GHI काट देते हैं — दिन लंबे होने पर भी।${
            trough.val > 0 ? ` ${trough.m} सबसे नीचा महीना है क्योंकि सूरज नीचा रहता है।` : ""
          }`
        : `Output then falls in the rains because monsoon cloud cover cuts GHI even though daylight hours stay long.${
            trough.val > 0 ? ` ${trough.m} is the trough as solar altitude is shallower.` : ""
          }`
    );
  } else {
    parts.push(
      hi
        ? "Central-India rooftop पर generation आमतौर पर monsoon से पहले peak पर होती है जब GHI सबसे ज़्यादा हो, फिर July–August में बादलों से गिरती है।"
        : "On a central-India rooftop, generation typically peaks before the monsoon when GHI is highest and skies are clear, then falls in July–August as cloud cover cuts irradiance."
    );
  }

  if (tiltDeg > 0) {
    parts.push(
      hi
        ? `Array tilt ${tiltDeg}° रखा गया है ताकि summer और winter दोनों में yield balance रहे — बिलकुल सपाट छत winter की रोशनी गवा देती है।`
        : `Array tilt is set to ${tiltDeg}° so summer and winter harvest stay balanced on this latitude — a flat terrace would give away winter yield.`
    );
  } else {
    parts.push(
      hi
        ? "Latitude के हिसाब से tilt winter की रोशनी बचाता है। इसलिए winter bars कम हैं, zero नहीं।"
        : "A latitude-matched tilt recovers more winter light than a flat terrace, which is why the winter bars are low, not zero."
    );
  }

  parts.push(
    hi
      ? "May–June में धूल और धुंध काँच पर बैठती है — June से पहले एक scheduled wash extra modules लगाने से ज़्यादा Year-1 kWh बचाती है।"
      : "Dust and pre-monsoon haze sit on the glass in late summer — a scheduled wash before June recovers more year-1 kWh than adding extra modules."
  );

  const rate = jaaliEffectiveSavingRate(data);
  return {
    insightTag: "Expert insight",
    insightTitle: hi ? "Bars ऊपर-नीचे क्यों होते हैं" : "Why the bars rise and fall",
    insightBody: parts.join(" "),
    savingsBasis:
      rate > 0
        ? hi
          ? `Estimated savings = महीने की units × ₹${rate.toFixed(2)}/unit effective saving rate. Fixed charges शामिल नहीं।`
          : `Estimated savings = monthly units × ₹${rate.toFixed(2)}/unit effective saving rate. Fixed charges excluded.`
        : null,
  };
}

export type JaaliTermCard = { title: string; body: string };

export function jaaliTermCards(data: ProposalData): JaaliTermCard[] {
  const raw = (data.terms.conditions ?? []).map((t) => t.trim()).filter(Boolean);
  const cards: JaaliTermCard[] = raw.slice(0, 4).map((text) => {
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

export function jaaliHardwareRows(data: ProposalData): JaaliHardwareRow[] {
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
  const la = claimBom(items, used, (it) => {
    const nameBrand = `${it.name} ${it.brand}`;
    return /lightning|arrester|\bla\b|air\s*terminal|down\s*conductor|ese\b/i.test(nameBrand);
  });
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
  const earthBlob = `${earthLive.detail} ${earthLive.points.join(" ")} ${earthLive.chips.join(" ")} ${earth?.spec ?? ""}`;
  const earthHasQty = /3\s*nos|17\s*mm/i.test(earthBlob);
  const earthPoints = earthHasQty
    ? earthLive.points
    : collectPoints([...earthLive.points, "3 nos × 17 mm copper rod"], 4);
  const earthDetail = earthPoints.join(" · ");

  const { count: panelCount, watt: panelWatt } = jaaliParsePanelArray(data);
  const acKw = Number(data.meta.systemKw) || 0;
  const dcKwp =
    panelCount > 0 && panelWatt > 0
      ? Math.round(((panelCount * panelWatt) / 1000) * 100) / 100
      : 0;
  const dcKwpLabel = Number.isInteger(dcKwp) ? String(dcKwp) : dcKwp.toFixed(2);
  const panelArrayLine =
    panelCount > 0 && panelWatt > 0
      ? `${panelCount} modules × ${panelWatt} Wp — ${dcKwpLabel} kWp DC array`
      : null;
  const inverterKwLine =
    acKw > 0 ? `${acKw} kW on-grid string inverter · dual MPPT` : null;

  return [
    rowFromCatalog("panel", panel, {
      prependPoints: panelArrayLine ? [panelArrayLine] : undefined,
    }),
    rowFromCatalog("inverter", inverter, {
      prependPoints: inverterKwLine ? [inverterKwLine] : undefined,
    }),
    rowFromCatalog("structure", structure),
    rowFromCatalog("dcdb", dcdbItem, {
      detail: dcdb
        ? undefined
        : dcdbSide
          ? `${dcdbSide.trim()} · panels → inverter`
          : JAALI_HW_CATALOG.dcdb.detail,
    }),
    rowFromCatalog("acdb", acdbItem, {
      detail: acdb
        ? undefined
        : acdbSide
          ? `IP54 · ${acdbSide.trim()} · energy meter`
          : JAALI_HW_CATALOG.acdb.detail,
    }),
    rowFromCatalog("la", la),
    {
      ...earthLive,
      points: earthPoints,
      detail: earthDetail,
      chips: uniqueChips(
        [...earthLive.chips, "3 nos", "17 mm copper rod", "IS 3043"],
        earthDetail
      ),
    },
  ];
}

const JAALI_M2_PER_PANEL = 2.2;
const JAALI_MAX_VISUAL_PANELS = 24;
const JAALI_M2_TO_SQFT = 10.764;

export function jaaliSqFtFromM2(m2: number): number {
  if (!(m2 > 0)) return 0;
  return Math.round(m2 * JAALI_M2_TO_SQFT);
}

/** e.g. ~18 m² (~194 sq ft). Empty when area is missing — never invents a roof size. */
export function formatJaaliAreaM2(m2: number): string {
  if (!(m2 > 0)) return "—";
  const sqft = jaaliSqFtFromM2(m2);
  return `~${m2} m² (~${sqft.toLocaleString("en-IN")} sq ft)`;
}

function jaaliParseMetricNumber(data: ProposalData, match: RegExp): number {
  const raw = jaaliMetricValue(data, match);
  if (!raw) return 0;
  const n = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function jaaliLiveCable(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): { note: string | null; dcM: number; acM: number; vdPct: number } {
  const layout = pptInput?.residentialTechnicalSpecs?.layout;
  const dcM =
    Number(layout?.dcRunLengthM) > 0
      ? Number(layout?.dcRunLengthM)
      : jaaliParseMetricNumber(data, /dc\s*run/i);
  const acM =
    Number(layout?.acRunLengthM) > 0
      ? Number(layout?.acRunLengthM)
      : jaaliParseMetricNumber(data, /ac\s*run/i);
  const vdPct =
    Number(layout?.voltageDropDcPct) > 0
      ? Number(layout?.voltageDropDcPct)
      : jaaliParseMetricNumber(data, /voltage\s*drop|\bvd\b/i);
  const bits: string[] = [];
  if (dcM > 0) bits.push(`DC run ${dcM} m`);
  if (acM > 0) bits.push(`AC run ${acM} m`);
  if (vdPct > 0) bits.push(`VD ${vdPct}%`);
  return { note: bits.length ? bits.join(" · ") : null, dcM, acM, vdPct };
}

function jaaliEngineeringStandards(data: ProposalData): string[] {
  const live = (data.engineering.standards ?? []).map((s) => s.trim()).filter(Boolean);
  const detailed = live.filter((s) => /IEC|IS\s*\d{3,5}|ALMM|62446|3043|732/i.test(s));
  if (detailed.length >= 3) return live;
  return [...RESIDENTIAL_ENGINEERING_STANDARDS];
}

function jaaliMetricValue(data: ProposalData, match: RegExp): string {
  const row = (data.engineering.metrics ?? []).find((m) => match.test(m.label));
  return row?.value?.trim() ?? "";
}

function jaaliParsePanelArray(data: ProposalData): { count: number; watt: number } {
  const panel = (data.bom ?? []).find(
    (it) => /panel|module|pv\b/i.test(`${it.name} ${it.spec}`) && !/inverter/i.test(it.name)
  );
  const blob = [panel?.spec, panel?.description, ...(panel?.technicalPoints ?? [])].join(" ");
  const pair = blob.match(/(\d+)\s*(?:modules?|nos\.?|pcs)?\s*[x×]\s*(\d{3,4})\s*(?:wp|w)/i);
  if (pair) {
    return { count: Number(pair[1]) || 0, watt: Number(pair[2]) || 0 };
  }
  const wattOnly = blob.match(/(\d{3,4})\s*(?:wp|w)/i);
  const watt = wattOnly ? Number(wattOnly[1]) || 0 : 0;
  const kw = Number(data.meta.systemKw) || 0;
  const count = watt > 0 && kw > 0 ? Math.max(1, Math.ceil((kw * 1000) / watt)) : 0;
  return { count, watt };
}

export type JaaliEngineeringModel = {
  acKw: number;
  dcKwp: number;
  dcAcRatio: number;
  panelCount: number;
  panelWatt: number;
  visualPanelCount: number;
  showingPartial: boolean;
  tiltDeg: number;
  azimuthDeg: number;
  cityLabel: string;
  siteLatLabel: string;
  roofAreaM2: number;
  roofAreaLabel: string;
  m2PerPanel: number;
  m2PerPanelLabel: string;
  performanceRatioPct: number;
  peakSunHours: number;
  specificYield: number;
  loadCoveragePct: number;
  standards: string[];
  tiltNote: string;
  cableNote: string | null;
  dcRunM: number;
  acRunM: number;
  vdPct: number;
  rowSpacingM: number;
};

export type JaaliEngInsightCard = {
  title: string;
  body: string;
};

export function jaaliEngineeringInsights(
  eng: JaaliEngineeringModel,
  lang: "en" | "hi" = "en"
): JaaliEngInsightCard[] {
  const hi = lang === "hi";
  const panelBit =
    eng.panelCount > 0
      ? `${eng.panelCount} module${eng.panelCount === 1 ? "" : "s"}`
      : hi
        ? "हर module"
        : "each module";
  const areaBit =
    eng.roofAreaM2 > 0
      ? `${formatJaaliAreaM2(eng.roofAreaM2)}`
      : hi
        ? "planning area"
        : "the planning area";
  const how =
    eng.panelCount > 0
      ? hi
        ? `${panelBit} × ${eng.m2PerPanelLabel} (glass + walkway + shade gap) = ${areaBit}. Extra छत बर्बाद नहीं — यह गली, हवा का रास्ता, और winter sun का buffer है।`
        : `${panelBit} × ${eng.m2PerPanelLabel} (glass + walkway + shade gap) = ${areaBit}. The extra is not wasted roof — it is the aisle, the wind path, and the winter-sun buffer.`
      : hi
        ? `हम हर module के लिए लगभग ${eng.m2PerPanelLabel} रखते हैं: काँच + walkway + छोटा shade gap. Module count proposal पर होने पर कुल area आएगा।`
        : `We plan about ${eng.m2PerPanelLabel} per module: the glass itself plus a walkway and a small shade gap. The total appears when module count is on this proposal.`;

  const liveCable = [
    eng.dcRunM > 0 ? `DC run ${eng.dcRunM} m` : null,
    eng.acRunM > 0 ? `AC run ${eng.acRunM} m` : null,
    eng.vdPct > 0 ? `voltage drop ${eng.vdPct}%` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const vdLine =
    eng.vdPct > 0
      ? hi
        ? ` इस drawing पर ${liveCable}. 2% से कम drop मतलब छत की लगभग सारी power घर तक पहुँचती है।`
        : ` On this drawing ${liveCable}. Under 2% drop means almost all roof power reaches the house.`
      : liveCable
        ? hi
          ? ` इस drawing पर: ${liveCable}.`
          : ` On this drawing: ${liveCable}.`
        : hi
          ? " Exact metres site survey के बाद lock होते हैं; नियम वही है — दोनों run छोटे रखो और cable मोटी।"
          : " Exact metres are locked after the site survey; the rule stays the same — keep both runs short and the cable thick enough.";

  const ratioLine =
    eng.dcAcRatio >= 1
      ? hi
        ? ` छत पर थोड़ा extra panel (DC/AC ${eng.dcAcRatio}) मतलब inverter सुबह जल्दी चालू होता है और शाम तक चलता है।`
        : ` Extra panel on the roof (DC/AC ${eng.dcAcRatio}) means the inverter starts earning earlier in the morning and keeps going later in the evening.`
      : "";

  const roof: JaaliEngInsightCard = {
    title: hi ? "इतनी छत क्यों?" : "Why this much roof?",
    body: hi
      ? "हर panel को छत पर पड़े दरवाज़े जैसा सोचो। अगर दरवाज़े चिपका कर रख दें, तो काँच पोंछने कोई चल नहीं सकता — और panel पर पैर रखने से छोटी cracks पड़ सकती हैं। Gap इसलिए भी है कि हवा निकल सके (भरी छत पाल जैसी बन जाती है) और गर्मी में काँच थोड़ा फैल सके।"
      : "Picture each panel as a door lying on the terrace. If we packed doors edge-to-edge, nobody could walk between them to wipe the glass — and stepping on a panel can make tiny cracks. We also leave gaps so wind can slip through (a packed roof acts like a sail) and so hot glass can grow a little in summer without pushing the next panel.",
  };
  const space: JaaliEngInsightCard = {
    title: hi ? "Space का हिसाब" : "How the space is counted",
    body: hi
      ? `High-efficiency module लगभग दरवाज़े जितना ऊँचा (~2.3 m) और ~1.1 m चौड़ा होता है। ${how} आगे-पीछे जगह इसलिए भी है कि winter में नीचा सूरज अगली row पर छाया न डाले।${
          eng.rowSpacingM > 0 ? ` इस drawing पर row gap ${eng.rowSpacingM} m है।` : ""
        }`
      : `A high-efficiency module is about as tall as a door (~2.3 m) and ~1.1 m wide. ${how} Front-to-back space also stops the first row shading the next when the winter sun sits low.${
          eng.rowSpacingM > 0 ? ` On this drawing the row gap is ${eng.rowSpacingM} m.` : ""
        }`,
  };
  const cable: JaaliEngInsightCard = {
    title: "DC run vs AC run",
    body: hi
      ? `Panel “कच्ची” बिजली बनाता है (DC) — जैसे कच्चा खाना। DC run छत से inverter (रसोई) तक का sun-proof cable है। इसे छोटा और मोटा रखते हैं ताकि power गर्मी बनकर न बहे — उसी leak को voltage drop कहते हैं। Inverter DC को AC बनाता है, जो पंखा-fridge पहले से खाते हैं। AC run inverter से main board तक छोटा तार है — पका खाना मेज़ तक।${vdLine}${ratioLine}`
      : `Panels make “raw” electricity (DC) — like uncooked food. The DC run is the sun-proof cable from the roof to the inverter (the kitchen). We keep it short and thick so power does not leak away as heat — that leak is voltage drop. The inverter “cooks” DC into AC, the kind your fan and fridge already eat. The AC run is the short cable from the inverter to your main switchboard — serving the meal to the table.${vdLine}${ratioLine}`,
  };

  const prPct = eng.performanceRatioPct;
  const pr =
    prPct > 0
      ? {
          title: hi ? `~${prPct}% क्यों, 100 क्यों नहीं?` : `Why ~${prPct}%, not 100?`,
          body: hi
            ? `सूरज छत पर 100 cups power भेजता है। गर्मी, wires, और inverter कुछ गिरा देते हैं। घर के पंखे-lights तक लगभग ${prPct} cups पहुँचती हैं। 100 cups किसी को नहीं मिलते — ~${prPct}% अच्छा score है, plant खराब नहीं।`
            : `Pretend the sun sends 100 cups of power to the roof. Heat, wires, and the inverter spill some. About ${prPct} cups still reach your fan and lights. Nobody gets 100 cups — ~${prPct}% is a healthy score, not a broken plant.`,
        }
      : {
          title: hi ? "100% क्यों नहीं?" : "Why not 100%?",
          body: hi
            ? "सूरज छत पर 100 cups power भेजता है। गर्मी, wires, और inverter कुछ गिरा देते हैं। बाकी पंखे-lights तक पहुँचती हैं। बचे हुए score को performance ratio कहते हैं। Plant size proposal पर होने पर यह नंबर आएगा।"
            : "Pretend the sun sends 100 cups of power to the roof. Heat, wires, and the inverter spill some. The rest still reach your fan and lights. That leftover score is the performance ratio. The number appears when plant size is on this proposal.",
        };

  const r = eng.dcAcRatio;
  const ratio =
    r > 0 && r >= 1
      ? {
          title: hi ? `DC/AC ${r} — extra panel` : `DC/AC ${r} — extra panel`,
          body: hi
            ? `Inverter एक fixed size का lunchbox है। छत पर थोड़ा extra खाना रखते हैं (DC/AC ${r})। कमजोर सुबह-शाम की धूप से भी box भर जाता है। दोपहर में box पहले से भरा है, तो थोड़ा बच जाता है। Extra खाना मतलब lunch के ज़्यादा घंटे — बड़ा box नहीं।`
            : `The inverter is a lunchbox of a fixed size. We pack a little extra food on the roof (DC/AC ${r}). Weak morning and evening sun still fills the box. At noon the box is already full, so a tiny bit is leftover. Extra food means more hours of lunch — not a bigger box.`,
        }
      : r > 0
        ? {
            title: `DC/AC ${r}`,
            body: hi
              ? `Inverter एक lunchbox है। छत के panel खाना हैं। DC/AC ${r} मतलब box सारी roof power बिना गिराए ले सकता है।`
              : `The inverter is a lunchbox. Panels on the roof are the food. DC/AC ${r} means the box can take all the roof power without spilling.`,
          }
        : {
            title: hi ? "DC/AC — extra panel" : "DC/AC — extra panel",
            body: hi
              ? "Inverter एक fixed size का lunchbox है। छत पर थोड़ा extra panel extra खाना है: कमजोर सुबह-शाम में भी box भर जाता है। Panel size और inverter size दोनों proposal पर होने पर live ratio आएगा।"
              : "The inverter is a lunchbox of a fixed size. A little extra panel on the roof is extra food: weak morning and evening sun still fills the box. The live ratio appears when both panel size and inverter size are on this proposal.",
          };

  const y = eng.specificYield;
  const yieldCard =
    y > 0
      ? {
          title: hi ? `${y} — साल का score` : `${y} — one year's score`,
          body: hi
            ? `1 kW को एक school bag सोचो। इस छत से उस bag में साल में लगभग ${y} बार बिजली की units (kWh) भरती हैं। बड़ा plant = ज़्यादा bags, हर bag का score वही। यह इस शहर का sun report card है।`
            : `Think of 1 kW as one school bag of plant. In a year this roof fills that bag about ${y} times with units of electricity (kWh). A bigger plant is more bags — same score per bag. That number is this city's sun report card.`,
        }
      : {
          title: hi ? "Specific yield — साल का score" : "Specific yield — one year's score",
          body: hi
            ? "1 kW को एक school bag सोचो। Specific yield बताता है एक bag साल में कितनी units बनाता है। Yearly generation proposal पर होने पर यह नंबर आएगा।"
            : "Think of 1 kW as one school bag of plant. Specific yield says how many units of electricity one bag makes in a year. The number appears when yearly generation is on this proposal.",
        };

  return [roof, space, cable, pr, ratio, yieldCard];
}

export function jaaliEngineeringModel(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): JaaliEngineeringModel {
  const acKw = Number(data.meta.systemKw) || 0;
  const annual = jaaliAnnualUnits(data);
  const { count, watt } = jaaliParsePanelArray(data);
  const dcKwp = count > 0 && watt > 0 ? Math.round(((count * watt) / 1000) * 100) / 100 : 0;
  const dcAcRatio = acKw > 0 && dcKwp > 0 ? Math.round((dcKwp / acKw) * 100) / 100 : 0;
  const specificYield = acKw > 0 && annual > 0 ? Math.round(annual / acKw) : 0;

  const coverageRaw = jaaliMetricValue(data, /load\s*coverage|coverage/i);
  const coverageFromMetric = Number(coverageRaw.replace(/[^\d.]/g, ""));
  const loadCoveragePct =
    coverageFromMetric > 0
      ? Math.round(coverageFromMetric)
      : data.bill.solarSavingsPct > 0
        ? Math.round(data.bill.solarSavingsPct)
        : 0;

  const liveCity = data.engineering.cityLabel?.trim() || jaaliLocation(data);
  const loc = liveCity;
  let siteLatLabel = "";
  let tiltDeg = data.engineering.tiltDeg && data.engineering.tiltDeg > 0 ? data.engineering.tiltDeg : 0;
  if (loc) {
    const geo = resolveSiteLatitude(loc);
    const token = geo.cityLabel.toLowerCase().replace(" region", "").split(" ")[0] ?? "";
    if (token && loc.toLowerCase().includes(token)) {
      siteLatLabel = `~${geo.lat.toFixed(1)}° N (${geo.cityLabel})`;
      if (!tiltDeg) tiltDeg = recommendedTiltFromLatitude(geo.lat);
    }
  }

  const visualPanelCount = Math.min(Math.max(0, count), JAALI_MAX_VISUAL_PANELS);
  const roofAreaM2 = count > 0 ? Math.round(count * JAALI_M2_PER_PANEL) : 0;
  const cable = jaaliLiveCable(data, pptInput);
  const rowSpacingRaw = Number(pptInput?.residentialTechnicalSpecs?.mounting?.rowSpacingM);
  const rowSpacingM = Number.isFinite(rowSpacingRaw) && rowSpacingRaw > 0 ? rowSpacingRaw : 0;

  return {
    acKw,
    dcKwp,
    dcAcRatio,
    panelCount: count,
    panelWatt: watt,
    visualPanelCount,
    showingPartial: count > visualPanelCount,
    tiltDeg,
    azimuthDeg: count > 0 || tiltDeg > 0 ? 180 : 0,
    cityLabel: loc,
    siteLatLabel,
    roofAreaM2,
    roofAreaLabel: formatJaaliAreaM2(roofAreaM2),
    m2PerPanel: JAALI_M2_PER_PANEL,
    m2PerPanelLabel: formatJaaliAreaM2(JAALI_M2_PER_PANEL),
    performanceRatioPct: acKw > 0 ? 75 : 0,
    peakSunHours: loc ? 5 : 0,
    specificYield,
    loadCoveragePct,
    standards: jaaliEngineeringStandards(data),
    tiltNote: data.engineering.tiltNote?.trim() || "",
    cableNote: cable.note,
    dcRunM: cable.dcM,
    acRunM: cable.acM,
    vdPct: cable.vdPct,
    rowSpacingM,
  };
}
