/**
 * Design / SLD plan gates for project-scoped APIs.
 * Soft-off when BILLING_ENFORCE=false (same as proposal entitlements).
 * Platform admin / super-admin session bypasses the org plan gate (founder tooling).
 */

import type { NextRequest } from "next/server";
import { isAdminRequestAllowed } from "@/lib/admin-access";
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

/** Platform operator (admin cookie) can use Design/SLD regardless of tenant plan. */
async function isPlatformAdminBypass(req?: NextRequest | null): Promise<boolean> {
  if (!req) return false;
  try {
    return await isAdminRequestAllowed(req);
  } catch {
    return false;
  }
}

export async function assertProjectDesignStudioAccess(
  projectId: string,
  req?: NextRequest | null
): Promise<void> {
  if (!isBillingEnforced()) return;
  if (await isPlatformAdminBypass(req)) return;
  if (!(await isBillingAvailable())) return;
  const orgId = await orgIdForProject(projectId);
  if (!orgId) return;
  const sub = await getActiveOrgSubscription(orgId);
  if (!sub) return;
  assertDesignStudioEntitlement(sub);
}

export async function assertProjectSldAccess(
  projectId: string,
  req?: NextRequest | null
): Promise<void> {
  if (!isBillingEnforced()) return;
  if (await isPlatformAdminBypass(req)) return;
  if (!(await isBillingAvailable())) return;
  const orgId = await orgIdForProject(projectId);
  if (!orgId) return;
  const sub = await getActiveOrgSubscription(orgId);
  if (!sub) return;
  /** SLD requires Design base + SLD flag. */
  assertDesignStudioEntitlement(sub);
  assertSldEntitlement(sub);
}
