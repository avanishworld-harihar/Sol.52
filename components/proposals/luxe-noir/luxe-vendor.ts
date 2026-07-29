/** Resolve vendor / installer display name from More → branding settings. */

import type { ProposalData } from "@/lib/proposal-data";

export function resolveLuxeVendorName(data: ProposalData): string {
  const candidates = [
    data.closing?.installerName,
    data.meta?.brandName,
    data.execution?.bank?.company,
  ];
  for (const raw of candidates) {
    const v = (raw ?? "").trim();
    if (v && v !== "—" && v !== "-") return v;
  }
  return "";
}

/** Split for monument cover typography (first word / rest). */
export function splitLuxeVendorName(name: string): {
  primary: string;
  secondary: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { primary: "SOLAR", secondary: "PARTNER" };
  if (parts.length === 1) return { primary: parts[0]!, secondary: "" };
  return {
    primary: parts[0]!,
    secondary: parts.slice(1).join(" "),
  };
}
