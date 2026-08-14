/**
 * Wall Street Ledger — live ProposalData only.
 * No Harihar / Waaree / 5 kW / Satna / fake tariff fallbacks.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";

function findBom(items: ProposalBomItem[], test: RegExp): ProposalBomItem | null {
  return items.find((item) => test.test(`${item.name} ${item.brand} ${item.spec}`)) ?? null;
}

export function wallStreetBrand(data: ProposalData): string {
  return (
    data.meta.brandName?.trim() ||
    data.closing.installerName?.trim() ||
    "Solar"
  );
}

export function wallStreetMastheadTitle(data: ProposalData): string {
  const brand = wallStreetBrand(data);
  return `${brand} Energy Ledger`;
}

export function wallStreetEditionLine(data: ProposalData): string {
  const loc =
    data.engineering.cityLabel?.trim() ||
    data.meta.locationLine?.trim() ||
    "";
  if (!loc) return "REGIONAL EDITION";
  const upper = loc.toUpperCase();
  return upper.includes("EDITION") ? upper : `${upper} EDITION`;
}

export function wallStreetIssueDate(generatedAt?: string): string {
  const d = generatedAt ? new Date(generatedAt) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

export function wallStreetTickerSymbol(data: ProposalData): string {
  const brand = wallStreetBrand(data)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
  return brand || "SOLAR";
}

export function wallStreetPanelLine(data: ProposalData): string | null {
  const items = (data.bom ?? []).filter((b) => b.name?.trim());
  const panel = findBom(items, /panel|module|pv\b/i);
  if (!panel) return null;
  const parts = [panel.brand, panel.spec].filter(Boolean).join(" · ");
  return parts.trim() || panel.name?.trim() || null;
}

export function wallStreetAnnualUnits(data: ProposalData): number {
  return data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
}

export function wallStreetMonthlySavings(data: ProposalData): number {
  if (data.economics.monthlySavingsInr > 0) return Math.round(data.economics.monthlySavingsInr);
  if (data.closing.annualSavingsInr > 0) return Math.round(data.closing.annualSavingsInr / 12);
  return 0;
}

export function wallStreetNetInvestment(data: ProposalData): number {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  if (gross <= 0) return 0;
  if (subsidy > 0 && data.economics.netInr > 0) return Math.round(data.economics.netInr);
  return Math.round(gross);
}

export function wallStreetHeadlineLocation(data: ProposalData): string {
  const loc = data.meta.locationLine?.trim() || data.engineering.cityLabel?.trim() || "";
  if (!loc) return "—";
  const city = loc.split(",")[0]?.trim() || loc;
  return city.toUpperCase();
}

export function formatWallStreetKw(kw: number): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(1);
}
