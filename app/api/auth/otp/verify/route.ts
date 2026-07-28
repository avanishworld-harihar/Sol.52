import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashOtpCode, safeEqualHex } from "@/lib/auth/crypto";
import { ensureOrgMembershipForUser } from "@/lib/auth/onboarding";
import { normalizePhoneE164 } from "@/lib/auth/phone";
import {
  appSessionCookieConfig,
  buildAppSessionCookieValue,
  buildOtpPendingCookieValue,
  isAppAuthConfigured,
  otpPendingCookieConfig,
  readOtpPending,
  type AppSession,
} from "@/lib/auth/session";
import { findOrCreateAuthUserByPhone } from "@/lib/auth/users";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().min(4).max(8),
  companyName: z.string().max(120).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    if (!isAppAuthConfigured() || !createSupabaseAdmin()) {
      return NextResponse.json(
        { ok: false, error: "Auth is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const body = schema.parse(await req.json());
    const phone = normalizePhoneE164(body.phone);
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 400 });
    }

    const pending = readOtpPending(req);
    if (!pending || pending.phone !== phone) {
      return NextResponse.json(
        { ok: false, error: "OTP expired or missing. Request a new code." },
        { status: 400 }
      );
    }

    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      const res = NextResponse.json({ ok: false, error: "OTP expired. Request a new code." }, { status: 400 });
      const cookie = otpPendingCookieConfig();
      res.cookies.set(cookie.name, "", { ...cookie, maxAge: 0 });
      return res;
    }

    if (pending.attempts >= 5) {
      const res = NextResponse.json(
        { ok: false, error: "Too many attempts. Request a new code." },
        { status: 429 }
      );
      const cookie = otpPendingCookieConfig();
      res.cookies.set(cookie.name, "", { ...cookie, maxAge: 0 });
      return res;
    }

    const expected = pending.codeHash;
    const got = hashOtpCode(body.code.trim(), phone);
    if (!safeEqualHex(expected, got)) {
      const updated = { ...pending, attempts: pending.attempts + 1 };
      const res = NextResponse.json({ ok: false, error: "Incorrect OTP." }, { status: 401 });
      const cookie = otpPendingCookieConfig();
      res.cookies.set(cookie.name, buildOtpPendingCookieValue(updated), cookie);
      return res;
    }

    const user = await findOrCreateAuthUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Could not create user account." }, { status: 500 });
    }

    const membership = await ensureOrgMembershipForUser({
      userId: user.id,
      phone,
      companyName: body.companyName ?? null,
    });
    if (!membership) {
      return NextResponse.json({ ok: false, error: "Could not create or join organization." }, { status: 500 });
    }

    const session: AppSession = {
      userId: user.id,
      phone,
      organizationId: membership.organizationId,
      orgRole: membership.orgRole,
      organizationName: membership.organizationName,
      checkedAt: new Date().toISOString(),
    };

    const res = NextResponse.json({
      ok: true,
      data: {
        userId: session.userId,
        phone: session.phone,
        organizationId: session.organizationId,
        orgRole: session.orgRole,
        organizationName: session.organizationName,
        createdOrg: membership.createdOrg,
        claimedExistingOrg: membership.claimedExistingOrg,
        joinedViaInvite: membership.joinedViaInvite,
      },
    });

    const sessionCookie = appSessionCookieConfig();
    res.cookies.set(sessionCookie.name, buildAppSessionCookieValue(session), sessionCookie);

    const otpCookie = otpPendingCookieConfig();
    res.cookies.set(otpCookie.name, "", { ...otpCookie, maxAge: 0 });

    return res;
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues.map((i) => i.message).join(", ") : "OTP verify failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
