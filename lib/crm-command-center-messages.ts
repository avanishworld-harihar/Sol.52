import { normalizePhoneForWhatsApp } from "@/lib/whatsapp-lead";

export function buildCommandActionWhatsAppUrl(
  phone: string,
  customerName: string,
  installerName: string,
  reason: string
): string | null {
  let digits = normalizePhoneForWhatsApp(phone);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 10) return null;
  const cleanReason = reason.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
  const msg = `Hi ${customerName}, this is ${installerName} from SOL.52. ${cleanReason} — can we connect today?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}
