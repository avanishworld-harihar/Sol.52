import { getMonthlyUsage } from "@/lib/billing/usage";
import { getOrgSubscription, listSubscriptionPlans } from "@/lib/billing/subscription-store";
import type { OrganizationSubscription, PlanCode, SubscriptionStatus } from "@/lib/billing/types";
import { getActiveOrgSubscription } from "@/lib/billing/subscription-lifecycle";
import { isBillingAvailable } from "@/lib/billing/entitlements";

export type OrgUsageSummary = {
  available: boolean;
  planName: string;
  planCode: PlanCode | null;
  status: SubscriptionStatus | null;
  statusLabel: string;
  daysLeft: number | null;
  trialDaysRemainingLabel: string | null;
  proposalsUsed: number;
  proposalsLimit: number | null;
  proposalsDisplay: string;
  proposalsLimitLabel: string;
  isUnlimited: boolean;
  showDaysLeft: boolean;
  showUpgrade: boolean;
  isComplimentary: boolean;
  complimentaryExpiresAt: string | null;
  complimentaryGrantedBy: string | null;
  complimentaryReason: string | null;
  /** Plan gates for Design Studio / SLD packs (outside proposal). Soft-default true when billing off. */
  designStudioEnabled: boolean;
  sldEnabled: boolean;
  upgradePlans: Array<{
    code: PlanCode;
    name: string;
    price_inr_monthly: number;
    tagline: string;
  }>;
};

export type AdminOrgBillingSnapshot = {
  planName: string;
  planCode: PlanCode | null;
  status: SubscriptionStatus | null;
  proposalsUsed: number;
  proposalsDisplay: string;
  trialEndDate: string | null;
  isComplimentary: boolean;
  expiresAt: string | null;
  grantedBy: string | null;
  grantedReason: string | null;
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function formatStatusLabel(status: SubscriptionStatus | null): string {
  if (!status) return "—";
  const labels: Record<SubscriptionStatus, string> = {
    trialing: "Trial",
    active: "Active",
    past_due: "Past due",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

export function formatProposalUsageDisplay(input: {
  planCode: PlanCode | null;
  used: number;
  limit: number | null;
  isUnlimited: boolean;
}): { display: string; limitLabel: string } {
  if (input.isUnlimited || input.planCode === "pro" || input.planCode === "business") {
    return { display: "Unlimited", limitLabel: "Unlimited" };
  }
  const limit = input.limit ?? 0;
  return {
    display: `${input.used} / ${limit}`,
    limitLabel: String(limit),
  };
}

function proposalsFromSubscription(sub: OrganizationSubscription, monthlyUsed: number): {
  used: number;
  limit: number | null;
  display: string;
  limitLabel: string;
  isUnlimited: boolean;
} {
  if (sub.plan.code === "trial") {
    const limit = sub.plan.features.max_proposals_total ?? 10;
    const used = sub.trial_proposals_used;
    const formatted = formatProposalUsageDisplay({
      planCode: "trial",
      used,
      limit,
      isUnlimited: false,
    });
    return {
      used,
      limit,
      display: formatted.display,
      limitLabel: formatted.limitLabel,
      isUnlimited: false,
    };
  }

  if (sub.plan.max_proposals_per_month != null) {
    const limit = sub.plan.max_proposals_per_month;
    const used = monthlyUsed;
    const formatted = formatProposalUsageDisplay({
      planCode: sub.plan.code,
      used,
      limit,
      isUnlimited: false,
    });
    return {
      used,
      limit,
      display: formatted.display,
      limitLabel: formatted.limitLabel,
      isUnlimited: false,
    };
  }

  const used = monthlyUsed;
  const formatted = formatProposalUsageDisplay({
    planCode: sub.plan.code,
    used,
    limit: null,
    isUnlimited: true,
  });
  return {
    used,
    limit: null,
    display: formatted.display,
    limitLabel: formatted.limitLabel,
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
      statusLabel: "—",
      daysLeft: null,
      trialDaysRemainingLabel: null,
      proposalsUsed: 0,
      proposalsLimit: null,
      proposalsDisplay: "—",
      proposalsLimitLabel: "—",
      isUnlimited: false,
      showDaysLeft: false,
      showUpgrade: false,
      isComplimentary: false,
      complimentaryExpiresAt: null,
      complimentaryGrantedBy: null,
      complimentaryReason: null,
      designStudioEnabled: true,
      sldEnabled: true,
      upgradePlans: [],
    };
  }

  const [sub, allPlans] = await Promise.all([
    getActiveOrgSubscription(organizationId),
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
      statusLabel: formatStatusLabel(sub?.status ?? null),
      daysLeft: null,
      trialDaysRemainingLabel: null,
      proposalsUsed: 0,
      proposalsLimit: limit,
      proposalsDisplay: `0 / ${limit}`,
      proposalsLimitLabel: String(limit),
      isUnlimited: false,
      showDaysLeft: false,
      showUpgrade: true,
      isComplimentary: false,
      complimentaryExpiresAt: null,
      complimentaryGrantedBy: null,
      complimentaryReason: null,
      designStudioEnabled: false,
      sldEnabled: false,
      upgradePlans,
    };
  }

  const monthlyUsed = await getMonthlyUsage(organizationId);
  const { used, limit, display, limitLabel, isUnlimited } = proposalsFromSubscription(sub, monthlyUsed);
  const isTrial = sub.plan.code === "trial" && sub.status === "trialing";
  const daysLeft = isTrial ? daysUntil(sub.trial_ends_at) : null;
  const complimentaryDaysLeft =
    sub.is_complimentary && sub.expires_at ? daysUntil(sub.expires_at) : null;
  const trialDaysRemainingLabel =
    isTrial && daysLeft != null
      ? `${daysLeft} Day${daysLeft === 1 ? "" : "s"} Remaining`
      : sub.is_complimentary && complimentaryDaysLeft != null
        ? `${complimentaryDaysLeft} Day${complimentaryDaysLeft === 1 ? "" : "s"} Remaining (complimentary)`
        : null;

  return {
    available: true,
    planName: sub.is_complimentary ? `${sub.plan.name} (Complimentary)` : sub.plan.name,
    planCode: sub.plan.code,
    status: sub.status,
    statusLabel: sub.is_complimentary ? "Complimentary" : formatStatusLabel(sub.status),
    daysLeft: isTrial ? daysLeft : complimentaryDaysLeft,
    trialDaysRemainingLabel,
    proposalsUsed: used,
    proposalsLimit: limit,
    proposalsDisplay: display,
    proposalsLimitLabel: limitLabel,
    isUnlimited,
    showDaysLeft: (isTrial && daysLeft != null) || (sub.is_complimentary && complimentaryDaysLeft != null),
    showUpgrade: sub.plan.code === "trial" || sub.plan.code === "starter",
    isComplimentary: sub.is_complimentary,
    complimentaryExpiresAt: sub.expires_at,
    complimentaryGrantedBy: sub.granted_by,
    complimentaryReason: sub.granted_reason,
    designStudioEnabled: sub.plan.features.design_studio === true,
    sldEnabled: sub.plan.features.sld === true,
    upgradePlans,
  };
}

export async function buildAdminOrgBillingSnapshot(
  organizationId: string
): Promise<AdminOrgBillingSnapshot> {
  const sub = await getActiveOrgSubscription(organizationId);
  if (!sub) {
    return {
      planName: "—",
      planCode: null,
      status: null,
      proposalsUsed: 0,
      proposalsDisplay: "—",
      trialEndDate: null,
      isComplimentary: false,
      expiresAt: null,
      grantedBy: null,
      grantedReason: null,
    };
  }

  const monthlyUsed = await getMonthlyUsage(organizationId);
  const { used, display } = proposalsFromSubscription(sub, monthlyUsed);

  return {
    planName: sub.plan.name,
    planCode: sub.plan.code,
    status: sub.status,
    proposalsUsed: used,
    proposalsDisplay: display,
    trialEndDate: sub.plan.code === "trial" ? sub.trial_ends_at : null,
    isComplimentary: sub.is_complimentary,
    expiresAt: sub.is_complimentary ? sub.expires_at : null,
    grantedBy: sub.is_complimentary ? sub.granted_by : null,
    grantedReason: sub.is_complimentary ? sub.granted_reason : null,
  };
}
