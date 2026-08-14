/**
 * Emerald — live proposal numbers only. No 580W / 1440 / Harihar / JSW fallbacks.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";

export type EmeraldPanelSpec = {
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

function findBom(
  items: ProposalBomItem[],
  test: RegExp
): ProposalBomItem | null {
  return (
    items.find((item) => test.test(`${item.name} ${item.brand} ${item.spec}`)) ??
    null
  );
}

export function resolveEmeraldPanelSpec(data: ProposalData): EmeraldPanelSpec {
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

export function emeraldBomLine(item: ProposalBomItem | null): string {
  if (!item) return "";
  return (
    [item.spec, item.brand, ...(item.technicalPoints ?? [])]
      .map((v) => (v ?? "").trim())
      .filter(Boolean)
      .join(". ") || item.description?.trim() || ""
  );
}

export type EmeraldBomDetail = {
  title: string;
  brand: string;
  spec: string;
  warranty: string;
  points: string[];
};

export function emeraldBomDetail(item: ProposalBomItem): EmeraldBomDetail {
  const points = (item.technicalPoints ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);
  return {
    title: item.name.trim(),
    brand: item.brand.trim(),
    spec: item.spec.trim(),
    warranty: item.warranty.trim(),
    points,
  };
}

export function emeraldLiveBom(data: ProposalData): ProposalBomItem[] {
  return (data.bom ?? []).filter((b) => b.name?.trim());
}

export function emeraldMetric(
  data: ProposalData,
  test: RegExp
): string {
  const hit = data.engineering.metrics.find((m) => test.test(m.label));
  return hit?.value?.trim() || "";
}

export function emeraldWarranty(
  data: ProposalData,
  test: RegExp
): string {
  const hit = data.warranty.highlights.find((h) => test.test(h.label));
  return hit?.value?.trim() || "";
}

export function hasEmeraldBill(data: ProposalData): boolean {
  const months = data.bill.months ?? [];
  if (months.some((m) => m.units > 0 || m.netInr > 0)) return true;
  if (data.bill.yearlyBillInr > 0) return true;
  if ((data.bill.totals?.units || 0) > 0 || (data.bill.totals?.netInr || 0) > 0) {
    return true;
  }
  return false;
}

export function emeraldAnnualUnits(data: ProposalData): number {
  return data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
}
