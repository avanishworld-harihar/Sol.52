/**
 * Design / SLD plan gates for project-scoped APIs.
 * Soft-off when BILLING_ENFORCE=false (same as proposal entitlements).
 */

import {
  assertDesignStudioEntitlement,
  assertSldEntitlement,
  isBillingAvailable,
} from "@/lib/billing/entitlements";
import { getActiveOrgSubscription } from "@/lib/billing/subscription-lifecycle";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function isBillingEnforced(): boolean {
  if (process.env.BILLING_ENFORCE === "false" || process.env.BILLING_ENFORCE === "0") {
    return false;
  }
  return true;
}

async function orgIdForProject(projectId: string): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client
    .from("projects")
    .select("organization_id")
    .eq("id", projectId)
    .maybeSingle();
  return data?.organization_id != null ? String(data.organization_id) : null;
}

export async function assertProjectDesignStudioAccess(projectId: string): Promise<void> {
  if (!isBillingEnforced()) return;
  if (!(await isBillingAvailable())) return;
  const orgId = await orgIdForProject(projectId);
  if (!orgId) return;
  const sub = await getActiveOrgSubscription(orgId);
  if (!sub) return;
  assertDesignStudioEntitlement(sub);
}

export async function assertProjectSldAccess(projectId: string): Promise<void> {
  if (!isBillingEnforced()) return;
  if (!(await isBillingAvailable())) return;
  const orgId = await orgIdForProject(projectId);
  if (!orgId) return;
  const sub = await getActiveOrgSubscription(orgId);
  if (!sub) return;
  /** SLD requires Design base + SLD flag. */
  assertDesignStudioEntitlement(sub);
  assertSldEntitlement(sub);
}
