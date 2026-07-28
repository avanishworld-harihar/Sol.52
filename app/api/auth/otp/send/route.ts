import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOtpCode, hashOtpCode } from "@/lib/auth/crypto";
import { deliverOtp } from "@/lib/auth/otp-delivery";
import { normalizePhoneE164 } from "@/lib/auth/phone";
import {
  buildOtpPendingCookieValue,
  isAppAuthConfigured,
  otpPendingCookieConfig,
} from "@/lib/auth/session";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(req: NextRequest) {
  try {
    if (!isAppAuthConfigured() || !createSupabaseAdmin()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Auth is not configured. Set SUPABASE_SERVICE_ROLE_KEY (and optionally AUTH_SESSION_SECRET).",
        },
        { status: 503 }
      );
    }

    const body = schema.parse(await req.json());
    const phone = normalizePhoneE164(body.phone);
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 400 });
    }

    const code = generateOtpCode();
    const delivery = await deliverOtp({ phoneE164: phone, code });
    if (!delivery.ok) {
      return NextResponse.json({ ok: false, error: delivery.error }, { status: 503 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const pending = {
      phone,
      codeHash: hashOtpCode(code, phone),
      expiresAt,
      attempts: 0,
    };

    const res = NextResponse.json({
      ok: true,
      data: {
        phone,
        expiresAt,
        channel: delivery.channel,
        message: delivery.message,
        ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
      },
    });

    const cookie = otpPendingCookieConfig();
    res.cookies.set(cookie.name, buildOtpPendingCookieValue(pending), cookie);
    return res;
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues.map((i) => i.message).join(", ") : "OTP send failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
