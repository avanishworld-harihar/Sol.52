/** CRM + proposal connection category (optional on leads). */
export const LEAD_CONNECTION_TYPE_OPTIONS = [
  { value: "", label: "— Not specified —" },
  { value: "domestic", label: "Domestic / Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "ht", label: "HT (High Tension)" },
] as const;

export type LeadConnectionType = (typeof LEAD_CONNECTION_TYPE_OPTIONS)[number]["value"];

/** Tariff area for DISCOM fixed-charge models (optional). */
export const LEAD_AREA_PROFILE_OPTIONS = [
  { value: "", label: "— Optional —" },
  { value: "urban", label: "Urban" },
  { value: "rural", label: "Rural" },
] as const;

export type LeadAreaProfile = (typeof LEAD_AREA_PROFILE_OPTIONS)[number]["value"];

const SUBSIDY_INELIGIBLE = new Set(["commercial", "industrial", "ht"]);

/** PM Surya Ghar applies to domestic/residential connections only. */
export function isPmSuryaGharSubsidyEligible(connectionType: string | null | undefined): boolean {
  const v = (connectionType ?? "").trim().toLowerCase();
  if (!v) return true;
  return !SUBSIDY_INELIGIBLE.has(v);
}

export function connectionTypeLabel(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  return LEAD_CONNECTION_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
