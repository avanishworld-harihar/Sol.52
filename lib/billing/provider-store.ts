import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  BillingInterval,
  PlanCode,
  SubscriptionStatus,
} from "@/lib/billing/types";
import { getPlanByCode } from "@/lib/billing/subscription-store";

type Row = Record<string, unknown>;

function db() {
  const client = createSupabaseAdmin();
  if (!client) throw new Error("Billing provider storage requires SUPABASE_SERVICE_ROLE_KEY.");
  return client;
}

export async function assertBillingProviderStorageReady(): Promise<void> {
  const { error } = await db().from("billing_checkout_sessions").select("id").limit(1);
  if (error) {
    throw new Error("Billing Phase 2 migration is not applied.");
  }
}

export async function createBillingCheckoutSession(input: {
  organizationId: string;
  planId: string;
  interval: BillingInterval;
  providerSubscriptionId: string;
  shortUrl?: string | null;
  userId?: string | null;
}): Promise<void> {
  const { error } = await db().from("billing_checkout_sessions").insert({
    organization_id: input.organizationId,
    plan_id: input.planId,
    billing_interval: input.interval,
    provider: "razorpay",
    provider_subscription_id: input.providerSubscriptionId,
    provider_short_url: input.shortUrl ?? null,
    status: "created",
    created_by_user_id: input.userId ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not save checkout session: ${error.message}`);
}

export async function getCheckoutByProviderSubscriptionId(providerSubscriptionId: string): Promise<{
  id: string;
  organizationId: string;
  planCode: PlanCode;
  interval: BillingInterval;
} | null> {
  const { data, error } = await db()
    .from("billing_checkout_sessions")
    .select("id, organization_id, billing_interval, subscription_plans(code)")
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Row;
  const nested = row.subscription_plans;
  const plan = (Array.isArray(nested) ? nested[0] : nested) as Row | undefined;
  if (!plan?.code) return null;
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    planCode: String(plan.code) as PlanCode,
    interval: row.billing_interval === "yearly" ? "yearly" : "monthly",
  };
}

export async function beginBillingWebhookEvent(input: {
  eventId: string;
  eventType: string;
  providerSubscriptionId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<"created" | "duplicate"> {
  const { error } = await db().from("billing_webhook_events").insert({
    provider: "razorpay",
    provider_event_id: input.eventId,
    event_type: input.eventType,
    provider_subscription_id: input.providerSubscriptionId ?? null,
    payload: input.payload ?? {},
  });
  if (!error) return "created";
  if (error.code === "23505" || /duplicate key|unique/i.test(error.message)) {
    const { data: existing } = await db()
      .from("billing_webhook_events")
      .select("processed_at, processing_error")
      .eq("provider", "razorpay")
      .eq("provider_event_id", input.eventId)
      .maybeSingle();
    if (existing?.processed_at && !existing.processing_error) return "duplicate";
    await db()
      .from("billing_webhook_events")
      .update({ processing_error: null, processed_at: null })
      .eq("provider", "razorpay")
      .eq("provider_event_id", input.eventId);
    return "created";
  }
  throw new Error(`Could not persist webhook event: ${error.message}`);
}

export async function finishBillingWebhookEvent(
  eventId: string,
  processingError?: string | null
): Promise<void> {
  await db()
    .from("billing_webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      processing_error: processingError?.slice(0, 1000) ?? null,
    })
    .eq("provider", "razorpay")
    .eq("provider_event_id", eventId);
}

export async function syncProviderSubscription(input: {
  checkoutId: string;
  organizationId: string;
  planCode: PlanCode;
  interval: BillingInterval;
  providerSubscriptionId: string;
  providerCustomerId?: string | null;
  providerPaymentId?: string | null;
  status: SubscriptionStatus;
  checkoutStatus: "authenticated" | "active" | "past_due" | "cancelled" | "failed";
  periodStart?: Date | null;
  periodEnd?: Date | null;
}): Promise<void> {
  const client = db();
  const plan = await getPlanByCode(input.planCode);
  if (!plan) throw new Error(`Unknown billing plan: ${input.planCode}`);
  const now = new Date().toISOString();

  const { error: checkoutError } = await client
    .from("billing_checkout_sessions")
    .update({ status: input.checkoutStatus, updated_at: now })
    .eq("id", input.checkoutId);
  if (checkoutError) throw new Error(`Could not update checkout: ${checkoutError.message}`);

  // Authentication means the mandate exists but the paid entitlement is not yet
  // active. Wait for subscription.activated/charged before replacing a trial.
  if (input.checkoutStatus === "authenticated") return;

  if (input.checkoutStatus !== "active") {
    const { data: current } = await client
      .from("organization_subscriptions")
      .select("provider_subscription_id")
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (current?.provider_subscription_id !== input.providerSubscriptionId) {
      // A failed first checkout must not replace a still-valid trial/manual plan.
      return;
    }
  }

  const payload: Row = {
    organization_id: input.organizationId,
    plan_id: plan.id,
    status: input.status,
    billing_interval: input.interval,
    provider: "razorpay",
    provider_subscription_id: input.providerSubscriptionId,
    provider_customer_id: input.providerCustomerId ?? null,
    provider_latest_payment_id: input.providerPaymentId ?? null,
    current_period_start: input.periodStart?.toISOString() ?? null,
    current_period_end: input.periodEnd?.toISOString() ?? null,
    cancel_at_period_end: false,
    is_complimentary: false,
    expires_at: null,
    granted_by: null,
    granted_reason: null,
    updated_at: now,
  };
  const { error } = await client
    .from("organization_subscriptions")
    .upsert(payload, { onConflict: "organization_id" });
  if (error) throw new Error(`Could not sync subscription: ${error.message}`);
}
