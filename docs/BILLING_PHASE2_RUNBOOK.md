# SOL.52 Billing Phase 2 — launch runbook

The application now supports hosted Razorpay subscription checkout and signed,
idempotent webhook reconciliation. Paid access is activated by the webhook, not
by a browser redirect or client-side success callback.

## 1. Apply the database migration

Apply `supabase/migrations/098_billing_phase2_razorpay.sql` after migrations 052,
053 and 075. It adds annual catalog prices, provider identifiers, checkout
sessions and the webhook delivery audit/idempotency table.

## 2. Create Razorpay plans

In Razorpay Test Mode, create monthly and yearly plans for Starter, Pro and
Business. Plan amounts must match the SOL.52 catalog:

| Plan | Monthly | Annual |
|---|---:|---:|
| Starter | ₹1,499 | ₹14,990 |
| Pro | ₹3,499 | ₹34,990 |
| Business | ₹7,999 | ₹79,990 |

Plans cannot be edited after creation. If pricing changes, create new Razorpay
plans and update the environment IDs; never silently alter existing mandates.

## 3. Configure secrets

Set the variables documented in `.env.example`:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- the six `RAZORPAY_PLAN_*` IDs

The key secret and webhook secret are server-only and must never use a
`NEXT_PUBLIC_` prefix.

## 4. Configure the webhook

Webhook URL:

`https://<production-domain>/api/webhooks/razorpay/subscriptions`

Enable these subscription events in Test Mode and later in Live Mode:

- `subscription.authenticated`
- `subscription.activated`
- `subscription.charged`
- `subscription.pending`
- `subscription.halted`
- `subscription.paused`
- `subscription.resumed`
- `subscription.cancelled`
- `subscription.completed`
- `subscription.expired`
- `payment.failed`

Use a strong, distinct webhook secret. Test and live webhook configurations and
API keys must not be mixed.

## 5. Test before enforcing

1. Keep `BILLING_FAILURE_MODE=open`.
2. Sign in as a company admin and open `/billing`.
3. Complete each plan/interval once with Razorpay Test Mode.
4. Verify `billing_checkout_sessions`, `billing_webhook_events`,
   `organization_subscriptions` and the `/billing` UI.
5. Replay a webhook and confirm it is marked duplicate without double changes.
6. Test failed authorization: an existing trial must remain usable.
7. Test activation, recurring charge, past-due and cancellation events.
8. Run `npm run typecheck`, `npm run lint` and `npm run test:billing-phase2`.

Only after a production soak should `BILLING_FAILURE_MODE=closed` be enabled.
Production login/OTP and strict organization isolation should also be enabled
before paid self-service access is advertised publicly.

## 6. Operational prerequisites

Live mode still requires Razorpay merchant activation, KYC, a verified settlement
bank account, customer-facing Terms, Privacy, Refund/Cancellation policies and a
GST invoicing decision. These are operational requirements, not repository
secrets or migration steps.
