import { NextRequest, NextResponse } from "next/server";
import {
  appSessionCookieConfig,
  isAppAuthConfigured,
  readAppSession,
} from "@/lib/auth/session";
import { roleGatesFromSession } from "@/lib/auth/roles";
import { resolveOrgScope } from "@/lib/auth/org-scope";
import { buildAppSessionCookieValue } from "@/lib/auth/session";
import { getOrganizationMemberWorkRole } from "@/lib/auth/data-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAppAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Auth is not configured.",
        data: { signedIn: false },
      },
      { status: 503 }
    );
  }

  const cookieSession = readAppSession(req);
  if (!cookieSession) {
    return NextResponse.json({
      ok: true,
      data: { signedIn: false, gates: roleGatesFromSession(null) },
    });
  }

  const scope = await resolveOrgScope(req);
  const session = scope.mode === "session" ? scope.session : null;
  if (!session) {
    const res = NextResponse.json({ ok: true, data: { signedIn: false, gates: roleGatesFromSession(null) } });
    const cookie = appSessionCookieConfig();
    res.cookies.set(cookie.name, "", { ...cookie, maxAge: 0 });
    return res;
  }

  const workRole = await getOrganizationMemberWorkRole(session.organizationId, session.userId);
  const res = NextResponse.json({
    ok: true,
    data: {
      signedIn: true,
      userId: session.userId,
      phone: session.phone,
      organizationId: session.organizationId,
      orgRole: session.orgRole,
      workRole,
      organizationName: session.organizationName,
      checkedAt: session.checkedAt,
      gates: roleGatesFromSession(session),
    },
  });
  if (session.orgRole !== cookieSession.orgRole) {
    const cookie = appSessionCookieConfig();
    res.cookies.set(cookie.name, buildAppSessionCookieValue(session), cookie);
  }
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, data: { signedIn: false } });
  const cookie = appSessionCookieConfig();
  res.cookies.set(cookie.name, "", { ...cookie, maxAge: 0 });
  return res;
}
