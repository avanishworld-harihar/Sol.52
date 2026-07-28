import type { NextRequest } from "next/server";
import { readAppSession, type AppSession, type OrgRole } from "@/lib/auth/session";

export function requireAppSession(req: NextRequest): AppSession | null {
  return readAppSession(req);
}

export function requireCompanyAdmin(req: NextRequest): AppSession | null {
  const session = readAppSession(req);
  if (!session || session.orgRole !== "company_admin") return null;
  return session;
}

export function isCompanyAdmin(session: AppSession | null | undefined): boolean {
  return session?.orgRole === "company_admin";
}

export function isEmployee(session: AppSession | null | undefined): boolean {
  return session?.orgRole === "employee";
}

/** Screens / APIs employees must not use. */
export const EMPLOYEE_BLOCKED_PATH_PREFIXES = [
  "/billing",
  "/more/rate-card",
  "/api/billing",
  "/api/team",
  "/admin",
] as const;

export function employeeMayAccessPath(pathname: string): boolean {
  return !EMPLOYEE_BLOCKED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export type RoleGate = {
  canManageTeam: boolean;
  canManageBilling: boolean;
  canEditRateCard: boolean;
  canSeeAllCustomers: boolean;
  orgRole: OrgRole | null;
};

export function roleGatesFromSession(session: AppSession | null): RoleGate {
  const admin = isCompanyAdmin(session);
  return {
    canManageTeam: admin,
    canManageBilling: admin,
    canEditRateCard: admin,
    /** Wave 2: employees still see org CRM; assignment filter comes later. */
    canSeeAllCustomers: true,
    orgRole: session?.orgRole ?? null,
  };
}
