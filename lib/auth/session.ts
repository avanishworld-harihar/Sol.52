import type { NextRequest } from "next/server";
import { openJson, sealJson, isAuthCryptoConfigured } from "@/lib/auth/crypto";
import { APP_SESSION_COOKIE, OTP_PENDING_COOKIE } from "@/lib/auth/constants";

export { APP_SESSION_COOKIE, OTP_PENDING_COOKIE, isAuthLoginRequired } from "@/lib/auth/constants";

/** 30 days — matches SOL52_MASTER_PLAN login session. */
export const APP_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;
export const OTP_PENDING_MAX_AGE_SEC = 60 * 10;

export type OrgRole = "company_admin" | "employee";

export type AppSession = {
  userId: string;
  phone: string;
  organizationId: string;
  orgRole: OrgRole;
  organizationName: string | null;
  checkedAt: string;
};

export type OtpPending = {
  phone: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
};

export function isAppAuthConfigured(): boolean {
  return isAuthCryptoConfigured();
}

export function readAppSession(req: NextRequest): AppSession | null {
  const raw = req.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = openJson<AppSession>(raw);
  if (!session?.userId || !session.organizationId || !session.phone) return null;
  if (session.orgRole !== "company_admin" && session.orgRole !== "employee") return null;
  return session;
}

export function buildAppSessionCookieValue(session: AppSession): string {
  return sealJson(session);
}

export function appSessionCookieConfig() {
  return {
    name: APP_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: APP_SESSION_MAX_AGE_SEC,
  };
}

export function readOtpPending(req: NextRequest): OtpPending | null {
  const raw = req.cookies.get(OTP_PENDING_COOKIE)?.value;
  if (!raw) return null;
  const pending = openJson<OtpPending>(raw);
  if (!pending?.phone || !pending.codeHash || !pending.expiresAt) return null;
  return pending;
}

export function buildOtpPendingCookieValue(pending: OtpPending): string {
  return sealJson(pending);
}

export function otpPendingCookieConfig() {
  return {
    name: OTP_PENDING_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OTP_PENDING_MAX_AGE_SEC,
  };
}

export function isAuthDevMode(): boolean {
  const v = (process.env.AUTH_DEV_MODE ?? "").trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  return process.env.NODE_ENV !== "production";
}
