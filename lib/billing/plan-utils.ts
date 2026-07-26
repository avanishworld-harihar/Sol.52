import type { PlanFeatures, SubscriptionPlan } from "@/lib/billing/types";

function n(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function parsePlanFeatures(raw: unknown): PlanFeatures {
  const f = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const themeKeys = Array.isArray(f.residential_theme_keys)
    ? (f.residential_theme_keys as string[]).filter(Boolean)
  : undefined;

  return {
    residential_theme_keys: themeKeys as PlanFeatures["residential_theme_keys"],
    all_residential_themes: f.all_residential_themes === true,
    commercial_proposals: f.commercial_proposals !== false,
    /** Default on so existing orgs keep Design until plans are seeded otherwise. */
    design_studio: f.design_studio !== false,
    sld: f.sld !== false,
    pdf_export: f.pdf_export !== false,
    watermark: f.watermark === true,
    max_proposals_total:
      f.max_proposals_total === null || f.max_proposals_total === undefined
        ? null
        : n(f.max_proposals_total),
    trial_days:
      f.trial_days === null || f.trial_days === undefined ? null : n(f.trial_days),
    max_users: n(f.max_users, 1),
    team_members_enabled: f.team_members_enabled === true,
    api_webhooks: f.api_webhooks === true,
    white_label: f.white_label === true,
    priority_support: f.priority_support === true,
  };
}

export function mapPlanRow(row: Record<string, unknown>): SubscriptionPlan {
  return {
    id: String(row.id),
    code: String(row.code) as SubscriptionPlan["code"],
    name: String(row.name),
    price_inr_monthly: n(row.price_inr_monthly),
    price_inr_yearly:
      row.price_inr_yearly === null || row.price_inr_yearly === undefined
        ? null
        : n(row.price_inr_yearly),
    max_users: n(row.max_users, 1),
    max_proposals_per_month:
      row.max_proposals_per_month === null || row.max_proposals_per_month === undefined
        ? null
        : n(row.max_proposals_per_month),
    features: parsePlanFeatures(row.features),
    is_active: row.is_active !== false,
    sort_order: n(row.sort_order),
  };
}

export function currentPeriodYyyyMm(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
