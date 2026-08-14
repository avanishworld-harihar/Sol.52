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
