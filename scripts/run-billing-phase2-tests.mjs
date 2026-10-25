#!/usr/bin/env node
import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const migration = read("supabase/migrations/098_billing_phase2_razorpay.sql");
const provider = read("lib/billing/razorpay.ts");
const checkout = read("app/api/billing/checkout/route.ts");
const webhook = read("app/api/webhooks/razorpay/subscriptions/route.ts");
const client = read("components/billing/billing-dashboard.tsx");
const env = read(".env.example");

console.log("\n--- Billing Phase 2 static/security checks ---\n");

assert(migration.includes("billing_checkout_sessions"), "checkout sessions migration exists");
assert(migration.includes("billing_webhook_events"), "webhook idempotency table exists");
assert(migration.includes("UNIQUE (provider, provider_event_id)"), "webhook events are deduplicated");
assert(provider.includes('createHmac("sha256"'), "webhook verification uses HMAC-SHA256");
assert(provider.includes('update(rawBody, "utf8")'), "webhook signature uses the unmodified raw body");
assert(checkout.includes('session.orgRole !== "company_admin"'), "checkout is restricted to company admins");
assert(checkout.includes("assertBillingProviderStorageReady"), "storage is checked before remote checkout creation");
assert(webhook.includes('headers.get("x-razorpay-signature")'), "webhook reads Razorpay signature header");
assert(webhook.includes('headers.get("x-razorpay-event-id")'), "webhook reads provider idempotency header");
assert(!client.includes("RAZORPAY_KEY_SECRET"), "Razorpay secret is absent from client code");
assert(env.includes("RAZORPAY_WEBHOOK_SECRET="), "webhook secret is documented in environment template");

const body = JSON.stringify({ event: "subscription.activated", payload: { subscription: { entity: { id: "sub_test" } } } });
const secret = "test_webhook_secret";
const signature = createHmac("sha256", secret).update(body, "utf8").digest("hex");
assert(signature.length === 64, "reference webhook HMAC is a 64-character SHA-256 digest");

console.log("\nBilling Phase 2 checks passed.\n");
