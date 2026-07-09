export function fmtInr(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export function fmtInrSpaced(n: number): string {
  return `₹ ${fmtInr(n)}`;
}

export function fmtCompactK(n: number): string {
  const x = Math.round(n);
  if (x >= 1000) return `${Math.round(x / 1000)}k`;
  return String(x);
}

export function fmtLakhsShort(n: number): string {
  return (n / 100000).toFixed(1);
}

/** ₹12.5 Lakh style for lifetime ROI hero. */
export function fmtLifetimeBenefitInr(n: number): string {
  const x = Math.round(n);
  if (x >= 10_000_000) return `₹${(x / 10_000_000).toFixed(2)} Cr`;
  if (x >= 100_000) return `₹${fmtLakhsShort(x)} Lakh`;
  return fmtInrSpaced(x);
}

export type WarrantyTone = "green" | "blue" | "copper" | "muted";

export function warrantyTone(warranty: string): WarrantyTone {
  const w = warranty.toLowerCase();
  if (w.includes("25") || w.includes("lifetime")) return "green";
  if (w.includes("10")) return "blue";
  if (w.includes("5")) return "copper";
  return "muted";
}
