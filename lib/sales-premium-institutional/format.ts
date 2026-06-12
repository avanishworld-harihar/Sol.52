/** Display formatting — monospace table numbers match WeasyPrint output. */

export function fmtInrPlain(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export function fmtInrGrouped(n: number): string {
  const x = Math.round(n);
  if (x >= 100000) return `${(x / 100000).toFixed(1)} Lakhs`;
  return fmtInrPlain(x);
}

export function fmtCompactK(n: number): string {
  const x = Math.round(n);
  if (x >= 1000) return `${(x / 1000).toFixed(1)}k`;
  return String(x);
}

export function fmtLakhs(n: number): string {
  return (n / 100000).toFixed(1);
}
