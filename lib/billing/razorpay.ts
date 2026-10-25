import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { BillingInterval, PlanCode, SubscriptionPlan } from "@/lib/billing/types";

const API_BASE = "https://api.razorpay.com/v1";

type RazorpaySubscription = {
  id: string;
  status?: string;
  short_url?: string | null;
  customer_id?: string | null;
  current_start?: number | null;
  current_end?: number | null;
  notes?: Record<string, string> | null;
};

function clean(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export function getRazorpayKeyId(): string | null {
  return clean(process.env.RAZORPAY_KEY_ID);
}

function getRazorpayKeySecret(): string | null {
  return clean(process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayWebhookSecret(): string | null {
  return clean(process.env.RAZORPAY_WEBHOOK_SECRET);
}

export function getRazorpayPlanId(
  plan: SubscriptionPlan,
  interval: BillingInterval
): string | null {
  const fromDb = interval === "yearly"
    ? plan.provider_plan_id_yearly
    : plan.provider_plan_id_monthly;
  if (fromDb) return fromDb;

  const key = `RAZORPAY_PLAN_${plan.code.toUpperCase()}_${interval.toUpperCase()}`;
  return clean(process.env[key]);
}

export function isRazorpayCheckoutConfigured(
  plan?: SubscriptionPlan,
  interval?: BillingInterval
): boolean {
  // Never collect money if signed webhooks cannot activate/reconcile access.
  if (!getRazorpayKeyId() || !getRazorpayKeySecret() || !getRazorpayWebhookSecret()) return false;
  if (!plan || !interval) return true;
  return getRazorpayPlanId(plan, interval) !== null;
}

async function razorpayRequest<T>(path: string, init: RequestInit): Promise<T> {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured.");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64");
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { description?: string } })
    | null;
  if (!response.ok || !data) {
    const description = data?.error?.description;
    throw new Error(description || `Razorpay request failed (${response.status}).`);
  }
  return data;
}

export async function createRazorpaySubscription(input: {
  plan: SubscriptionPlan;
  interval: BillingInterval;
  organizationId: string;
  organizationName?: string | null;
  userId: string;
}): Promise<RazorpaySubscription> {
  const providerPlanId = getRazorpayPlanId(input.plan, input.interval);
  if (!providerPlanId) {
    throw new Error(`Razorpay ${input.plan.code} ${input.interval} plan ID is missing.`);
  }

  // Razorpay subscriptions support at most ten years. The merchant/customer can
  // still cancel at period end; this simply supplies the required total_count.
  const totalCount = input.interval === "yearly" ? 10 : 120;
  return razorpayRequest<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: providerPlanId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 0,
      notes: {
        organization_id: input.organizationId,
        organization_name: (input.organizationName || "SOL.52 customer").slice(0, 120),
        plan_code: input.plan.code satisfies PlanCode,
        billing_interval: input.interval,
        created_by_user_id: input.userId,
      },
    }),
  });
}

function safeHexEqual(expected: string, received: string): boolean {
  if (!/^[a-f0-9]+$/i.test(expected) || !/^[a-f0-9]+$/i.test(received)) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = getRazorpayWebhookSecret();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return safeHexEqual(expected, signature.trim());
}

export function fallbackWebhookEventId(rawBody: string): string {
  return `sha256:${createHash("sha256").update(rawBody, "utf8").digest("hex")}`;
}

export function unixSecondsToDate(value: unknown): Date | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? new Date(value * 1000)
    : null;
}

export type { RazorpaySubscription };
