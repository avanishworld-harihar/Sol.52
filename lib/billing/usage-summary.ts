import { getMonthlyUsage } from "@/lib/billing/usage";
import { getOrgSubscription, listSubscriptionPlans } from "@/lib/billing/subscription-store";
import type { OrganizationSubscription, PlanCode, SubscriptionStatus } from "@/lib/billing/types";
import { isBillingAvailable } from "@/lib/billing/entitlements";

export type OrgUsageSummary = {
  available: boolean;
  planName: string;
  planCode: PlanCode | null;
  status: SubscriptionStatus | null;
  daysLeft: number | null;
  proposalsUsed: number;
  proposalsLimit: number | null;
  proposalsDisplay: string;
  isUnlimited: boolean;
  showDaysLeft: boolean;
  showUpgrade: boolean;
  upgradePlans: Array<{
    code: PlanCode;
    name: string;
    price_inr_monthly: number;
    tagline: string;
  }>;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function proposalsFromSubscription(sub: OrganizationSubscription, monthlyUsed: number): {
  used: number;
  limit: number | null;
  display: string;
  isUnlimited: boolean;
} {
  if (sub.plan.code === "trial") {
    const limit = sub.plan.features.max_proposals_total ?? 10;
    const used = sub.trial_proposals_used;
    return {
      used,
      limit,
      display: `${used} / ${limit}`,
      isUnlimited: false,
    };
  }

  if (sub.plan.max_proposals_per_month != null) {
    const limit = sub.plan.max_proposals_per_month;
    const used = monthlyUsed;
    return {
      used,
      limit,
      display: `${used} / ${limit}`,
      isUnlimited: false,
    };
  }

  const used = monthlyUsed;
  return {
    used,
    limit: null,
    display: `${used}`,
    isUnlimited: true,
  };
}

const UPGRADE_TAGLINES: Record<string, string> = {
  starter: "50 proposals/month · all themes",
  pro: "Unlimited proposals · 5 team members",
  business: "API access · 15 team members · priority support",
};

export async function buildOrgUsageSummary(organizationId: string): Promise<OrgUsageSummary> {
  const billingTables = await isBillingAvailable();
  if (!billingTables) {
    return {
      available: false,
      planName: "—",
      planCode: null,
      status: null,
      daysLeft: null,
      proposalsUsed: 0,
      proposalsLimit: null,
      proposalsDisplay: "—",
      isUnlimited: false,
      showDaysLeft: false,
      showUpgrade: false,
      upgradePlans: [],
    };
  }

  const [sub, allPlans] = await Promise.all([
    getOrgSubscription(organizationId),
    listSubscriptionPlans(),
  ]);

  const upgradePlans = allPlans
    .filter((p) => p.code !== "trial" && p.price_inr_monthly > 0)
    .map((p) => ({
      code: p.code,
      name: p.name,
      price_inr_monthly: p.price_inr_monthly,
      tagline: UPGRADE_TAGLINES[p.code] ?? "",
    }));

  if (!sub || sub.status === "cancelled") {
    const trialPlan = allPlans.find((p) => p.code === "trial");
    const limit = trialPlan?.features.max_proposals_total ?? 10;
    return {
      available: true,
      planName: "No active plan",
      planCode: null,
      status: sub?.status ?? null,
      daysLeft: null,
      proposalsUsed: 0,
      proposalsLimit: limit,
      proposalsDisplay: `0 / ${limit}`,
      isUnlimited: false,
      showDaysLeft: false,
      showUpgrade: true,
      upgradePlans,
    };
  }

  const monthlyUsed = await getMonthlyUsage(organizationId);
  const { used, limit, display, isUnlimited } = proposalsFromSubscription(sub, monthlyUsed);
  const isTrial = sub.plan.code === "trial" && sub.status === "trialing";
  const daysLeft = isTrial ? daysUntil(sub.trial_ends_at) : null;

  return {
    available: true,
    planName: sub.plan.name,
    planCode: sub.plan.code,
    status: sub.status,
    daysLeft,
    proposalsUsed: used,
    proposalsLimit: limit,
    proposalsDisplay: isUnlimited ? `${used} (unlimited)` : display,
    isUnlimited,
    showDaysLeft: isTrial && daysLeft != null,
    showUpgrade: sub.plan.code === "trial" || sub.plan.code === "starter",
    upgradePlans,
  };
}
