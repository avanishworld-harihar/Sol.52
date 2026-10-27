import type { NextRequest } from "next/server";
import { readAppSession, type AppSession, type OrgRole } from "@/lib/auth/session";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export function requireAppSession(req: NextRequest): AppSession | null {
  return readAppSession(req);
}

export async function requireCompanyAdmin(req: NextRequest): Promise<AppSession | null> {
  const session = readAppSession(req);
  if (!session || session.orgRole !== "company_admin") return null;
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", session.organizationId)
    .eq("user_id", session.userId)
    .maybeSingle();
  return !error && data?.role === "company_admin" ? session : null;
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
    canSeeAllCustomers: admin,
    orgRole: session?.orgRole ?? null,
  };
}
