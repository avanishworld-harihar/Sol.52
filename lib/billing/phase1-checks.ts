/**
 * Phase 1 billing checks — static entitlement and plan seed validation.
 * Run: npm run test:billing-phase1
 */
import { assertCommercialProposalEntitlement, assertResidentialThemeEntitlement } from "./entitlements";
import { BillingEntitlementError } from "./errors";
import { parsePlanFeatures } from "./plan-utils";
import { isComplimentaryExpired } from "./subscription-lifecycle";
import { formatProposalUsageDisplay } from "./usage-summary";
import { BILLING_WATERMARK_TEXT } from "./types";
import type { OrganizationSubscription, PlanCode, SubscriptionPlan } from "./types";

const TRIAL_FEATURES = {
  residential_theme_keys: ["classic", "ledger", "pearl", "golden", "solstice", "freedom", "horizon"],
  all_residential_themes: false,
  commercial_proposals: true,
  pdf_export: true,
  watermark: true,
  max_proposals_total: 10,
  trial_days: 14,
  max_users: 1,
  team_members_enabled: false,
  api_webhooks: false,
  white_label: false,
  priority_support: false,
};

const STARTER_FEATURES = {
  all_residential_themes: true,
  commercial_proposals: true,
  pdf_export: true,
  watermark: false,
  max_proposals_total: null,
  trial_days: null,
  max_users: 1,
  team_members_enabled: false,
  api_webhooks: false,
  white_label: false,
  priority_support: false,
};

const PRO_FEATURES = {
  ...STARTER_FEATURES,
  max_users: 5,
  team_members_enabled: true,
};

const BUSINESS_FEATURES = {
  ...PRO_FEATURES,
  max_users: 15,
  api_webhooks: true,
  priority_support: true,
};

function plan(code: PlanCode, name: string, maxProposals: number | null, features: object): SubscriptionPlan {
  return {
    id: `plan-${code}`,
    code,
    name,
    price_inr_monthly: code === "trial" ? 0 : 1499,
    price_inr_yearly: null,
    max_users: (features as { max_users: number }).max_users,
    max_proposals_per_month: maxProposals,
    features: parsePlanFeatures(features),
    is_active: true,
    sort_order: 0,
  };
}

function sub(planRow: SubscriptionPlan, extra?: Partial<OrganizationSubscription>): OrganizationSubscription {
  return {
    id: "sub-1",
    organization_id: "org-1",
    plan_id: planRow.id,
    plan: planRow,
    status: "trialing",
    trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    trial_proposals_used: 0,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    is_complimentary: extra?.is_complimentary === true,
    expires_at: extra?.expires_at ?? null,
    granted_by: extra?.granted_by ?? null,
    granted_reason: extra?.granted_reason ?? null,
    created_at: "",
    updated_at: "",
    ...extra,
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function assertThrows(fn: () => void, code?: string): void {
  try {
    fn();
    throw new Error("expected throw");
  } catch (e) {
    if (e instanceof Error && e.message === "expected throw") throw e;
    if (code && e instanceof BillingEntitlementError && e.code !== code) {
      throw new Error(`expected code ${code}, got ${e.code}`);
    }
  }
}

export function runBillingPhase1Checks(): void {
  const trialPlan = plan("trial", "Trial", null, TRIAL_FEATURES);
  const starterPlan = plan("starter", "Starter", 50, STARTER_FEATURES);
  const proPlan = plan("pro", "Pro", null, PRO_FEATURES);
  const businessPlan = plan("business", "Business", null, BUSINESS_FEATURES);

  const trialFeatures = parsePlanFeatures(TRIAL_FEATURES);
  assert(trialFeatures.trial_days === 14, "trial lasts 14 days");
  assert(trialFeatures.max_proposals_total === 10, "trial allows 10 total proposals");
  assert(trialFeatures.commercial_proposals === true, "trial allows commercial proposals");
  assert(trialFeatures.watermark === true, "trial has watermark flag");
  assert(BILLING_WATERMARK_TEXT === "Generated with Sol.52", "watermark text exact");

  assert(starterPlan.max_proposals_per_month === 50, "starter allows 50 proposals");
  assert(proPlan.max_proposals_per_month == null, "pro unlimited proposals");
  assert(businessPlan.max_proposals_per_month == null, "business unlimited proposals");

  assert(formatProposalUsageDisplay({ planCode: "trial", used: 3, limit: 10, isUnlimited: false }).display === "3 / 10", "trial usage display");
  assert(formatProposalUsageDisplay({ planCode: "starter", used: 12, limit: 50, isUnlimited: false }).display === "12 / 50", "starter usage display");
  assert(formatProposalUsageDisplay({ planCode: "pro", used: 99, limit: null, isUnlimited: true }).display === "Unlimited", "pro usage display");
  assert(formatProposalUsageDisplay({ planCode: "business", used: 1, limit: null, isUnlimited: true }).display === "Unlimited", "business usage display");

  const trialSub = sub(trialPlan);
  assertCommercialProposalEntitlement(trialSub);
  assertResidentialThemeEntitlement(trialSub, { presetId: "residential_sales_premium", galleryKey: "classic" });
  assertThrows(
    () => assertResidentialThemeEntitlement(trialSub, { presetId: "residential_sales_premium", galleryKey: "horizon" }),
    "theme_not_allowed"
  );

  const atLimit = sub(trialPlan, { trial_proposals_used: 10 });
  assert(atLimit.trial_proposals_used >= (atLimit.plan.features.max_proposals_total ?? 10), "11th proposal would exceed trial cap");

  assert(proPlan.features.team_members_enabled === true, "pro enables team members");
  assert(proPlan.features.max_users === 5, "pro max 5 users");
  assert(starterPlan.features.team_members_enabled === false, "starter disables team members");
  assert(businessPlan.features.max_users === 15, "business max 15 users");

  const complimentaryActive = sub(proPlan, {
    status: "active",
    is_complimentary: true,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    granted_by: "super_admin",
    granted_reason: "Partner pilot",
  });
  assert(complimentaryActive.is_complimentary === true, "complimentary flag stored");
  assert(!isComplimentaryExpired(complimentaryActive), "active complimentary not expired");

  const complimentaryExpired = sub(proPlan, {
    status: "active",
    is_complimentary: true,
    expires_at: new Date(Date.now() - 86400000).toISOString(),
  });
  assert(isComplimentaryExpired(complimentaryExpired), "past complimentary expiry detected");

  console.log("PASS: billing Phase 1 checks (" + 22 + " assertions)");
}

runBillingPhase1Checks();
