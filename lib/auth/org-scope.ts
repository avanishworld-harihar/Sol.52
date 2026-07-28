import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readAppSession, type AppSession } from "@/lib/auth/session";
import { resolveDefaultOrgId } from "@/lib/project-store";

export type OrgScopeMode = "session" | "legacy";

export type OrgScope = {
  organizationId: string | null;
  session: AppSession | null;
  mode: OrgScopeMode;
  /**
   * When true (legacy soft), list queries should also include rows with
   * organization_id IS NULL so pre-auth CRM data still appears.
   */
  includeUnscopedRows: boolean;
};

/**
 * soft (default): session org when signed in; else first active org (legacy single-tenant).
 * strict: CRM APIs require a signed-in org session (AUTH_ORG_ISOLATION=strict).
 */
export function isOrgIsolationStrict(): boolean {
  const v = (process.env.AUTH_ORG_ISOLATION ?? "").trim().toLowerCase();
  return v === "strict" || v === "1" || v === "true" || v === "yes";
}

export async function resolveOrgScope(req: NextRequest): Promise<OrgScope> {
  const session = readAppSession(req);
  if (session?.organizationId) {
    return {
      organizationId: session.organizationId,
      session,
      mode: "session",
      includeUnscopedRows: false,
    };
  }
  const legacy = await resolveDefaultOrgId();
  return {
    organizationId: legacy,
    session: null,
    mode: "legacy",
    includeUnscopedRows: true,
  };
}

/** 401 when strict isolation is on and there is no subscriber session. */
export function denyIfStrictUnauthenticated(scope: OrgScope): NextResponse | null {
  if (!isOrgIsolationStrict()) return null;
  if (scope.mode === "session" && scope.organizationId) return null;
  return NextResponse.json(
    { ok: false, error: "Sign in required for organization data.", code: "org_auth_required" },
    { status: 401 }
  );
}

/**
 * When the caller has a session org, resource must match.
 * Legacy (no session) skips — single-tenant soft mode.
 */
export function denyIfCrossOrg(
  resourceOrganizationId: string | null | undefined,
  scope: OrgScope
): NextResponse | null {
  if (scope.mode !== "session" || !scope.organizationId) return null;
  const resourceOrg = resourceOrganizationId ? String(resourceOrganizationId) : "";
  if (!resourceOrg) {
    if (isOrgIsolationStrict()) {
      return NextResponse.json(
        {
          ok: false,
          error: "This record has no organization. Ask admin to re-save it.",
          code: "org_missing",
        },
        { status: 403 }
      );
    }
    return null;
  }
  if (resourceOrg !== scope.organizationId) {
    return NextResponse.json(
      { ok: false, error: "This record belongs to another organization.", code: "org_forbidden" },
      { status: 403 }
    );
  }
  return null;
}

export function orgForbiddenResponse(message = "Organization access denied.") {
  return NextResponse.json({ ok: false, error: message, code: "org_forbidden" }, { status: 403 });
}
