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

export type WarrantyTone = "green" | "blue" | "copper" | "muted";

export function warrantyTone(warranty: string): WarrantyTone {
  const w = warranty.toLowerCase();
  if (w.includes("25") || w.includes("lifetime")) return "green";
  if (w.includes("10")) return "blue";
  if (w.includes("5")) return "copper";
  return "muted";
}
