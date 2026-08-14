/**
 * Cyanotype — live ProposalData only. No demo kW / ₹ / customer fallbacks.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";

function findBom(items: ProposalBomItem[], test: RegExp): ProposalBomItem | null {
  return items.find((item) => test.test(`${item.name} ${item.brand} ${item.spec}`)) ?? null;
}

export function cyanotypeBrand(data: ProposalData): string {
  return data.meta.brandName?.trim() || data.closing.installerName?.trim() || "SOL.52";
}

export function cyanotypeNetInvestment(data: ProposalData): number {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  if (gross <= 0) return 0;
  if (subsidy > 0 && data.economics.netInr > 0) return Math.round(data.economics.netInr);
  return Math.round(gross);
}

export function cyanotypeAnnualUnits(data: ProposalData): number {
  return data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
}

export function cyanotypePanelLine(data: ProposalData): string | null {
  const items = (data.bom ?? []).filter((b) => b.name?.trim());
  const panel = findBom(items, /panel|module|pv\b/i);
  if (!panel) return null;
  const parts = [panel.brand, panel.spec].filter(Boolean).join(" · ");
  return parts.trim() || panel.name?.trim() || null;
}

export function formatCyanotypeKw(kw: number): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(1);
}
