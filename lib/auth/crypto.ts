import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function sessionSecret(): string {
  const explicit = (process.env.AUTH_SESSION_SECRET ?? "").trim();
  if (explicit) return explicit;
  const fallback = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (fallback) return `sol52-auth:${fallback}`;
  return "sol52-auth-dev-insecure";
}

export function isAuthCryptoConfigured(): boolean {
  return Boolean(
    (process.env.AUTH_SESSION_SECRET ?? "").trim() ||
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim()
  );
}

export function signPayload(payloadJson: string): string {
  return createHmac("sha256", sessionSecret()).update(payloadJson).digest("base64url");
}

export function sealJson(value: unknown): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

export function openJson<T>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;
  const expected = signPayload(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function hashOtpCode(code: string, phone: string): string {
  return createHmac("sha256", sessionSecret()).update(`${phone}:${code}`).digest("hex");
}

export function generateOtpCode(): string {
  // 6-digit, no leading-zero ambiguity for UX (100000–999999)
  const n = randomBytes(3).readUIntBE(0, 3) % 900000;
  return String(100000 + n);
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
