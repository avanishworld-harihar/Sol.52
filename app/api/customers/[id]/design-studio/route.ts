import { NextRequest, NextResponse } from "next/server";
import { assertProjectDesignStudioAccess } from "@/lib/billing/design-studio-entitlements";
import { isBillingEntitlementError } from "@/lib/billing/errors";
import { mapCustomerRow } from "@/lib/customers-map";
import { ensureDesignProjectForLead } from "@/lib/project-store";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { resolveLeadsTable, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * Ensure a soft (pre-Won) project for this lead and return Design Studio path.
 * Same DesignStudioClient route as Project Hub — no duplicate UI.
 */
export async function POST(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: leadId } = await ctx.params;
    if (!leadId?.trim()) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const db = createSupabaseAdmin() ?? supabase;
    if (!db) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }

    const leadsTable = await resolveLeadsTable();
    if (!leadsTable) {
      return NextResponse.json({ ok: false, error: "leads_table_missing" }, { status: 500 });
    }

    const { data: leadRow, error: leadErr } = await db
      .from(leadsTable)
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr) {
      return NextResponse.json({ ok: false, error: leadErr.message }, { status: 400 });
    }
    if (!leadRow) {
      return NextResponse.json({ ok: false, error: "lead_not_found" }, { status: 404 });
    }

    const mapped = mapCustomerRow(leadRow as Record<string, unknown>);
    const project = await ensureDesignProjectForLead(leadId, {
      name: mapped.name,
      consumer_name: mapped.consumer_name,
      city: mapped.city,
      status: mapped.status,
    });

    if (!project?.id) {
      return NextResponse.json(
        { ok: false, error: "design_project_create_failed" },
        { status: 500 }
      );
    }

    const projectId = String(project.id);
    await assertProjectDesignStudioAccess(projectId);

    const path = `/projects/${encodeURIComponent(projectId)}/design-studio`;
    return NextResponse.json(
      {
        ok: true,
        data: {
          projectId,
          path,
          dashboardVisible: project.dashboard_visible !== false,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (isBillingEntitlementError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code, details: error.details },
        { status: 402 }
      );
    }
    const message =
      error instanceof Error ? error.message : "design_studio_open_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
