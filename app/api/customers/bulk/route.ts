import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { denyIfCrossOrg, denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";
import { fetchLeadOrgId } from "@/lib/auth/resource-org";
import { appendActivityEvent, createLeadReminder, updateLeadReminder } from "@/lib/followup-store";
import { LEAD_STATUS_KEYS } from "@/lib/lead-status";
import { batchNextFollowups, bumpLeadStatus } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const bulkSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    leadIds: z.array(z.string().min(1)).min(1).max(50),
    status: z.enum(LEAD_STATUS_KEYS),
  }),
  z.object({
    action: z.literal("callback"),
    leadIds: z.array(z.string().min(1)).min(1).max(50),
    dueAt: z.string().datetime(),
    title: z.string().min(1).max(200),
    notes: z.string().max(1_000).optional().nullable(),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  }),
]);

type BulkResult = { leadId: string; ok: boolean; error?: string };

async function runWithLimit<T, R>(
  values: T[],
  limit: number,
  worker: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function consume() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await worker(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => consume()));
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const scope = await resolveOrgScope(req);
    const deniedAuth = denyIfStrictUnauthenticated(scope);
    if (deniedAuth) return deniedAuth;

    const parsed = bulkSchema.parse(await req.json());
    const leadIds = [...new Set(parsed.leadIds.map((id) => decodeURIComponent(id).trim()).filter(Boolean))];
    if (leadIds.length === 0) {
      return NextResponse.json({ ok: false, error: "Select at least one customer." }, { status: 400 });
    }

    // Check every resource before the first write so a mixed-org selection can
    // never partially mutate another tenant's records.
    const orgIds = await runWithLimit(leadIds, 8, fetchLeadOrgId);
    for (const orgId of orgIds) {
      const deniedOrg = denyIfCrossOrg(orgId, scope);
      if (deniedOrg) return deniedOrg;
    }

    let results: BulkResult[];
    if (parsed.action === "status") {
      results = await runWithLimit(leadIds, 5, async (leadId) => {
        try {
          const updated = await bumpLeadStatus(leadId, parsed.status);
          if (!updated) return { leadId, ok: false, error: "Customer could not be updated." };
          void Promise.all([
            appendActivityEvent({
              leadId,
              eventType: "status_changed",
              meta: { to: parsed.status, source: "bulk_action" },
            }),
            appendActivityEvent({
              leadId,
              eventType: "pipeline_stage_changed",
              meta: { to: parsed.status, source: "bulk_action" },
            }),
          ]);
          return { leadId, ok: true };
        } catch (error) {
          return { leadId, ok: false, error: error instanceof Error ? error.message : "Update failed." };
        }
      });
    } else {
      const pendingByLead = await batchNextFollowups(leadIds);
      results = await runWithLimit(leadIds, 6, async (leadId) => {
        try {
          const existing = pendingByLead[leadId];
          const reminder = existing
            ? await updateLeadReminder(existing.id, {
                title: parsed.title,
                due_at: parsed.dueAt,
                priority: parsed.priority,
                followup_type: "call",
                status: "pending",
                notes: parsed.notes ?? null,
                snoozed_until: null,
              })
            : await createLeadReminder({
                lead_id: leadId,
                proposal_id: null,
                project_id: null,
                title: parsed.title,
                due_at: parsed.dueAt,
                priority: parsed.priority,
                followup_type: "call",
                status: "pending",
                notes: parsed.notes ?? null,
                snoozed_until: null,
              });
          if (!reminder) return { leadId, ok: false, error: "Callback could not be scheduled." };
          void appendActivityEvent({
            leadId,
            eventType: existing ? "followup_snoozed" : "followup_created",
            meta: {
              reminderId: reminder.id,
              dueAt: reminder.due_at,
              followupType: "call",
              source: "bulk_action",
            },
          });
          return { leadId, ok: true };
        } catch (error) {
          return { leadId, ok: false, error: error instanceof Error ? error.message : "Callback failed." };
        }
      });
    }

    const succeeded = results.filter((result) => result.ok).length;
    const failed = results.length - succeeded;
    return NextResponse.json({
      ok: failed === 0,
      partial: succeeded > 0 && failed > 0,
      data: { succeeded, failed, results },
      ...(failed > 0 ? { error: `${failed} customer${failed === 1 ? "" : "s"} could not be updated.` } : {}),
    }, { status: succeeded === 0 ? 400 : 200 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join(", ")
      : error instanceof Error
        ? error.message
        : "Bulk action failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
