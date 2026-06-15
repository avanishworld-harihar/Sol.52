import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { mapPlanRow } from "@/lib/billing/plan-utils";
import type {
  OrganizationSubscription,
  PlanCode,
  SubscriptionPlan,
  SubscriptionStatus,
  TrialIdentityInput,
} from "@/lib/billing/types";
import { logBillingEvent } from "@/lib/billing/usage";

type Row = Record<string, unknown>;

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function isMissingTableError(message: string): boolean {
  return /relation.*does not exist|Could not find the table/i.test(message);
}

function mapSubscriptionRow(row: Row, plan: SubscriptionPlan): OrganizationSubscription {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    plan_id: String(row.plan_id),
    plan,
    status: String(row.status) as SubscriptionStatus,
    trial_ends_at: row.trial_ends_at ? String(row.trial_ends_at) : null,
    trial_proposals_used: Number(row.trial_proposals_used) || 0,
    current_period_start: row.current_period_start ? String(row.current_period_start) : null,
    current_period_end: row.current_period_end ? String(row.current_period_end) : null,
    cancel_at_period_end: row.cancel_at_period_end === true,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    if (isMissingTableError(error.message)) return [];
    console.warn("[billing] listSubscriptionPlans:", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapPlanRow(r as Row));
}

export async function getPlanByCode(code: PlanCode): Promise<SubscriptionPlan | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client.from("subscription_plans").select("*").eq("code", code).maybeSingle();
  if (error || !data) {
    if (error && !isMissingTableError(error.message)) {
      console.warn("[billing] getPlanByCode:", error.message);
    }
    return null;
  }
  return mapPlanRow(data as Row);
}

export async function getOrgSubscription(
  organizationId: string
): Promise<OrganizationSubscription | null> {
  const client = db();
  if (!client || !organizationId) return null;

  const { data, error } = await client
    .from("organization_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    if (error && !isMissingTableError(error.message)) {
      console.warn("[billing] getOrgSubscription:", error.message);
    }
    return null;
  }

  const row = data as Row;
  const nested = row.subscription_plans;
  const planRow = (Array.isArray(nested) ? nested[0] : nested) as Row | undefined;
  if (!planRow) return null;
  return mapSubscriptionRow(row, mapPlanRow(planRow));
}

export async function isOrgTrialConsumed(organizationId: string): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { data, error } = await client
    .from("organizations")
    .select("trial_consumed")
    .eq("id", organizationId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { trial_consumed?: boolean }).trial_consumed === true;
}

export async function upsertOrgSubscription(input: {
  organizationId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  trialEndsAt?: Date | null;
  trialProposalsUsed?: number;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  actor?: string;
}): Promise<OrganizationSubscription | null> {
  const client = db();
  if (!client) return null;

  const plan = await getPlanByCode(input.planCode);
  if (!plan) return null;

  const now = new Date().toISOString();
  const payload: Row = {
    organization_id: input.organizationId,
    plan_id: plan.id,
    status: input.status,
    trial_ends_at: input.trialEndsAt?.toISOString() ?? null,
    trial_proposals_used: input.trialProposalsUsed ?? 0,
    current_period_start: input.periodStart?.toISOString() ?? null,
    current_period_end: input.periodEnd?.toISOString() ?? null,
    updated_at: now,
  };

  const { data, error } = await client
    .from("organization_subscriptions")
    .upsert(payload, { onConflict: "organization_id" })
    .select("*, subscription_plans(*)")
    .single();

  if (error || !data) {
    console.warn("[billing] upsertOrgSubscription:", error?.message);
    return null;
  }

  const row = data as Row;
  const nested = row.subscription_plans;
  const planRow = (Array.isArray(nested) ? nested[0] : nested) as Row;
  const sub = mapSubscriptionRow(row, mapPlanRow(planRow));

  await logBillingEvent({
    organizationId: input.organizationId,
    eventType: "subscription.assigned",
    payload: {
      plan_code: input.planCode,
      status: input.status,
      actor: input.actor ?? "system",
    },
  });

  return sub;
}

export async function markOrgTrialConsumed(organizationId: string): Promise<void> {
  const client = db();
  if (!client) return;
  await client
    .from("organizations")
    .update({ trial_consumed: true, updated_at: new Date().toISOString() })
    .eq("id", organizationId);
}

export async function recordTrialIdentity(
  organizationId: string,
  identity: TrialIdentityInput
): Promise<void> {
  const client = db();
  if (!client) return;

  const phone = identity.verified_phone?.trim() || null;
  const email = identity.verified_email?.trim().toLowerCase() || null;
  const fingerprint = identity.device_fingerprint?.trim() || null;

  if (!phone && !email && !fingerprint) return;

  const { error } = await client.from("trial_identities").insert({
    organization_id: organizationId,
    verified_phone: phone,
    verified_email: email,
    device_fingerprint: fingerprint,
    signup_ip: identity.signup_ip?.trim() || null,
    trial_used_at: new Date().toISOString(),
  });

  if (error && !/duplicate key|unique/i.test(error.message)) {
    console.warn("[billing] recordTrialIdentity:", error.message);
  }
}

export async function incrementTrialProposalsUsed(
  organizationId: string,
  current: number
): Promise<void> {
  const client = db();
  if (!client) return;
  await client
    .from("organization_subscriptions")
    .update({
      trial_proposals_used: current + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);
}

export async function listOrganizationsWithBilling(limit = 100): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    trial_consumed: boolean;
    subscription: OrganizationSubscription | null;
  }>
> {
  const client = db();
  if (!client) return [];

  const { data: orgs, error } = await client
    .from("organizations")
    .select("id, name, slug, trial_consumed")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !orgs?.length) return [];

  const results = [];
  for (const org of orgs) {
    const id = String((org as Row).id);
    const sub = await getOrgSubscription(id);
    results.push({
      id,
      name: String((org as Row).name),
      slug: String((org as Row).slug),
      trial_consumed: (org as Row).trial_consumed === true,
      subscription: sub,
    });
  }
  return results;
}
