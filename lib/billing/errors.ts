import type { BillingEntitlementCode } from "@/lib/billing/types";

export class BillingEntitlementError extends Error {
  readonly code: BillingEntitlementCode;
  readonly details?: Record<string, unknown>;

  constructor(code: BillingEntitlementCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "BillingEntitlementError";
    this.code = code;
    this.details = details;
  }
}

export function isBillingEntitlementError(err: unknown): err is BillingEntitlementError {
  return err instanceof BillingEntitlementError;
}
