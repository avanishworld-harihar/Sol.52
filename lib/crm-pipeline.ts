import { appendActivityEvent } from "@/lib/followup-store";
import { normalizeLeadStatus, type LeadStatusKey } from "@/lib/lead-status";
import { bumpLeadStatus, resolveLeadsTable } from "@/lib/supabase";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

/** Call outcomes that count as successful contact for New → Contacted auto-bump. */
const CONTACT_ON_CALL_OUTCOMES = new Set(["answered", "interested", "followup_required"]);

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export async function recordLeadStageTransition(
  leadId: string,
  fromStage: string,
  toStage: LeadStatusKey,
  options?: { occurredAt?: string; meta?: Record<string, unknown> }
): Promise<void> {
  const ts = options?.occurredAt ?? new Date().toISOString();
  const meta = { from: fromStage, to: toStage, ...options?.meta };

  void Promise.all([
    appendActivityEvent({
      leadId,
      eventType: "status_changed",
      occurredAt: ts,
      meta,
    }),
    appendActivityEvent({
      leadId,
      eventType: "pipeline_stage_changed",
      occurredAt: ts,
      meta,
    }),
    (async () => {
      const client = db();
      if (!client) return;
      try {
        await client.from("pipeline_history").insert({
          lead_id: leadId,
          from_stage: fromStage,
          to_stage: toStage,
          changed_at: ts,
        });
      } catch {
        /* best-effort */
      }
    })(),
  ]);
}

/**
 * After a manual call log: if lead is New and outcome indicates contact,
 * bump pipeline to Contacted and write timeline + pipeline history.
 */
export async function maybeAutoBumpLeadToContacted(
  leadId: string,
  callOutcome: string,
  occurredAt?: string
): Promise<{ from: LeadStatusKey; to: LeadStatusKey } | null> {
  if (!CONTACT_ON_CALL_OUTCOMES.has(callOutcome)) return null;

  const client = db();
  if (!client) return null;
  const leadsTable = await resolveLeadsTable();
  if (!leadsTable) return null;

  const { data: cur } = await client.from(leadsTable).select("status").eq("id", leadId).maybeSingle();
  if (!cur) return null;

  const prevStatus = normalizeLeadStatus(String(cur.status ?? "new"));
  if (prevStatus !== "new") return null;

  const nextStatus: LeadStatusKey = "contacted";
  const updated = await bumpLeadStatus(leadId, nextStatus);
  if (!updated) return null;

  await recordLeadStageTransition(leadId, prevStatus, nextStatus, {
    occurredAt,
    meta: { source: "call_logged", callOutcome },
  });

  return { from: prevStatus, to: nextStatus };
}
