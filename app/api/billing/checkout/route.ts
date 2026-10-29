import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveAppSessionFromRequest } from "@/lib/auth/org-context";
import {
  createBillingCheckoutSession,
  createRazorpaySubscription,
  assertBillingProviderStorageReady,
  getOrgSubscription,
  getPlanByCode,
  getRazorpayKeyId,
  isRazorpayCheckoutConfigured,
  logBillingEvent,
  SUBSCRIPTIONS_ENABLED,
} from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  planCode: z.enum(["starter", "pro", "business"]),
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(req: NextRequest) {
  if (!SUBSCRIPTIONS_ENABLED) {
    return NextResponse.json(
      { ok: false, error: "Subscriptions are not currently available." },
      { status: 404 }
    );
  }

  const session = resolveAppSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in is required to subscribe." }, { status: 401 });
  }
  if (session.orgRole !== "company_admin") {
    return NextResponse.json(
      { ok: false, error: "Only the company admin can change the subscription." },
      { status: 403 }
    );
  }

  try {
    const body = schema.parse(await req.json());
    const plan = await getPlanByCode(body.planCode);
    if (!plan?.is_active) {
      return NextResponse.json({ ok: false, error: "This plan is not available." }, { status: 404 });
    }
    const current = await getOrgSubscription(session.organizationId);
    if (
      current &&
      current.status === "active" &&
      current.plan.code !== "trial" &&
      !current.is_complimentary
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "subscription_already_active",
          error: "An active paid subscription already exists. Contact SOL.52 support to change it safely.",
        },
        { status: 409 }
      );
    }
    if (!isRazorpayCheckoutConfigured(plan, body.interval)) {
      return NextResponse.json(
        {
          ok: false,
          code: "checkout_not_configured",
          error: "Online checkout is not configured for this plan yet. Contact SOL.52 support.",
        },
        { status: 503 }
      );
    }

    await assertBillingProviderStorageReady();

    const providerSub = await createRazorpaySubscription({
      plan,
      interval: body.interval,
      organizationId: session.organizationId,
      organizationName: session.organizationName,
      userId: session.userId,
    });
    if (!providerSub.id || !providerSub.short_url) {
      throw new Error("Razorpay did not return a hosted checkout URL.");
    }

    await createBillingCheckoutSession({
      organizationId: session.organizationId,
      planId: plan.id,
      interval: body.interval,
      providerSubscriptionId: providerSub.id,
      shortUrl: providerSub.short_url,
      userId: session.userId,
    });
    await logBillingEvent({
      organizationId: session.organizationId,
      eventType: "checkout.created",
      payload: {
        provider: "razorpay",
        provider_subscription_id: providerSub.id,
        plan_code: plan.code,
        billing_interval: body.interval,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        provider: "razorpay",
        keyId: getRazorpayKeyId(),
        subscriptionId: providerSub.id,
        checkoutUrl: providerSub.short_url,
        planCode: plan.code,
        interval: body.interval,
      },
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join(", ")
      : error instanceof Error
        ? error.message
        : "Could not start checkout.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
