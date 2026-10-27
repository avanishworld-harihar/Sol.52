import { isAuthDevMode } from "@/lib/auth/session";
import { displayPhone } from "@/lib/auth/phone";

export type OtpDeliveryResult =
  | {
      ok: true;
      channel: "dev" | "sms";
      /** Only when AUTH_DEV_MODE / non-production. */
      devCode?: string;
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Wave 1 OTP delivery:
 * - Dev / AUTH_DEV_MODE: expose code in API response for testing
 * - Always log server-side
 * - Production without AUTH_DEV_MODE: refuse until SMS/WhatsApp (Wave 1.5)
 */
export async function deliverOtp(input: {
  phoneE164: string;
  code: string;
}): Promise<OtpDeliveryResult> {
  if (isAuthDevMode()) {
    const label = displayPhone(input.phoneE164);
    console.info(`[auth:otp] dev code for ${label}: ${input.code}`);
    return {
      ok: true,
      channel: "dev",
      devCode: input.code,
      message: `Dev mode: use code ${input.code} (also logged on server).`,
    };
  }

  const accountSid = (process.env.TWILIO_ACCOUNT_SID ?? "").trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN ?? "").trim();
  const messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID ?? "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER ?? "").trim();
  if (accountSid && authToken && (messagingServiceSid || from)) {
    const form = new URLSearchParams({
      To: input.phoneE164,
      Body: `Your Sol.52 login code is ${input.code}. It expires in 10 minutes. Do not share it.`,
    });
    if (messagingServiceSid) form.set("MessagingServiceSid", messagingServiceSid);
    else form.set("From", from);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    });
    if (response.ok) {
      return { ok: true, channel: "sms", message: "OTP sent by SMS." };
    }
    const detail = await response.text();
    console.error("[auth:otp] Twilio delivery failed", response.status, detail.slice(0, 300));
    return { ok: false, error: "Could not send OTP right now. Please try again." };
  }

  return {
    ok: false,
    error:
      "OTP SMS delivery is not configured. Set Twilio credentials or enable AUTH_DEV_MODE only for local testing.",
  };
}
