import { BillingEntitlementError } from "@/lib/billing/errors";
import {
  getOrgSubscription,
  getPlanByCode,
  incrementTrialProposalsUsed,
  isOrgTrialConsumed,
  markOrgTrialConsumed,
  recordTrialIdentity,
  upsertOrgSubscription,
} from "@/lib/billing/subscription-store";
import { isCommercialPreset, resolveResidentialThemeKey } from "@/lib/billing/theme-keys";
import type {
  AdminComplimentaryGrantInput,
  OrganizationSubscription,
  ResidentialThemeKey,
  TrialIdentityInput,
} from "@/lib/billing/types";
import { getMonthlyUsage, incrementProposalUsage, logBillingEvent } from "@/lib/billing/usage";
import { checkTrialAbuse } from "@/lib/billing/trial-abuse";
import { countOrgMembers } from "@/lib/billing/team";

export async function isBillingAvailable(): Promise<boolean> {
  const plan = await getPlanByCode("trial");
  return plan !== null;
}

function isBillingEnforced(): boolean {
  if (process.env.BILLING_ENFORCE === "false" || process.env.BILLING_ENFORCE === "0") {
    return false;
  }
  return true;
}

import { getActiveOrgSubscription, applySubscriptionExpiry, isTrialExpired } from "@/lib/billing/subscription-lifecycle";
function isThemeAllowed(
  sub: OrganizationSubscription,
  themeKey: ResidentialThemeKey
): boolean {
  const f = sub.plan.features;
  if (f.all_residential_themes) return true;
  const allowed = f.residential_theme_keys ?? [];
  return allowed.includes(themeKey);
}

/** Commercial decks: `commercial_proposals` feature only — no residential theme gate. */
export function assertCommercialProposalEntitlement(sub: OrganizationSubscription): void {
  if (!sub.plan.features.commercial_proposals) {
    throw new BillingEntitlementError(
      "commercial_not_allowed",
      "Commercial proposals are not included in your current plan."
    );
  }
}

/** Design Studio + Design pack — separate from customer proposal. */
export function assertDesignStudioEntitlement(sub: OrganizationSubscription): void {
  if (!sub.plan.features.design_studio) {
    throw new BillingEntitlementError(
      "design_studio_not_allowed",
      "Design Studio is not included in your current plan. Upgrade to enable Design."
    );
  }
}

/** Engineering SLD pack — separate from customer proposal. */
export function assertSldEntitlement(sub: OrganizationSubscription): void {
  if (!sub.plan.features.sld) {
    throw new BillingEntitlementError(
      "sld_not_allowed",
      "SLD pack is not included in your current plan. Upgrade to enable SLD."
    );
  }
}

/** Residential decks: theme allow-list (trial) or all themes (paid). */
export function assertResidentialThemeEntitlement(
  sub: OrganizationSubscription,
  input: {
    presetId: string;
    salesPremiumStyle?: string | null;
    galleryKey?: string | null;
  }
): void {
  const themeKey = resolveResidentialThemeKey({
    presetId: input.presetId,
    salesPremiumStyle: input.salesPremiumStyle,
    galleryKey: input.galleryKey,
  });
  if (!isThemeAllowed(sub, themeKey)) {
    throw new BillingEntitlementError(
      "theme_not_allowed",
      `The "${themeKey}" theme is not included in your plan. Upgrade for all themes.`,
      { theme_key: themeKey, plan: sub.plan.code }
    );
  }
}

export async function resolveOrgBilling(
  organizationId: string,
  identity?: TrialIdentityInput
): Promise<OrganizationSubscription | null> {
  if (!(await isBillingAvailable()) || !isBillingEnforced()) return null;

  let sub = await getOrgSubscription(organizationId);
  if (sub) {
    sub = (await applySubscriptionExpiry(organizationId, sub)) ?? sub;
    return sub;
  }

  if (!isBillingEnforced()) return null;

  const trialPlan = await getPlanByCode("trial");
  if (!trialPlan) return null;

  const consumed = await isOrgTrialConsumed(organizationId);
  if (consumed) {
    return upsertOrgSubscription({
      organizationId,
      planCode: "starter",
      status: "cancelled",
      actor: "system_no_trial",
    });
  }

  if (identity) {
    const abuse = await checkTrialAbuse({ organizationId, identity });
    if (!abuse.allowed) {
      await logBillingEvent({
        organizationId,
        eventType: "trial.denied",
        payload: { reason: abuse.reason },
      });
      return upsertOrgSubscription({
        organizationId,
        planCode: "starter",
        status: "cancelled",
        actor: "system_trial_abuse",
      });
    }
  }

  const trialDays = trialPlan.features.trial_days ?? 14;
  const trialEnds = new Date();
  trialEnds.setUTCDate(trialEnds.getUTCDate() + trialDays);

  sub = await upsertOrgSubscription({
    organizationId,
    planCode: "trial",
    status: "trialing",
    trialEndsAt: trialEnds,
    trialProposalsUsed: 0,
    actor: "system_auto_trial",
  });

  if (sub && identity) {
    await recordTrialIdentity(organizationId, identity);
    await markOrgTrialConsumed(organizationId);
    await logBillingEvent({
      organizationId,
      eventType: "trial.started",
      payload: { trial_ends_at: trialEnds.toISOString() },
    });
  }

  return sub;
}

/** Bootstrap trialing subscription when org has no row yet (first proposal / usage check). */
async function bootstrapTrialSubscription(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  const trialPlan = await getPlanByCode("trial");
  if (!trialPlan) return null;
  const trialEnds = new Date();
  trialEnds.setUTCDate(trialEnds.getUTCDate() + (trialPlan.features.trial_days ?? 14));
  return upsertOrgSubscription({
    organizationId,
    planCode: "trial",
    status: "trialing",
    trialEndsAt: trialEnds,
    trialProposalsUsed: 0,
    actor: "system_proposal_bootstrap",
  });
}

export async function assertCanCreateProposal(input: {
  organizationId: string;
  presetId: string;
  salesPremiumStyle?: string | null;
  galleryKey?: string | null;
  identity?: TrialIdentityInput;
}): Promise<OrganizationSubscription | null> {
  if (!input.organizationId) return null;
  if (!(await isBillingAvailable()) || !isBillingEnforced()) return null;

  let sub = (await resolveOrgBilling(input.organizationId, input.identity)) ?? null;
  if (!sub) {
    const consumed = await isOrgTrialConsumed(input.organizationId);
    if (!consumed) {
      sub = await bootstrapTrialSubscription(input.organizationId);
    }
  }
  if (!sub) {
    console.warn(
      "[billing] no subscription for org %s — allowing proposal (billing row missing or upsert failed)",
      input.organizationId
    );
    return null;
  }

  if (sub.status === "cancelled") {
    throw new BillingEntitlementError(
      "no_subscription",
      "Subscription is inactive. Upgrade to continue creating proposals."
    );
  }

  if (isTrialExpired(sub)) {
    throw new BillingEntitlementError(
      "trial_expired",
      "Your 14-day trial has ended. Upgrade to Starter or Pro to continue."
    );
  }

  if (isCommercialPreset(input.presetId)) {
    assertCommercialProposalEntitlement(sub);
  } else {
    assertResidentialThemeEntitlement(sub, {
      presetId: input.presetId,
      salesPremiumStyle: input.salesPremiumStyle,
      galleryKey: input.galleryKey,
    });
  }

  if (sub.plan.code === "trial") {
    const maxTotal = sub.plan.features.max_proposals_total ?? 10;
    if (sub.trial_proposals_used >= maxTotal) {
      throw new BillingEntitlementError(
        "proposal_limit_reached",
        `Trial limit reached (${maxTotal} proposals). Upgrade to continue.`,
        { limit: maxTotal, used: sub.trial_proposals_used }
      );
    }
  } else if (sub.plan.max_proposals_per_month != null) {
    const used = await getMonthlyUsage(input.organizationId);
    if (used >= sub.plan.max_proposals_per_month) {
      throw new BillingEntitlementError(
        "proposal_limit_reached",
        `Monthly proposal limit reached (${sub.plan.max_proposals_per_month}). Upgrade to Pro for unlimited.`,
        { limit: sub.plan.max_proposals_per_month, used }
      );
    }
  }

  return sub;
}

export async function recordProposalCreated(
  organizationId: string,
  sub: OrganizationSubscription | null
): Promise<void> {
  if (!organizationId || !sub) return;

  await incrementProposalUsage(organizationId);

  if (sub.plan.code === "trial") {
    await incrementTrialProposalsUsed(organizationId, sub.trial_proposals_used);
  }

  await logBillingEvent({
    organizationId,
    eventType: "proposal.created",
    payload: { plan_code: sub.plan.code },
  });
}

export async function assertCanAddTeamMember(input: {
  organizationId: string;
  sub?: OrganizationSubscription | null;
}): Promise<OrganizationSubscription> {
  if (!input.organizationId) {
    throw new BillingEntitlementError("no_subscription", "Organization is required.");
  }
  if (!(await isBillingAvailable()) || !isBillingEnforced()) {
    const sub = input.sub ?? (await getOrgSubscription(input.organizationId));
    if (!sub) {
      throw new BillingEntitlementError("no_subscription", "No active subscription for this organization.");
    }
    return sub;
  }

  const sub = input.sub ?? (await resolveOrgBilling(input.organizationId)) ?? null;
  if (!sub || sub.status === "cancelled") {
    throw new BillingEntitlementError(
      "no_subscription",
      "Subscription is inactive. Upgrade to add team members."
    );
  }

  if (!sub.plan.features.team_members_enabled) {
    throw new BillingEntitlementError(
      "team_not_enabled",
      "Team members are not included in your current plan. Upgrade to Pro or Business.",
      { plan: sub.plan.code, max_users: sub.plan.max_users }
    );
  }

  const memberCount = await countOrgMembers(input.organizationId);
  const maxUsers = sub.plan.max_users ?? sub.plan.features.max_users ?? 1;
  if (memberCount >= maxUsers) {
    throw new BillingEntitlementError(
      "team_limit_reached",
      `Team member limit reached (${maxUsers}). Upgrade your plan to add more members.`,
      { limit: maxUsers, used: memberCount, plan: sub.plan.code }
    );
  }

  return sub;
}

export async function shouldShowPdfWatermark(organizationId: string | null): Promise<boolean> {
  if (!organizationId) return false;
  const sub = await getActiveOrgSubscription(organizationId);
  if (!sub) return false;
  return sub.plan.features.watermark === true && sub.status === "trialing";
}

export async function adminAssignPlan(input: {
  organizationId: string;
  planCode: "trial" | "starter" | "pro" | "business";
  status?: OrganizationSubscription["status"];
  trialDays?: number;
  actor: string;
}): Promise<OrganizationSubscription | null> {
  const plan = await getPlanByCode(input.planCode);
  if (!plan) return null;

  let trialEndsAt: Date | null = null;
  if (input.planCode === "trial") {
    const days = input.trialDays ?? plan.features.trial_days ?? 14;
    trialEndsAt = new Date();
    trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + days);
    await markOrgTrialConsumed(input.organizationId);
  }

  const status =
    input.status ??
    (input.planCode === "trial" ? "trialing" : "active");

  return upsertOrgSubscription({
    organizationId: input.organizationId,
    planCode: input.planCode,
    status,
    trialEndsAt,
    trialProposalsUsed: 0,
    clearComplimentary: true,
    actor: input.actor,
  });
}

function resolveComplimentaryExpiry(input: Pick<AdminComplimentaryGrantInput, "durationDays" | "expiresAt">): Date {
  if (input.expiresAt) {
    if (input.expiresAt.getTime() <= Date.now()) {
      throw new Error("Complimentary expiry must be in the future.");
    }
    return input.expiresAt;
  }
  const days = input.durationDays ?? 14;
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + days);
  return expiresAt;
}

export async function adminGrantComplimentary(
  input: AdminComplimentaryGrantInput
): Promise<OrganizationSubscription | null> {
  const reason = input.grantedReason.trim();
  if (!reason) {
    throw new Error("A grant reason is required.");
  }

  const expiresAt = resolveComplimentaryExpiry(input);
  const periodStart = new Date();

  const sub = await upsertOrgSubscription({
    organizationId: input.organizationId,
    planCode: input.planCode,
    status: "active",
    trialEndsAt: null,
    periodStart,
    periodEnd: expiresAt,
    clearComplimentary: false,
    complimentary: {
      isComplimentary: true,
      expiresAt,
      grantedBy: input.grantedBy,
      grantedReason: reason,
    },
    actor: input.grantedBy,
  });

  if (sub) {
    await logBillingEvent({
      organizationId: input.organizationId,
      eventType: "complimentary.granted",
      payload: {
        plan_code: input.planCode,
        expires_at: expiresAt.toISOString(),
        granted_by: input.grantedBy,
        granted_reason: reason,
      },
    });
  }

  return sub;
}

export async function adminRevokeComplimentary(
  organizationId: string,
  actor: string,
  reason?: string
): Promise<void> {
  await upsertOrgSubscription({
    organizationId,
    planCode: "starter",
    status: "cancelled",
    clearComplimentary: true,
    actor,
  });
  await logBillingEvent({
    organizationId,
    eventType: "complimentary.revoked",
    payload: { actor, reason: reason?.trim() || null },
  });
}

export async function adminEndTrial(organizationId: string, actor: string): Promise<void> {
  await upsertOrgSubscription({
    organizationId,
    planCode: "starter",
    status: "cancelled",
    clearComplimentary: true,
    actor,
  });
  await logBillingEvent({
    organizationId,
    eventType: "trial.ended_by_admin",
    payload: { actor },
  });
}
