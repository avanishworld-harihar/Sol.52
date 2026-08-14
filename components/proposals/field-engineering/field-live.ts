/**
 * Field Engineering — live ProposalData / BOM only.
 * No 5 kW / 615W / Waaree / Harihar / Satna coordinate fallbacks.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";

export type FieldPanelSpec = {
  watt: number;
  modules: number;
  dcKwp: number;
  panelItem: ProposalBomItem | null;
  inverterItem: ProposalBomItem | null;
  structureItem: ProposalBomItem | null;
};

function bomText(item: ProposalBomItem | null | undefined): string {
  if (!item) return "";
  return [item.name, item.brand, item.spec, item.description, ...(item.technicalPoints ?? [])]
    .filter(Boolean)
    .join(" ");
}

function parseCountAndWatt(text: string): { count: number; watt: number } {
  const combo = text.match(/(\d+)\s*(?:×|x)\s*(\d{3,4})\s*(?:W|Wp)\b/i);
  if (combo) {
    return { count: Number(combo[1]), watt: Number(combo[2]) };
  }
  const wattOnly = text.match(/(\d{3,4})\s*(?:W|Wp)\b/i);
  return { count: 0, watt: wattOnly ? Number(wattOnly[1]) : 0 };
}

function findBom(items: ProposalBomItem[], test: RegExp): ProposalBomItem | null {
  return (
    items.find((item) => test.test(`${item.name} ${item.brand} ${item.spec}`)) ?? null
  );
}

export function resolveFieldPanelSpec(data: ProposalData): FieldPanelSpec {
  const items = (data.bom ?? []).filter((b) => b.name?.trim());
  const panelItem = findBom(items, /panel|module|pv\b/i);
  const inverterItem = findBom(items, /inverter/i);
  const structureItem = findBom(items, /mount|structure|racking|mms/i);
  const parsed = parseCountAndWatt(bomText(panelItem));
  const systemKw = Number(data.meta.systemKw) || 0;
  const watt = parsed.watt > 0 ? parsed.watt : 0;
  const modules =
    parsed.count > 0
      ? parsed.count
      : watt > 0 && systemKw > 0
        ? Math.max(1, Math.ceil((systemKw * 1000) / watt))
        : 0;
  const dcKwp = modules > 0 && watt > 0 ? (modules * watt) / 1000 : 0;
  return { watt, modules, dcKwp, panelItem, inverterItem, structureItem };
}

export function fieldLiveBom(data: ProposalData): ProposalBomItem[] {
  return (data.bom ?? []).filter((b) => b.name?.trim());
}

export function formatFieldKw(kw: number, digits = 2): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(digits);
}

export function fieldAnnualUnits(data: ProposalData): number {
  return data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
}

export function hasFieldBill(data: ProposalData): boolean {
  const months = data.bill.months ?? [];
  if (months.some((m) => m.units > 0 || m.netInr > 0)) return true;
  if (data.bill.yearlyBillInr > 0) return true;
  if ((data.bill.totals?.units || 0) > 0 || (data.bill.totals?.netInr || 0) > 0) {
    return true;
  }
  return false;
}

export function fieldDrawnBy(data: ProposalData): string {
  return (
    data.closing.installerName?.trim() ||
    data.meta.brandName?.trim() ||
    "—"
  );
}

export function fieldSheetDate(generatedAt?: string): string {
  const d = generatedAt ? new Date(generatedAt) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fieldFamilyName(data: ProposalData): string {
  return data.meta.customerName?.trim() || data.closing.customerName?.trim() || "Residence";
}

export function fieldMetric(data: ProposalData, test: RegExp): string {
  const hit = data.engineering.metrics.find((m) => test.test(m.label));
  return hit?.value?.trim() || "";
}

export function fieldDocNo(proposalId?: string, generatedAt?: string): string {
  const year = generatedAt
    ? new Date(generatedAt).getFullYear()
    : new Date().getFullYear();
  const tail = (proposalId ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  return tail ? `FE-${year}-${tail}` : `FE-${year}`;
}

export function fieldSheetMeta(data: ProposalData) {
  return {
    familyName: fieldFamilyName(data),
    date: fieldSheetDate(data.meta.generatedAt),
    preparedBy: fieldDrawnBy(data),
  };
}

/** Ten-sheet set: FE-00 register through FE-09 acceptance. */
export const FIELD_SHEET_TOTAL = 10;

export const FIELD_REGISTER = [
  { dwgNo: "FE-00", title: "DRAWING REGISTER / INDEX", page: 1 },
  { dwgNo: "FE-01", title: "COVER / SYSTEM SPEC SHEET", page: 2 },
  { dwgNo: "FE-02", title: "FAMILY ENERGY LOAD PROFILE", page: 3 },
  { dwgNo: "FE-03", title: "SITE SURVEY & ROOF SCHEMATIC", page: 4 },
  { dwgNo: "FE-04", title: "SYSTEM ARCHITECTURE — SINGLE LINE", page: 5 },
  { dwgNo: "FE-05", title: "PERFORMANCE SIMULATION", page: 6 },
  { dwgNo: "FE-06", title: "FINANCIAL ENGINEERING LEDGER", page: 7 },
  { dwgNo: "FE-07", title: "COMPLIANCE & CERTIFICATION", page: 8 },
  { dwgNo: "FE-08", title: "INSTALLATION TIMELINE", page: 9 },
  { dwgNo: "FE-09", title: "ACCEPTANCE / SIGN-OFF", page: 10 },
] as const;

export function fieldPageOf(page: number): string {
  const p = Math.max(1, Math.min(page, FIELD_SHEET_TOTAL));
  return `${String(p).padStart(2, "0")} / ${String(FIELD_SHEET_TOTAL).padStart(2, "0")}`;
}

export function fieldRevision(): string {
  return "Rev A";
}

export type FieldDrawingContext = {
  data: ProposalData;
  proposalId?: string;
  dwgNo: string;
  sheetLabel: string;
  page: number;
  scale?: string;
  verified?: boolean;
};

export function fieldDrawingSheetProps(ctx: FieldDrawingContext) {
  const sheet = fieldSheetMeta(ctx.data);
  return {
    dwgNo: ctx.dwgNo,
    sheetLabel: ctx.sheetLabel,
    pageOf: fieldPageOf(ctx.page),
    familyName: sheet.familyName,
    scale: ctx.scale ?? "—",
    date: sheet.date,
    preparedBy: sheet.preparedBy,
    revision: fieldRevision(),
    docId: fieldDocNo(ctx.proposalId, ctx.data.meta.generatedAt),
    verified: ctx.verified,
  };
}

export const FIELD_DEFAULT_NOTES = [
  "Dimensions NTS unless a site survey dimension is recorded on FE-03.",
  "Stage payments follow FE-06 on gross; subsidy is credited later when on file.",
  "Spec values are live on this proposal — blank cells are not invented.",
] as const;

export type FieldStringTrack = {
  track: number;
  modules: number;
  label: string;
};

export function resolveFieldStringing(data: ProposalData): {
  mpptCount: number;
  tracks: FieldStringTrack[];
} | null {
  const { modules, watt, inverterItem } = resolveFieldPanelSpec(data);
  if (modules <= 0) return null;

  const invText = bomText(inverterItem);
  const mpptMatch = invText.match(/MPPT\s*[×x]?\s*(\d+)/i);
  let mpptCount = mpptMatch ? Math.max(1, Number(mpptMatch[1])) : 0;
  if (mpptCount <= 0 && inverterItem) {
    mpptCount = modules > 12 ? 2 : 1;
  }
  if (mpptCount <= 0) return null;

  const base = Math.floor(modules / mpptCount);
  const rem = modules % mpptCount;
  const tracks: FieldStringTrack[] = [];
  for (let i = 0; i < mpptCount; i++) {
    const count = base + (i < rem ? 1 : 0);
    tracks.push({
      track: i + 1,
      modules: count,
      label: watt > 0 ? `${count}×${watt}W` : `${count} mod`,
    });
  }
  return { mpptCount, tracks };
}

export function fieldBillUnitsTotal(data: ProposalData): number {
  const fromTotals = data.bill.totals?.units ?? 0;
  if (fromTotals > 0) return Math.round(fromTotals);
  const months = data.bill.months ?? [];
  const sum = months.reduce((s, m) => s + (m.units > 0 ? m.units : 0), 0);
  return sum > 0 ? Math.round(sum) : 0;
}

export function fieldLoadCoverage(data: ProposalData): {
  billUnits: number;
  genUnits: number;
  coveragePct: number | null;
  surplusUnits: number | null;
} {
  const billUnits = fieldBillUnitsTotal(data);
  const genUnits = fieldAnnualUnits(data);
  if (billUnits > 0 && genUnits > 0) {
    const coveragePct = Math.min(100, Math.round((genUnits / billUnits) * 100));
    const surplusUnits = genUnits > billUnits ? genUnits - billUnits : null;
    return { billUnits, genUnits, coveragePct, surplusUnits };
  }
  return { billUnits, genUnits, coveragePct: null, surplusUnits: null };
}
