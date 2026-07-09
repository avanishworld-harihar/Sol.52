/** Sol.52 billing — Phase 1 types (no payment gateway). */

export type PlanCode = "trial" | "starter" | "pro" | "business";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled";

export type ResidentialThemeKey =
  | "classic"
  | "ledger"
  | "pearl"
  | "slate"
  | "golden"
  | "horizon"
  | "ember"
  | "solstice"
  | "freedom";

export type PlanFeatures = {
  /** Explicit allow-list when `all_residential_themes` is false (trial). Not used for commercial. */
  residential_theme_keys?: ResidentialThemeKey[];
  all_residential_themes?: boolean;
  /** Entitlement gate for `commercial_executive` — independent of residential themes. */
  commercial_proposals: boolean;
  pdf_export: boolean;
  watermark: boolean;
  /** Trial lifetime cap; null = no lifetime cap. */
  max_proposals_total: number | null;
  trial_days: number | null;
  max_users: number;
  team_members_enabled: boolean;
  api_webhooks: boolean;
  white_label: boolean;
  priority_support: boolean;
};

export type SubscriptionPlan = {
  id: string;
  code: PlanCode;
  name: string;
  price_inr_monthly: number;
  price_inr_yearly: number | null;
  max_users: number;
  max_proposals_per_month: number | null;
  features: PlanFeatures;
  is_active: boolean;
  sort_order: number;
};

export type OrganizationSubscription = {
  id: string;
  organization_id: string;
  plan_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  trial_proposals_used: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  is_complimentary: boolean;
  expires_at: string | null;
  granted_by: string | null;
  granted_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationUsage = {
  organization_id: string;
  period_yyyy_mm: string;
  proposals_created: number;
  users_active: number;
  api_calls: number;
};

export type TrialIdentityInput = {
  verified_phone?: string | null;
  verified_email?: string | null;
  device_fingerprint?: string | null;
  signup_ip?: string | null;
};

export type BillingEntitlementCode =
  | "proposal_limit_reached"
  | "trial_expired"
  | "theme_not_allowed"
  | "commercial_not_allowed"
  | "no_subscription"
  | "trial_abuse_denied"
  | "team_limit_reached"
  | "team_not_enabled";

export type ComplimentaryDurationPreset = 14 | 30 | 60;

export type AdminComplimentaryGrantInput = {
  organizationId: string;
  planCode: Exclude<PlanCode, "trial">;
  durationDays?: ComplimentaryDurationPreset;
  expiresAt?: Date;
  grantedBy: string;
  grantedReason: string;
};

export const BILLING_WATERMARK_TEXT = "Generated with Sol.52";
