import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase, resolveLeadsTable } from "@/lib/supabase";
import type { OrgScope } from "@/lib/auth/org-scope";

function db(): SupabaseClient | null {
  return createSupabaseAdmin() ?? supabase;
}

export async function fetchLeadOrgId(leadId: string): Promise<string | null> {
  const client = db();
  if (!client || !leadId) return null;
  const table = await resolveLeadsTable();
  if (!table) return null;
  const { data, error } = await client.from(table).select("organization_id").eq("id", leadId).maybeSingle();
  if (error || !data) return null;
  const org = (data as { organization_id?: string | null }).organization_id;
  return org ? String(org) : null;
}

export async function fetchProjectOrgId(projectId: string): Promise<string | null> {
  const client = db();
  if (!client || !projectId) return null;
  const { data, error } = await client
    .from("projects")
    .select("organization_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error || !data) return null;
  const org = (data as { organization_id?: string | null }).organization_id;
  return org ? String(org) : null;
}

export async function fetchProposalOrgId(proposalId: string): Promise<string | null> {
  const client = db();
  if (!client || !proposalId) return null;
  const { data, error } = await client
    .from("proposals")
    .select("organization_id")
    .eq("id", proposalId)
    .maybeSingle();
  if (error || !data) return null;
  const org = (data as { organization_id?: string | null }).organization_id;
  return org ? String(org) : null;
}

/** Stamp organization_id on insert payloads when scope has an org. */
export function withOrganizationId<T extends Record<string, unknown>>(
  payload: T,
  scope: OrgScope
): T & { organization_id?: string } {
  if (!scope.organizationId) return payload;
  return { ...payload, organization_id: scope.organizationId };
}
