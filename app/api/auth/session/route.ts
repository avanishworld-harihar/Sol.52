import { NextRequest, NextResponse } from "next/server";
import {
  appSessionCookieConfig,
  isAppAuthConfigured,
  readAppSession,
} from "@/lib/auth/session";
import { roleGatesFromSession } from "@/lib/auth/roles";

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

  const session = readAppSession(req);
  if (!session) {
    return NextResponse.json({
      ok: true,
      data: { signedIn: false, gates: roleGatesFromSession(null) },
    });
  }

  return NextResponse.json({
    ok: true,
    data: {
      signedIn: true,
      userId: session.userId,
      phone: session.phone,
      organizationId: session.organizationId,
      orgRole: session.orgRole,
      organizationName: session.organizationName,
      checkedAt: session.checkedAt,
      gates: roleGatesFromSession(session),
    },
  });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, data: { signedIn: false } });
  const cookie = appSessionCookieConfig();
  res.cookies.set(cookie.name, "", { ...cookie, maxAge: 0 });
  return res;
}
