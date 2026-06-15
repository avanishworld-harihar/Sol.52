import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { currentPeriodYyyyMm } from "@/lib/billing/plan-utils";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

function isMissingTableError(message: string): boolean {
  return /relation.*does not exist|Could not find the table/i.test(message);
}

export async function getMonthlyUsage(
  organizationId: string,
  period = currentPeriodYyyyMm()
): Promise<number> {
  const client = db();
  if (!client) return 0;

  const { data, error } = await client
    .from("organization_usage")
    .select("proposals_created")
    .eq("organization_id", organizationId)
    .eq("period_yyyy_mm", period)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error.message)) {
      console.warn("[billing] getMonthlyUsage:", error.message);
    }
    return 0;
  }
  return Number((data as { proposals_created?: number } | null)?.proposals_created) || 0;
}

export async function incrementProposalUsage(organizationId: string): Promise<number> {
  const client = db();
  if (!client) return 0;

  const period = currentPeriodYyyyMm();
  const now = new Date().toISOString();

  const { data: existing } = await client
    .from("organization_usage")
    .select("id, proposals_created")
    .eq("organization_id", organizationId)
    .eq("period_yyyy_mm", period)
    .maybeSingle();

  if (existing) {
    const next = (Number((existing as { proposals_created?: number }).proposals_created) || 0) + 1;
    await client
      .from("organization_usage")
      .update({ proposals_created: next, updated_at: now })
      .eq("id", (existing as { id: string }).id);
    return next;
  }

  const { data: inserted, error } = await client
    .from("organization_usage")
    .insert({
      organization_id: organizationId,
      period_yyyy_mm: period,
      proposals_created: 1,
      updated_at: now,
    })
    .select("proposals_created")
    .single();

  if (error) {
    if (!isMissingTableError(error.message)) {
      console.warn("[billing] incrementProposalUsage:", error.message);
    }
    return 0;
  }
  return Number((inserted as { proposals_created?: number })?.proposals_created) || 1;
}

export async function logBillingEvent(input: {
  organizationId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const client = db();
  if (!client) return;

  const { error } = await client.from("billing_events").insert({
    organization_id: input.organizationId ?? null,
    event_type: input.eventType,
    payload: input.payload ?? {},
  });

  if (error && !isMissingTableError(error.message)) {
    console.warn("[billing] logBillingEvent:", error.message);
  }
}
