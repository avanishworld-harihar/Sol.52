export function fmtInrPlain(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export function fmtInrSpaced(n: number): string {
  return `₹ ${fmtInrPlain(n)}`;
}

export function fmtLakhsShort(n: number): string {
  return (n / 100000).toFixed(1);
}

export function fmtLakhsLabel(n: number): string {
  return `₹${fmtLakhsShort(n)}L`;
}

export function normalizeWarrantyShort(w: string): string {
  return w
    .replace(/\byears?\b/gi, "yr")
    .replace(/\byr\b/gi, "yr")
    .trim();
}
