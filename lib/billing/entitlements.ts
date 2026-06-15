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
import type { OrganizationSubscription, ResidentialThemeKey, TrialIdentityInput } from "@/lib/billing/types";
import { getMonthlyUsage, incrementProposalUsage, logBillingEvent } from "@/lib/billing/usage";
import { checkTrialAbuse } from "@/lib/billing/trial-abuse";

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

function isTrialExpired(sub: OrganizationSubscription): boolean {
  if (sub.plan.code !== "trial") return false;
  if (!sub.trial_ends_at) return false;
  return new Date(sub.trial_ends_at).getTime() < Date.now();
}

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
    if (isTrialExpired(sub)) {
      await upsertOrgSubscription({
        organizationId,
        planCode: "starter",
        status: "cancelled",
        actor: "system_trial_expired",
      });
      sub = await getOrgSubscription(organizationId);
    }
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

export async function assertCanCreateProposal(input: {
  organizationId: string;
  presetId: string;
  salesPremiumStyle?: string | null;
  galleryKey?: string | null;
  identity?: TrialIdentityInput;
}): Promise<OrganizationSubscription | null> {
  if (!input.organizationId) return null;
  if (!(await isBillingAvailable()) || !isBillingEnforced()) return null;

  const sub = (await resolveOrgBilling(input.organizationId, input.identity)) ?? null;
  if (!sub) {
    throw new BillingEntitlementError("no_subscription", "No active subscription for this organization.");
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

export async function shouldShowPdfWatermark(organizationId: string | null): Promise<boolean> {
  if (!organizationId) return false;
  const sub = await getOrgSubscription(organizationId);
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
    actor: input.actor,
  });
}

export async function adminEndTrial(organizationId: string, actor: string): Promise<void> {
  await upsertOrgSubscription({
    organizationId,
    planCode: "starter",
    status: "cancelled",
    actor,
  });
  await logBillingEvent({
    organizationId,
    eventType: "trial.ended_by_admin",
    payload: { actor },
  });
}
