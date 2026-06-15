import {
  getOrgSubscription,
  upsertOrgSubscription,
} from "@/lib/billing/subscription-store";
import type { OrganizationSubscription } from "@/lib/billing/types";
import { logBillingEvent } from "@/lib/billing/usage";

export function isTrialExpired(sub: OrganizationSubscription): boolean {
  if (sub.plan.code !== "trial") return false;
  if (!sub.trial_ends_at) return false;
  return new Date(sub.trial_ends_at).getTime() < Date.now();
}

export function isComplimentaryExpired(sub: OrganizationSubscription): boolean {
  if (!sub.is_complimentary || !sub.expires_at) return false;
  return new Date(sub.expires_at).getTime() < Date.now();
}

async function expireComplimentaryAccess(
  organizationId: string,
  sub: OrganizationSubscription
): Promise<void> {
  await upsertOrgSubscription({
    organizationId,
    planCode: "starter",
    status: "cancelled",
    clearComplimentary: true,
    actor: "system_complimentary_expired",
  });
  await logBillingEvent({
    organizationId,
    eventType: "complimentary.expired",
    payload: {
      plan_code: sub.plan.code,
      expired_at: sub.expires_at,
      granted_by: sub.granted_by,
      granted_reason: sub.granted_reason,
    },
  });
}

export async function applySubscriptionExpiry(
  organizationId: string,
  sub: OrganizationSubscription
): Promise<OrganizationSubscription | null> {
  if (isTrialExpired(sub)) {
    await upsertOrgSubscription({
      organizationId,
      planCode: "starter",
      status: "cancelled",
      clearComplimentary: true,
      actor: "system_trial_expired",
    });
    return getOrgSubscription(organizationId);
  }
  if (isComplimentaryExpired(sub)) {
    await expireComplimentaryAccess(organizationId, sub);
    return getOrgSubscription(organizationId);
  }
  return sub;
}

/** Loads subscription and applies trial / complimentary expiry side-effects. */
export async function getActiveOrgSubscription(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  const sub = await getOrgSubscription(organizationId);
  if (!sub) return null;
  return applySubscriptionExpiry(organizationId, sub);
}
