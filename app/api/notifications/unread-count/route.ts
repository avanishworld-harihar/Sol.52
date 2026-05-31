/**
 * GET /api/notifications/unread-count
 *
 * Returns unread notification count for the current org.
 * Phase 3: org-level count (broadcast notifications where recipient_id IS NULL).
 * Phase 5: add JWT-scoped recipient_id filtering.
 */
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { resolveDefaultOrgId } from "@/lib/project-store";

export const dynamic = "force-dynamic";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export async function GET() {
  try {
    const client = db();
    if (!client) {
      return NextResponse.json({ ok: true, data: { count: 0 } });
    }

    const orgId = await resolveDefaultOrgId();
    if (!orgId) {
      return NextResponse.json({ ok: true, data: { count: 0 } });
    }

    const { count, error } = await client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_read", false);

    if (error) {
      // Non-fatal: return 0 if notifications table not yet populated
      return NextResponse.json(
        { ok: true, data: { count: 0 } },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { ok: true, data: { count: count ?? 0 } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "unread_count_failed";
    return NextResponse.json({ ok: false, error: message, data: { count: 0 } }, { status: 500 });
  }
}
