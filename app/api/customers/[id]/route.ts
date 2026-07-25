import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { mapCustomerRow } from "@/lib/customers-map";
import { appendActivityEvent } from "@/lib/followup-store";
import { LEAD_STATUS_KEYS } from "@/lib/lead-status";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { bumpLeadStatus, supabase, resolveLeadsTable } from "@/lib/supabase";
import {
  ensureProjectForWonLead,
  isWonLeadStatus,
} from "@/lib/project-store";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    const db = createSupabaseAdmin() ?? supabase;
    if (!db) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    const leadsTable = await resolveLeadsTable();
    if (!leadsTable) return NextResponse.json({ ok: false, error: "leads_table_missing" }, { status: 500 });
    const { data, error } = await db.from(leadsTable).select("*").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ ok: false, error: "lead_not_found" }, { status: 404 });
    const mapped = mapCustomerRow(data as Record<string, unknown>);
    if (isWonLeadStatus(mapped.status)) {
      await ensureProjectForWonLead(id, {
        name: mapped.name,
        consumer_name: mapped.consumer_name,
        city: mapped.city,
      });
    }
    return NextResponse.json({ ok: true, data: mapped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Get failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** PostgREST / Postgres: column not present on this deploy (migrations not run). */
function missingColumnFromPgError(message: string): string | null {
  const m = /Could not find the '([^']+)' column/i.exec(message);
  return m?.[1] ?? null;
}

/**
 * Update `leads` with optional v2 columns — drop any key PostgREST rejects so
 * edit-lead works on older DBs (e.g. before `consumer_id` / `survey_status`).
 */
async function updateLeadAdaptive(
  db: SupabaseClient,
  table: string,
  leadId: string,
  payload: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  let attempt = { ...payload };
  for (let guard = 0; guard < 40 && Object.keys(attempt).length > 0; guard++) {
    const { data, error } = await db.from(table).update(attempt).eq("id", leadId).select("*").single();
    if (!error && data) {
      return { data: data as Record<string, unknown>, error: null };
    }
    const msg = error?.message ?? "";
    const miss = missingColumnFromPgError(msg);
    if (miss && miss in attempt) {
      delete attempt[miss];
      continue;
    }
    if (/last_touched_at/i.test(msg) && "last_touched_at" in attempt) {
      delete attempt.last_touched_at;
      continue;
    }
    return { data: null, error: msg || "Lead update failed" };
  }
  return { data: null, error: "Lead update exhausted retries" };
}

const patchSchema = z
  .object({
    status: z.enum(LEAD_STATUS_KEYS).optional(),
    name: z.string().min(1).max(160).optional(),
    consumer_name: z.string().max(200).optional().nullable(),
    city: z.string().min(1).max(160).optional(),
    state: z.string().max(120).optional(),
    discom: z.string().max(160).optional(),
    email: z.string().email().max(160).optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
    monthly_bill: z.number().nonnegative().optional(),
    consumer_id: z.string().max(160).optional().nullable(),
    survey_status: z.string().max(40).optional().nullable(),
    area: z.enum(["urban", "rural"]).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    connection_type: z.string().max(40).optional().nullable()
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" });

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const body = await req.json();
    const patch = patchSchema.parse(body);

    /**
     * Status transitions go through `bumpLeadStatus` so `last_touched_at` is
     * stamped consistently with the proposal-sent auto-bump path.
     */
    if (patch.status && Object.keys(patch).length === 1) {
      // Fetch current status for pipeline history
      const db2 = createSupabaseAdmin() ?? supabase;
      let prevStatus = "new";
      if (db2) {
        const leadsTable2 = await resolveLeadsTable();
        if (leadsTable2) {
          const { data: cur } = await db2.from(leadsTable2).select("status").eq("id", id).maybeSingle();
          if (cur) prevStatus = String(cur.status ?? "new");
        }
      }
      const updated = await bumpLeadStatus(id, patch.status);
      if (!updated) {
        return NextResponse.json({ ok: false, error: "lead_not_found_or_db_unavailable" }, { status: 404 });
      }
      // Log status change + pipeline history in parallel
      void Promise.all([
        appendActivityEvent({
          leadId: id,
          eventType: "status_changed",
          meta: { from: prevStatus, to: patch.status },
        }),
        appendActivityEvent({
          leadId: id,
          eventType: "pipeline_stage_changed",
          meta: { from: prevStatus, to: patch.status },
        }),
        (async () => {
          const dbClient = createSupabaseAdmin() ?? supabase;
          if (dbClient) {
            try {
              await dbClient.from("pipeline_history").insert({
                lead_id: id,
                from_stage: prevStatus,
                to_stage: patch.status,
                changed_at: new Date().toISOString(),
              });
            } catch { /* best-effort */ }
          }
        })(),
      ]);
      return NextResponse.json({ ok: true, data: mapCustomerRow(updated) });
    }

    /** Generic field patch (name / city / etc.) — also bumps last_touched_at. */
    const db = createSupabaseAdmin() ?? supabase;
    if (!db) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }
    const leadsTable = await resolveLeadsTable();
    if (!leadsTable) {
      return NextResponse.json({ ok: false, error: "leads_table_missing" }, { status: 500 });
    }
    const updatePayload: Record<string, unknown> = {
      ...patch,
      last_touched_at: new Date().toISOString()
    };
    const { data: updatedRow, error: updateErr } = await updateLeadAdaptive(db, leadsTable, id, updatePayload);
    if (updateErr || !updatedRow) {
      return NextResponse.json({ ok: false, error: updateErr ?? "Lead update failed" }, { status: 400 });
    }
    const changedFields = Object.keys(patch).filter((k) => k !== "last_touched_at");
    void appendActivityEvent({
      leadId: id,
      eventType: "lead_edited",
      meta: { fields: changedFields },
    });
    return NextResponse.json({ ok: true, data: mapCustomerRow(updatedRow) });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "Patch failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

/** Best-effort detach so FK / RLS on child tables cannot block lead delete. */
async function detachLeadReferences(db: SupabaseClient, leadId: string) {
  const tablesNullLead: Array<{ table: string; column: string }> = [
    { table: "proposals", column: "lead_id" },
    { table: "projects", column: "lead_id" },
  ];
  for (const { table, column } of tablesNullLead) {
    try {
      await db.from(table).update({ [column]: null }).eq(column, leadId);
    } catch {
      /* table/column may not exist on older deploys */
    }
  }

  const cascadeDeleteTables = [
    "activity_events",
    "followup_reminders",
    "lead_notes",
    "lead_visits",
    "pipeline_history",
  ];
  for (const table of cascadeDeleteTables) {
    try {
      await db.from(table).delete().eq("lead_id", leadId);
    } catch {
      /* optional tables */
    }
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const admin = createSupabaseAdmin();
    const db = admin ?? supabase;
    if (!db) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }
    if (!admin) {
      console.warn(
        "[DELETE /api/customers] SUPABASE_SERVICE_ROLE_KEY missing — anon RLS may block delete"
      );
    }

    const leadsTable = await resolveLeadsTable();
    if (!leadsTable) {
      return NextResponse.json({ ok: false, error: "leads_table_missing" }, { status: 500 });
    }

    const { data: existing, error: lookupErr } = await db
      .from(leadsTable)
      .select("id, name")
      .eq("id", id)
      .maybeSingle();
    if (lookupErr) {
      return NextResponse.json({ ok: false, error: lookupErr.message }, { status: 400 });
    }
    if (!existing) {
      return NextResponse.json({ ok: false, error: "lead_not_found" }, { status: 404 });
    }

    await detachLeadReferences(db, id);

    const { data, error } = await db.from(leadsTable).delete().eq("id", id).select("id").maybeSingle();
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "delete_blocked",
          hint: admin
            ? "A related row may still reference this lead."
            : "Set SUPABASE_SERVICE_ROLE_KEY on the server, or run migration 013_leads_anon_delete.sql.",
        },
        { status: 400 }
      );
    }
    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "lead_not_found",
          hint: admin
            ? "Lead vanished during delete."
            : "Delete blocked by RLS — add SUPABASE_SERVICE_ROLE_KEY or anon delete policy.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
