import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase, resolveLeadsTable } from "@/lib/supabase";
import type { OrgScope } from "@/lib/auth/org-scope";
import type { NextRequest } from "next/server";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";

export type WorkRole = "office_sales" | "field_staff" | "hybrid";

type OwnedResource = {
  organization_id?: string | null;
  assigned_to_user_id?: string | null;
};

export function employeeAssignmentUserId(scope: OrgScope): string | null {
  return scope.session?.orgRole === "employee" ? scope.session.userId : null;
}

export function assigneeForCreate(scope: OrgScope, requested?: string | null): string | null {
  if (!scope.session) return requested ?? null;
  if (scope.session.orgRole === "employee") return scope.session.userId;
  return requested ?? null;
}

export function mayChooseAssignee(scope: OrgScope): boolean {
  return scope.session?.orgRole === "company_admin";
}

export async function isOrganizationMemberUser(organizationId: string, userId: string): Promise<boolean> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return false;
  const { data, error } = await client
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function getOrganizationMemberWorkRole(
  organizationId: string,
  userId: string
): Promise<WorkRole | null> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return null;
  const { data, error } = await client
    .from("organization_members")
    .select("work_role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const value = String(data.work_role ?? "office_sales");
  return value === "field_staff" || value === "hybrid" ? value : "office_sales";
}

function denied(row: OwnedResource | null, scope: OrgScope): NextResponse | null {
  if (!row) {
    return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
  }
  if (scope.mode !== "session" || !scope.session) return null;
  if (String(row.organization_id ?? "") !== scope.session.organizationId) {
    return NextResponse.json({ ok: false, error: "This record belongs to another organization.", code: "org_forbidden" }, { status: 403 });
  }
  if (scope.session.orgRole === "company_admin") return null;
  if (String(row.assigned_to_user_id ?? "") === scope.session.userId) return null;
  return NextResponse.json(
    { ok: false, error: "This record is assigned to another employee.", code: "assignment_forbidden" },
    { status: 403 }
  );
}

async function readOwned(table: string, id: string): Promise<OwnedResource | null> {
  const client = createSupabaseAdmin() ?? supabase;
  if (!client) return null;
  const result = await client
    .from(table)
    .select("organization_id, assigned_to_user_id")
    .eq("id", id)
    .maybeSingle();
  if (result.error) {
    if (/assigned_to_user_id|column/i.test(result.error.message)) {
      return { organization_id: null, assigned_to_user_id: null };
    }
    return null;
  }
  return result.data as OwnedResource | null;
}

export async function denyIfCannotAccessLead(leadId: string, scope: OrgScope): Promise<NextResponse | null> {
  const table = await resolveLeadsTable();
  if (!table) return NextResponse.json({ ok: false, error: "Leads table unavailable." }, { status: 503 });
  return denied(await readOwned(table, leadId), scope);
}

/**
 * Operational access is intentionally wider than sales ownership. Field and
 * hybrid members may work on any lead in their organization, but callers must
 * expose only survey/visit/note/document operations—not sales pricing/status.
 */
export async function denyIfCannotAccessLeadFieldWork(
  leadId: string,
  scope: OrgScope
): Promise<NextResponse | null> {
  const table = await resolveLeadsTable();
  if (!table) return NextResponse.json({ ok: false, error: "Leads table unavailable." }, { status: 503 });
  const row = await readOwned(table, leadId);
  const baseDenied = denied(row, scope);
  if (!baseDenied) return null;
  if (scope.mode !== "session" || !scope.session || !row) return baseDenied;
  if (String(row.organization_id ?? "") !== scope.session.organizationId) return baseDenied;
  const workRole = await getOrganizationMemberWorkRole(scope.session.organizationId, scope.session.userId);
  if (workRole === "field_staff" || workRole === "hybrid") return null;
  return baseDenied;
}

export async function denyIfCannotAccessProject(projectId: string, scope: OrgScope): Promise<NextResponse | null> {
  return denied(await readOwned("projects", projectId), scope);
}

export async function authorizeLeadRequest(req: NextRequest, leadId: string): Promise<NextResponse | null> {
  const scope = await resolveOrgScope(req);
  return denyIfStrictUnauthenticated(scope) ?? await denyIfCannotAccessLead(leadId, scope);
}

export async function authorizeLeadFieldRequest(req: NextRequest, leadId: string): Promise<NextResponse | null> {
  const scope = await resolveOrgScope(req);
  return denyIfStrictUnauthenticated(scope) ?? await denyIfCannotAccessLeadFieldWork(leadId, scope);
}

export async function authorizeProjectRequest(req: NextRequest, projectId: string): Promise<NextResponse | null> {
  const scope = await resolveOrgScope(req);
  return denyIfStrictUnauthenticated(scope) ?? await denyIfCannotAccessProject(projectId, scope);
}
