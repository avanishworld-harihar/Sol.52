/** Edge-safe auth constants (no Node crypto). Safe for middleware. */

export const APP_SESSION_COOKIE = "ss_app_session";
export const OTP_PENDING_COOKIE = "ss_otp_pending";

export function isAuthLoginRequired(): boolean {
  const v = (process.env.AUTH_REQUIRE_LOGIN ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
