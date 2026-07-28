/** Digits-only phone helpers for installer OTP login (India-default E.164). */

export function cleanPhoneDigits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * Normalize to E.164 for India when 10-digit local mobile is given.
 * Accepts: 9993322267, 09993322267, 919993322267, +919993322267
 */
export function normalizePhoneE164(raw: string): string | null {
  let digits = cleanPhoneDigits(raw);
  if (!digits) return null;

  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

export function phoneDigitsForCompare(raw: string): string {
  return cleanPhoneDigits(normalizePhoneE164(raw) ?? raw);
}

export function displayPhone(e164: string): string {
  const d = cleanPhoneDigits(e164);
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return e164.startsWith("+") ? e164 : `+${d}`;
}
