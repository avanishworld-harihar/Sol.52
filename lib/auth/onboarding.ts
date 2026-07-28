import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { resolveOrgBilling } from "@/lib/billing/entitlements";
import type { OrgRole } from "@/lib/auth/session";
import { phoneDigitsForCompare } from "@/lib/auth/phone";
import { acceptInviteForUser, findPendingInviteForPhone } from "@/lib/team/invites";

export type MembershipResult = {
  organizationId: string;
  orgRole: OrgRole;
  organizationName: string | null;
  createdOrg: boolean;
  claimedExistingOrg: boolean;
  joinedViaInvite: boolean;
};

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "company";
}

async function uniqueSlug(base: string): Promise<string> {
  const admin = createSupabaseAdmin();
  if (!admin) return `${base}-${Date.now().toString(36)}`;
  let candidate = base;
  for (let i = 0; i < 8; i++) {
    const { data } = await admin.from("organizations").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function isClaimOrphanEnabled(): boolean {
  const v = (process.env.AUTH_CLAIM_ORPHAN_ORG ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Ensure the auth user has an org membership.
 * Order:
 * 1) Pending phone invite → join that org (Wave 2; Sol.52 ≠ Harihar stay separate)
 * 2) Existing membership
 * 3) Optional orphan claim (AUTH_CLAIM_ORPHAN_ORG=true only)
 * 4) Create new organization as company_admin
 */
export async function ensureOrgMembershipForUser(input: {
  userId: string;
  phone: string;
  companyName?: string | null;
}): Promise<MembershipResult | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  // 1) Invite first — employee never creates / claims another company.
  const pendingInvite = await findPendingInviteForPhone(input.phone);
  if (pendingInvite) {
    const joined = await acceptInviteForUser({ invite: pendingInvite, userId: input.userId });
    if (joined) {
      return {
        organizationId: joined.organizationId,
        orgRole: joined.orgRole,
        organizationName: joined.organizationName,
        createdOrg: false,
        claimedExistingOrg: false,
        joinedViaInvite: true,
      };
    }
  }

  const { data: existing, error: memErr } = await admin
    .from("organization_members")
    .select("organization_id, role, organizations(id, name)")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memErr) {
    console.warn("[auth] membership lookup:", memErr.message);
  }

  if (existing?.organization_id) {
    const orgs = existing.organizations as { id?: string; name?: string } | { id?: string; name?: string }[] | null;
    const orgRow = Array.isArray(orgs) ? orgs[0] : orgs;
    const role = existing.role === "company_admin" ? "company_admin" : "employee";
    return {
      organizationId: String(existing.organization_id),
      orgRole: role,
      organizationName: orgRow?.name ?? null,
      createdOrg: false,
      claimedExistingOrg: false,
      joinedViaInvite: false,
    };
  }

  // 3) Orphan claim only when explicitly enabled (avoids Sol.52 staff claiming Harihar).
  if (isClaimOrphanEnabled()) {
    const claimed = await claimOrphanOrganization(input.userId);
    if (claimed) return { ...claimed, joinedViaInvite: false };
  }

  const digits = phoneDigitsForCompare(input.phone).slice(-10) || "new";
  const name =
    (input.companyName ?? "").trim() ||
    `Solar Company ${digits.slice(-4)}`;
  const slug = await uniqueSlug(slugify(name));

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      name,
      slug,
      status: "active",
    })
    .select("id, name")
    .single();

  if (orgErr || !org) {
    console.warn("[auth] create org failed:", orgErr?.message);
    return null;
  }

  const { error: joinErr } = await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: input.userId,
    role: "company_admin",
  });

  if (joinErr) {
    console.warn("[auth] create membership failed:", joinErr.message);
    return null;
  }

  try {
    await resolveOrgBilling(String(org.id), { verified_phone: input.phone });
  } catch (e) {
    console.warn("[auth] trial bootstrap:", e instanceof Error ? e.message : e);
  }

  return {
    organizationId: String(org.id),
    orgRole: "company_admin",
    organizationName: String(org.name),
    createdOrg: true,
    claimedExistingOrg: false,
    joinedViaInvite: false,
  };
}

async function claimOrphanOrganization(userId: string): Promise<Omit<MembershipResult, "joinedViaInvite"> | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(20);

  if (!orgs?.length) return null;

  for (const org of orgs) {
    const { count, error } = await admin
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id);

    if (error) continue;
    if ((count ?? 0) > 0) continue;

    const { error: joinErr } = await admin.from("organization_members").insert({
      organization_id: org.id,
      user_id: userId,
      role: "company_admin",
    });
    if (joinErr) {
      console.warn("[auth] claim org failed:", joinErr.message);
      continue;
    }

    return {
      organizationId: String(org.id),
      orgRole: "company_admin",
      organizationName: org.name ? String(org.name) : null,
      createdOrg: false,
      claimedExistingOrg: true,
    };
  }

  return null;
}
