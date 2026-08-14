/**
 * Brutalism — live ProposalData only. No Harihar / 3 kW / ₹1.5L fallbacks.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";

function findBom(items: ProposalBomItem[], test: RegExp): ProposalBomItem | null {
  return items.find((item) => test.test(`${item.name} ${item.brand} ${item.spec}`)) ?? null;
}

function bomText(item: ProposalBomItem | null): string {
  if (!item) return "";
  return [item.name, item.brand, item.spec, item.description].filter(Boolean).join(" ");
}

function parseCountAndWatt(text: string): { count: number; watt: number } {
  const combo = text.match(/(\d+)\s*(?:×|x)\s*(\d{3,4})\s*(?:W|Wp)\b/i);
  if (combo) {
    return { count: Number(combo[1]), watt: Number(combo[2]) };
  }
  const wattOnly = text.match(/(\d{3,4})\s*(?:W|Wp)\b/i);
  return { count: 0, watt: wattOnly ? Number(wattOnly[1]) : 0 };
}

export function brutalismBrand(data: ProposalData): string {
  return data.meta.brandName?.trim() || data.closing.installerName?.trim() || "SOL.52";
}

export function brutalismNetInvestment(data: ProposalData): number {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  if (gross <= 0) return 0;
  if (subsidy > 0 && data.economics.netInr > 0) return Math.round(data.economics.netInr);
  return Math.round(gross);
}

export function brutalismDcKwp(data: ProposalData): number {
  const items = (data.bom ?? []).filter((b) => b.name?.trim());
  const panel = findBom(items, /panel|module|pv\b/i);
  const parsed = parseCountAndWatt(bomText(panel));
  const systemKw = Number(data.meta.systemKw) || 0;
  const watt = parsed.watt > 0 ? parsed.watt : 0;
  const modules =
    parsed.count > 0
      ? parsed.count
      : watt > 0 && systemKw > 0
        ? Math.max(1, Math.ceil((systemKw * 1000) / watt))
        : 0;
  return modules > 0 && watt > 0 ? (modules * watt) / 1000 : 0;
}

export function brutalismAnnualUnits(data: ProposalData): number {
  return data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
}

export function formatBrutalismKw(kw: number, digits = 2): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(digits);
}
