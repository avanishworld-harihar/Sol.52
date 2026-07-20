/**
 * Keep CRM Won and proposal Approved in sync so operators mark Won once.
 *
 * - Lead → won: approve the latest linked proposal (status only; project already ensured).
 * - Proposal → approved: bump lead to won (project via bumpLeadStatus / ensureProject).
 */

import { bumpLeadStatus } from "@/lib/supabase";
import { normalizeLeadStatus } from "@/lib/lead-status";
import { updateProposalStatus, type ProposalListItem } from "@/lib/proposals-store";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { normalizeProposalStatus } from "@/lib/proposal-status";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

/** Latest proposal for a lead (by generated_at), or null. */
export async function getLatestProposalForLead(
  leadId: string
): Promise<Pick<ProposalListItem, "id" | "proposal_status" | "customer_name"> | null> {
  const client = db();
  const id = leadId.trim();
  if (!client || !id) return null;

  const { data, error } = await client
    .from("proposals")
    .select("id, proposal_status, customer_name, generated_at")
    .eq("lead_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: String(data.id),
    proposal_status: normalizeProposalStatus(
      typeof data.proposal_status === "string" ? data.proposal_status : "draft"
    ),
    customer_name: String(data.customer_name ?? ""),
  };
}

/**
 * When a lead is marked Won, mark their latest proposal Approved so it appears
 * under Proposals → Won. Idempotent if already approved. Does not re-enter lead sync.
 */
export async function approveLatestProposalForLead(leadId: string): Promise<string | null> {
  const latest = await getLatestProposalForLead(leadId);
  if (!latest) return null;
  if (latest.proposal_status === "approved") return latest.id;
  const ok = await updateProposalStatus(latest.id, "approved");
  return ok ? latest.id : null;
}

/**
 * When a proposal is Approved, ensure the CRM lead is Won (and project exists).
 * Safe to call repeatedly.
 */
export async function syncLeadWonFromProposalApproval(
  leadId: string | null | undefined
): Promise<void> {
  const id = leadId?.trim();
  if (!id) return;

  const client = db();
  if (!client) return;

  try {
    const { resolveLeadsTable } = await import("@/lib/supabase");
    const leadsTable = await resolveLeadsTable();
    if (!leadsTable) return;
    const { data } = await client.from(leadsTable).select("status").eq("id", id).maybeSingle();
    const current = normalizeLeadStatus(String((data as { status?: string } | null)?.status ?? ""));
    if (current === "won") return;
    await bumpLeadStatus(id, "won");
  } catch (err) {
    console.warn(
      "[proposal-won-sync] syncLeadWonFromProposalApproval:",
      err instanceof Error ? err.message : err
    );
  }
}
