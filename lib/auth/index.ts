export { normalizePhoneE164, displayPhone, phoneDigitsForCompare, cleanPhoneDigits } from "@/lib/auth/phone";
export {
  APP_SESSION_COOKIE,
  OTP_PENDING_COOKIE,
  isAuthLoginRequired,
} from "@/lib/auth/constants";
export {
  readAppSession,
  buildAppSessionCookieValue,
  appSessionCookieConfig,
  readOtpPending,
  buildOtpPendingCookieValue,
  otpPendingCookieConfig,
  isAppAuthConfigured,
  isAuthDevMode,
  type AppSession,
  type OrgRole,
  type OtpPending,
} from "@/lib/auth/session";
export { resolveOrgIdForRequest, resolveAppSessionFromRequest } from "@/lib/auth/org-context";
export { findOrCreateAuthUserByPhone } from "@/lib/auth/users";
export { ensureOrgMembershipForUser } from "@/lib/auth/onboarding";
export {
  requireAppSession,
  requireCompanyAdmin,
  isCompanyAdmin,
  isEmployee,
  roleGatesFromSession,
} from "@/lib/auth/roles";
