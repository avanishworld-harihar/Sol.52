/** Readable Indian-number helpers for Premium Luxe (tabular, non-ambiguous). */

export function formatLuxeInr(value: number): string {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n <= 0) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

/** e.g. 122000 → "₹1.22 lakh" when ≥ 1 lakh, else full INR */
export function formatLuxeInrReadable(value: number): string {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n <= 0) return "—";
  if (n >= 10000000) {
    const cr = n / 10000000;
    return `₹${cr.toFixed(cr >= 10 ? 1 : 2)} crore`;
  }
  if (n >= 100000) {
    const lakh = n / 100000;
    return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} lakh`;
  }
  return formatLuxeInr(n);
}

export function formatLuxeKw(value: number): string {
  const n = Number(value) || 0;
  if (n <= 0) return "—";
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

export function formatLuxeYears(value: number): string {
  const n = Number(value) || 0;
  if (n <= 0) return "—";
  return `${n.toFixed(1)} years`;
}

export function formatLuxeUnits(value: number): string {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n <= 0) return "—";
  return n.toLocaleString("en-IN");
}
