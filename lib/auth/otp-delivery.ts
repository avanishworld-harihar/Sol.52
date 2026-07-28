import { isAuthDevMode } from "@/lib/auth/session";
import { displayPhone } from "@/lib/auth/phone";

export type OtpDeliveryResult =
  | {
      ok: true;
      channel: "dev" | "log";
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
  const label = displayPhone(input.phoneE164);
  console.info(`[auth:otp] code for ${label}: ${input.code}`);

  if (isAuthDevMode()) {
    return {
      ok: true,
      channel: "dev",
      devCode: input.code,
      message: `Dev mode: use code ${input.code} (also logged on server).`,
    };
  }

  return {
    ok: false,
    error:
      "OTP SMS/WhatsApp delivery is not configured yet. Set AUTH_DEV_MODE=true for testing, or add Twilio/WhatsApp later.",
  };
}
