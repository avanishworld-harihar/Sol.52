/** Data-agnostic formatters for proposal presets — no CSS. */

export function formatInr(value: number): string {
  const n = Math.max(0, Math.round(Number(value) || 0));
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatInrCompact(value: number): string {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return formatInr(n);
}

export function formatLifetimeBenefitInr(value: number): string {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n >= 100000) {
    const lakhs = n / 100000;
    const rounded = Math.round(lakhs * 10) / 10;
    return `₹${rounded.toFixed(1)}L`;
  }
  return formatInr(n);
}
