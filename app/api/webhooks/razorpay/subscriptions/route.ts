import { NextRequest, NextResponse } from "next/server";
import {
  beginBillingWebhookEvent,
  fallbackWebhookEventId,
  finishBillingWebhookEvent,
  getCheckoutByProviderSubscriptionId,
  syncProviderSubscription,
  unixSecondsToDate,
  verifyRazorpayWebhookSignature,
} from "@/lib/billing";
import type { SubscriptionStatus } from "@/lib/billing";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Entity = Record<string, unknown>;
type WebhookPayload = {
  event?: unknown;
  payload?: {
    subscription?: { entity?: Entity };
    payment?: { entity?: Entity };
  };
};

function mapEvent(eventType: string): {
  subscriptionStatus: SubscriptionStatus;
  checkoutStatus: "authenticated" | "active" | "past_due" | "cancelled" | "failed";
} | null {
  if (eventType === "subscription.authenticated") {
    return { subscriptionStatus: "active", checkoutStatus: "authenticated" };
  }
  if (["subscription.activated", "subscription.charged", "subscription.resumed"].includes(eventType)) {
    return { subscriptionStatus: "active", checkoutStatus: "active" };
  }
  if (["subscription.pending", "subscription.halted", "subscription.paused", "payment.failed"].includes(eventType)) {
    return {
      subscriptionStatus: "past_due",
      checkoutStatus: eventType === "payment.failed" ? "failed" : "past_due",
    };
  }
  if (["subscription.cancelled", "subscription.completed", "subscription.expired"].includes(eventType)) {
    return { subscriptionStatus: "cancelled", checkoutStatus: "cancelled" };
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!SUBSCRIPTIONS_ENABLED) {
    return NextResponse.json({ ok: false, error: "Subscriptions are not currently available." }, { status: 404 });
  }
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const eventType = typeof body.event === "string" ? body.event : "unknown";
  const subscription = body.payload?.subscription?.entity;
  const payment = body.payload?.payment?.entity;
  const providerSubscriptionId = typeof subscription?.id === "string"
    ? subscription.id
    : typeof payment?.subscription_id === "string"
      ? payment.subscription_id
      : null;
  const eventId = req.headers.get("x-razorpay-event-id")?.trim() || fallbackWebhookEventId(rawBody);

  try {
    const inserted = await beginBillingWebhookEvent({
      eventId,
      eventType,
      providerSubscriptionId,
      payload: {
        provider_subscription_id: providerSubscriptionId,
        provider_payment_id: typeof payment?.id === "string" ? payment.id : null,
        subscription_status: typeof subscription?.status === "string" ? subscription.status : null,
        created_at: typeof (body as { created_at?: unknown }).created_at === "number"
          ? (body as { created_at: number }).created_at
          : null,
      },
    });
    if (inserted === "duplicate") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const mapped = mapEvent(eventType);
    if (!mapped || !providerSubscriptionId) {
      await finishBillingWebhookEvent(eventId);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const checkout = await getCheckoutByProviderSubscriptionId(providerSubscriptionId);
    if (!checkout) {
      await finishBillingWebhookEvent(eventId, "No matching checkout session.");
      return NextResponse.json({ ok: true, unmatched: true }, { status: 202 });
    }

    await syncProviderSubscription({
      checkoutId: checkout.id,
      organizationId: checkout.organizationId,
      planCode: checkout.planCode,
      interval: checkout.interval,
      providerSubscriptionId,
      providerCustomerId: typeof subscription?.customer_id === "string" ? subscription.customer_id : null,
      providerPaymentId: typeof payment?.id === "string" ? payment.id : null,
      status: mapped.subscriptionStatus,
      checkoutStatus: mapped.checkoutStatus,
      periodStart: unixSecondsToDate(subscription?.current_start),
      periodEnd: unixSecondsToDate(subscription?.current_end),
    });
    await finishBillingWebhookEvent(eventId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    await finishBillingWebhookEvent(eventId, message).catch(() => undefined);
    return NextResponse.json({ ok: false, error: "Webhook processing failed." }, { status: 500 });
  }
}
