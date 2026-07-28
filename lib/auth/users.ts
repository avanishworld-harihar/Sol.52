import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizePhoneE164, phoneDigitsForCompare } from "@/lib/auth/phone";

export type AuthUserRecord = {
  id: string;
  phone: string;
};

function adminClient(): SupabaseClient | null {
  return createSupabaseAdmin();
}

/**
 * Find auth.users by phone, or create a phone-confirmed user (service role).
 * organization_members.user_id FK requires auth.users.
 */
export async function findOrCreateAuthUserByPhone(rawPhone: string): Promise<AuthUserRecord | null> {
  const phone = normalizePhoneE164(rawPhone);
  if (!phone) return null;

  const admin = adminClient();
  if (!admin) return null;

  const existing = await findAuthUserByPhone(admin, phone);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    phone,
    phone_confirm: true,
    user_metadata: {
      phone,
      source: "sol52_otp_login",
    },
  });

  if (error) {
    // Race: another request created the user
    const again = await findAuthUserByPhone(admin, phone);
    if (again) return again;
    console.warn("[auth] createUser failed:", error.message);
    return null;
  }

  if (!data.user?.id) return null;
  return { id: data.user.id, phone };
}

async function findAuthUserByPhone(
  admin: SupabaseClient,
  phoneE164: string
): Promise<AuthUserRecord | null> {
  const want = phoneDigitsForCompare(phoneE164);

  // Paginate admin list (small installer SaaS — fine for Wave 1).
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn("[auth] listUsers failed:", error.message);
      return null;
    }
    const users = data?.users ?? [];
    for (const u of users) {
      const p = u.phone ? phoneDigitsForCompare(u.phone) : "";
      if (p && p === want) {
        return { id: u.id, phone: normalizePhoneE164(u.phone!) ?? phoneE164 };
      }
    }
    if (users.length < perPage) break;
    page += 1;
    if (page > 20) break;
  }
  return null;
}
