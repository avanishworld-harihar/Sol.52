/** Edge-safe auth constants (no Node crypto). Safe for middleware. */

export const APP_SESSION_COOKIE = "ss_app_session";
export const OTP_PENDING_COOKIE = "ss_otp_pending";

/**
 * Master switch for the subscriber login system.
 * Defaults to OFF while the auth flow is being revised. Set explicitly to
 * `true` to restore OTP login, session scoping and route protection.
 */
export function isAuthSystemEnabled(): boolean {
  const value = (process.env.AUTH_SYSTEM_ENABLED ?? "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function isAuthLoginRequired(): boolean {
  if (!isAuthSystemEnabled()) return false;
  const configured = process.env.AUTH_REQUIRE_LOGIN;
  if (configured == null || configured.trim() === "") return process.env.NODE_ENV === "production";
  const v = configured.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
