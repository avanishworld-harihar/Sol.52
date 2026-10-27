/** Edge-safe auth constants (no Node crypto). Safe for middleware. */

export const APP_SESSION_COOKIE = "ss_app_session";
export const OTP_PENDING_COOKIE = "ss_otp_pending";

export function isAuthLoginRequired(): boolean {
  const configured = process.env.AUTH_REQUIRE_LOGIN;
  if (configured == null || configured.trim() === "") return process.env.NODE_ENV === "production";
  const v = configured.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
