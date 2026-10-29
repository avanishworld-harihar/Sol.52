/**
 * Billing is intentionally paused while the Razorpay offering is redesigned.
 * Keep the billing implementation and tables in place so they can be wired to
 * the new plans later, but do not gate any product capability in the meantime.
 */
export const SUBSCRIPTIONS_ENABLED = false;
