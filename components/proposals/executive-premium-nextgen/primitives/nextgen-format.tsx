export function fmtInr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
