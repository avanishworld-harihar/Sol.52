import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import type { TrialIdentityInput } from "@/lib/billing/types";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function normalizePhone(raw?: string | null): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeEmail(raw?: string | null): string | null {
  const e = (raw ?? "").trim().toLowerCase();
  return e.includes("@") ? e : null;
}

export type TrialAbuseCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "org_trial_consumed" | "phone_used" | "email_used" | "fingerprint_used" };

/**
 * Blocks repeat trials by org flag, phone, email, or device fingerprint.
 * `signup_ip` is stored on trial_identities for analytics only — never used to deny.
 */
export async function checkTrialAbuse(input: {
  organizationId: string;
  identity: TrialIdentityInput;
}): Promise<TrialAbuseCheckResult> {
  const client = db();
  if (!client) return { allowed: true };

  const { data: org } = await client
    .from("organizations")
    .select("trial_consumed")
    .eq("id", input.organizationId)
    .maybeSingle();

  if ((org as { trial_consumed?: boolean } | null)?.trial_consumed) {
    return { allowed: false, reason: "org_trial_consumed" };
  }

  const phone = normalizePhone(input.identity.verified_phone);
  const email = normalizeEmail(input.identity.verified_email);
  const fingerprint = input.identity.device_fingerprint?.trim() || null;

  if (phone) {
    const { data } = await client
      .from("trial_identities")
      .select("id")
      .eq("verified_phone", phone)
      .limit(1)
      .maybeSingle();
    if (data) return { allowed: false, reason: "phone_used" };
  }

  if (email) {
    const { data } = await client
      .from("trial_identities")
      .select("id")
      .eq("verified_email", email)
      .limit(1)
      .maybeSingle();
    if (data) return { allowed: false, reason: "email_used" };
  }

  if (fingerprint) {
    const { data } = await client
      .from("trial_identities")
      .select("id")
      .eq("device_fingerprint", fingerprint)
      .limit(1)
      .maybeSingle();
    if (data) return { allowed: false, reason: "fingerprint_used" };
  }

  return { allowed: true };
}

export function extractSignupIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip")?.trim() || null;
}

export function extractTrialIdentityFromRequest(
  req: Request,
  body?: { verifiedPhone?: string; verifiedEmail?: string; deviceFingerprint?: string }
): TrialIdentityInput {
  return {
    verified_phone:
      body?.verifiedPhone ??
      req.headers.get("x-verified-phone") ??
      req.headers.get("x-sol52-verified-phone"),
    verified_email:
      body?.verifiedEmail ??
      req.headers.get("x-verified-email") ??
      req.headers.get("x-sol52-verified-email"),
    device_fingerprint:
      body?.deviceFingerprint ??
      req.headers.get("x-device-fingerprint") ??
      req.headers.get("x-sol52-device-fingerprint"),
    signup_ip: extractSignupIp(req.headers),
  };
}
