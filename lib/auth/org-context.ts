import type { NextRequest } from "next/server";
import { readAppSession, type AppSession } from "@/lib/auth/session";
import { resolveDefaultOrgId } from "@/lib/project-store";

/**
 * Prefer logged-in subscriber org; fall back to legacy first-active-org
 * (single-tenant) until AUTH_REQUIRE_LOGIN is enforced everywhere.
 */
export async function resolveOrgIdForRequest(req?: NextRequest | null): Promise<string | null> {
  if (req) {
    const session = readAppSession(req);
    if (session?.organizationId) return session.organizationId;
  }
  return resolveDefaultOrgId();
}

export function resolveAppSessionFromRequest(req: NextRequest): AppSession | null {
  return readAppSession(req);
}
