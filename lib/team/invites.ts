import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizePhoneE164, phoneDigitsForCompare } from "@/lib/auth/phone";
import type { OrgRole } from "@/lib/auth/session";
import { countOrgMembers } from "@/lib/billing/team";
import {
  assertCanAddTeamMember,
} from "@/lib/billing/entitlements";
import { isBillingEntitlementError } from "@/lib/billing/errors";
import { getOrgSubscription } from "@/lib/billing/subscription-store";

export type OrgInviteRow = {
  id: string;
  organization_id: string;
  phone_e164: string;
  phone_digits: string;
  role: OrgRole;
  work_role?: WorkRole;
  status: "pending" | "accepted" | "cancelled" | "expired";
  invited_by_user_id: string | null;
  created_at: string;
  expires_at: string | null;
  note: string | null;
};

export type OrgMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  work_role?: WorkRole;
  created_at: string;
  phone?: string | null;
  lead_count?: number;
  project_count?: number;
};

export type WorkRole = "office_sales" | "field_staff" | "hybrid";

export type TeamWorkSummary = {
  unassignedLeads: number;
  unassignedProjects: number;
};

function db() {
  return createSupabaseAdmin();
}

export async function countPendingInvites(organizationId: string): Promise<number> {
  const client = db();
  if (!client) return 0;
  const { count, error } = await client
    .from("organization_invites")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "pending");
  if (error) {
    console.warn("[team] countPendingInvites:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function listOrgMembers(organizationId: string): Promise<OrgMemberRow[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client
    .from("organization_members")
    .select("id, organization_id, user_id, role, work_role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.warn("[team] listOrgMembers:", error.message);
    return [];
  }

  const members = data as OrgMemberRow[];
  const [leadCounts, projectCounts] = await Promise.all([
    countOwnedRows("leads", organizationId),
    countOwnedRows("projects", organizationId),
  ]);
  const withWorkload = (member: OrgMemberRow, phone?: string | null): OrgMemberRow => ({
    ...member,
    phone: phone ?? member.phone ?? null,
    lead_count: leadCounts.get(member.user_id) ?? 0,
    project_count: projectCounts.get(member.user_id) ?? 0,
  });
  // Best-effort phone from auth.users
  try {
    const phones = new Map<string, string>();
    let page = 1;
    for (;;) {
      const { data: pageData, error: listErr } = await client.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (listErr) break;
      for (const u of pageData?.users ?? []) {
        if (u.phone) phones.set(u.id, u.phone);
      }
      if ((pageData?.users?.length ?? 0) < 200) break;
      page += 1;
      if (page > 10) break;
    }
    return members.map((m) => withWorkload(m, phones.get(m.user_id)));
  } catch {
    return members.map((m) => withWorkload(m));
  }
}

async function countOwnedRows(table: "leads" | "projects", organizationId: string): Promise<Map<string, number>> {
  const client = db();
  const counts = new Map<string, number>();
  if (!client) return counts;
  const { data, error } = await client
    .from(table)
    .select("assigned_to_user_id")
    .eq("organization_id", organizationId)
    .not("assigned_to_user_id", "is", null)
    .limit(20_000);
  if (error) return counts;
  for (const row of data ?? []) {
    const userId = row.assigned_to_user_id ? String(row.assigned_to_user_id) : "";
    if (userId) counts.set(userId, (counts.get(userId) ?? 0) + 1);
  }
  return counts;
}

export async function getTeamWorkSummary(organizationId: string): Promise<TeamWorkSummary> {
  const client = db();
  if (!client) return { unassignedLeads: 0, unassignedProjects: 0 };
  const [leads, projects] = await Promise.all([
    client.from("leads").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("assigned_to_user_id", null),
    client.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("assigned_to_user_id", null),
  ]);
  return {
    unassignedLeads: leads.error ? 0 : leads.count ?? 0,
    unassignedProjects: projects.error ? 0 : projects.count ?? 0,
  };
}

export async function listPendingInvites(organizationId: string): Promise<OrgInviteRow[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client
    .from("organization_invites")
    .select(
      "id, organization_id, phone_e164, phone_digits, role, work_role, status, invited_by_user_id, created_at, expires_at, note"
    )
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) console.warn("[team] listPendingInvites:", error.message);
    return [];
  }
  return data as OrgInviteRow[];
}

export async function createPhoneInvite(input: {
  organizationId: string;
  phone: string;
  role?: OrgRole;
  workRole?: WorkRole;
  invitedByUserId: string;
  note?: string | null;
}): Promise<{ invite: OrgInviteRow } | { error: string; status: number; code?: string }> {
  const phone = normalizePhoneE164(input.phone);
  if (!phone) return { error: "Enter a valid mobile number.", status: 400 };

  const client = db();
  if (!client) return { error: "Database unavailable.", status: 503 };

  const role: OrgRole = input.role === "company_admin" ? "company_admin" : "employee";
  const digits = phoneDigitsForCompare(phone);

  try {
    await assertCanAddTeamMember({ organizationId: input.organizationId });
  } catch (e) {
    if (isBillingEntitlementError(e)) {
      return { error: e.message, status: 402, code: e.code };
    }
    throw e;
  }

  const memberCount = await countOrgMembers(input.organizationId);
  const pendingCount = await countPendingInvites(input.organizationId);
  const sub = await getOrgSubscription(input.organizationId);
  const maxUsers = sub?.plan.max_users ?? sub?.plan.features.max_users ?? 1;
  if (sub?.plan.features.team_members_enabled && memberCount + pendingCount >= maxUsers) {
    return {
      error: `Team seat limit reached (${maxUsers}), including pending invites.`,
      status: 402,
      code: "team_limit_reached",
    };
  }

  // Already a member with this phone?
  const members = await listOrgMembers(input.organizationId);
  for (const m of members) {
    if (m.phone && phoneDigitsForCompare(m.phone) === digits) {
      return { error: "This phone is already a team member.", status: 409 };
    }
  }

  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + 14);

  const { data, error } = await client
    .from("organization_invites")
    .insert({
      organization_id: input.organizationId,
      phone_e164: phone,
      phone_digits: digits,
      role,
      work_role: input.workRole ?? "office_sales",
      status: "pending",
      invited_by_user_id: input.invitedByUserId,
      note: input.note?.trim() || null,
      expires_at: expires.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, organization_id, phone_e164, phone_digits, role, work_role, status, invited_by_user_id, created_at, expires_at, note"
    )
    .single();

  if (error) {
    if (/organization_invites_org_phone_pending_unique|duplicate key/i.test(error.message)) {
      return { error: "A pending invite already exists for this phone.", status: 409 };
    }
    if (/relation.*does not exist|Could not find the table/i.test(error.message)) {
      return {
        error: "Invites table missing. Run migration 076_organization_invites.sql in Supabase.",
        status: 503,
      };
    }
    return { error: error.message, status: 500 };
  }

  return { invite: data as OrgInviteRow };
}

export async function cancelInvite(input: {
  organizationId: string;
  inviteId: string;
}): Promise<{ ok: true } | { error: string; status: number }> {
  const client = db();
  if (!client) return { error: "Database unavailable.", status: 503 };

  const { data, error } = await client
    .from("organization_invites")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", input.inviteId)
    .eq("organization_id", input.organizationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message, status: 500 };
  if (!data) return { error: "Invite not found.", status: 404 };
  return { ok: true };
}

export async function removeOrgMember(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  reassignToUserId?: string | null;
}): Promise<{ ok: true; leadsMoved: number; projectsMoved: number; fieldAssignmentsMoved: number } | { error: string; status: number }> {
  const client = db();
  if (!client) return { error: "Database unavailable.", status: 503 };

  const { data: row, error: findErr } = await client
    .from("organization_members")
    .select("id, user_id, role")
    .eq("id", input.memberId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (findErr) return { error: findErr.message, status: 500 };
  if (!row) return { error: "Member not found.", status: 404 };
  if (row.user_id === input.actorUserId) {
    return { error: "You cannot remove yourself.", status: 400 };
  }

  // Keep at least one company_admin
  if (row.role === "company_admin") {
    const { count } = await client
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .eq("role", "company_admin");
    if ((count ?? 0) <= 1) {
      return { error: "Cannot remove the last company admin.", status: 400 };
    }
  }

  const { data, error } = await client.rpc("sol52_offboard_member", {
    p_org_id: input.organizationId,
    p_member_id: input.memberId,
    p_actor_user_id: input.actorUserId,
    p_reassign_to_user_id: input.reassignToUserId ?? null,
  });
  if (error) {
    if (/sol52_offboard_member|schema cache|does not exist/i.test(error.message)) {
      return { error: "Safe handover migration is missing. Run migration 100 before removing a member.", status: 503 };
    }
    return { error: error.message, status: 400 };
  }
  const result = (data ?? {}) as { leads_moved?: number; projects_moved?: number; field_assignments_moved?: number };
  return {
    ok: true,
    leadsMoved: result.leads_moved ?? 0,
    projectsMoved: result.projects_moved ?? 0,
    fieldAssignmentsMoved: result.field_assignments_moved ?? 0,
  };
}

export async function updateOrgMemberWorkRole(input: {
  organizationId: string;
  memberId: string;
  workRole: WorkRole;
}): Promise<{ ok: true } | { error: string; status: number }> {
  const client = createSupabaseAdmin();
  if (!client) return { error: "Database admin client is not configured.", status: 503 };
  const { data, error } = await client
    .from("organization_members")
    .update({ work_role: input.workRole })
    .eq("id", input.memberId)
    .eq("organization_id", input.organizationId)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message, status: 400 };
  if (!data) return { error: "Team member not found.", status: 404 };
  return { ok: true };
}

export async function updateOrgMemberRole(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  role: OrgRole;
}): Promise<{ ok: true } | { error: string; status: number }> {
  const client = createSupabaseAdmin();
  if (!client) return { error: "Database admin client is not configured.", status: 503 };

  const { data: member, error: lookupError } = await client
    .from("organization_members")
    .select("id, user_id, role")
    .eq("id", input.memberId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message, status: 400 };
  if (!member) return { error: "Team member not found.", status: 404 };

  if (member.role === "company_admin" && input.role === "employee") {
    const { count } = await client
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", input.organizationId)
      .eq("role", "company_admin");
    if ((count ?? 0) <= 1) {
      return { error: "Cannot demote the last company admin.", status: 400 };
    }
  }

  const { error } = await client
    .from("organization_members")
    .update({ role: input.role })
    .eq("id", input.memberId)
    .eq("organization_id", input.organizationId);
  if (error) return { error: error.message, status: 400 };
  return { ok: true };
}

/**
 * Find a pending invite for this phone (any org). Oldest first.
 */
export async function findPendingInviteForPhone(rawPhone: string): Promise<OrgInviteRow | null> {
  const phone = normalizePhoneE164(rawPhone);
  if (!phone) return null;
  const digits = phoneDigitsForCompare(phone);
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from("organization_invites")
    .select(
      "id, organization_id, phone_e164, phone_digits, role, work_role, status, invited_by_user_id, created_at, expires_at, note"
    )
    .eq("phone_digits", digits)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!/relation.*does not exist|Could not find the table/i.test(error.message)) {
      console.warn("[team] findPendingInviteForPhone:", error.message);
    }
    return null;
  }
  if (!data) return null;

  const invite = data as OrgInviteRow;
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    await client
      .from("organization_invites")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", invite.id);
    return null;
  }
  return invite;
}

export async function acceptInviteForUser(input: {
  invite: OrgInviteRow;
  userId: string;
}): Promise<{
  organizationId: string;
  orgRole: OrgRole;
  organizationName: string | null;
} | null> {
  const client = db();
  if (!client) return null;

  const role: OrgRole = input.invite.role === "company_admin" ? "company_admin" : "employee";

  const { error: joinErr } = await client.from("organization_members").insert({
    organization_id: input.invite.organization_id,
    user_id: input.userId,
    role,
    work_role: input.invite.work_role ?? "office_sales",
  });

  if (joinErr) {
    if (!/duplicate key|organization_members_org_user_unique/i.test(joinErr.message)) {
      console.warn("[team] acceptInvite join:", joinErr.message);
      return null;
    }
  }

  await client
    .from("organization_invites")
    .update({
      status: "accepted",
      accepted_user_id: input.userId,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.invite.id)
    .eq("status", "pending");

  const { data: org } = await client
    .from("organizations")
    .select("id, name")
    .eq("id", input.invite.organization_id)
    .maybeSingle();

  return {
    organizationId: input.invite.organization_id,
    orgRole: role,
    organizationName: org?.name ? String(org.name) : null,
  };
}
