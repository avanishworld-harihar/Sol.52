import { NextRequest, NextResponse } from "next/server";
import { getFollowupDashboardWidgets } from "@/lib/followup-store";
import { listCustomers } from "@/lib/supabase";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const scope = await resolveOrgScope(req);
  const denied = denyIfStrictUnauthenticated(scope);
  if (denied) return denied;
  const leads = await listCustomers({
    organizationId: scope.organizationId,
    includeNullOrg: scope.includeUnscopedRows,
  });
  const expanded = req.nextUrl.searchParams.get("view") === "all";
  const data = await getFollowupDashboardWidgets({
    leadIds: leads.map((lead) => String(lead.id ?? "")).filter(Boolean),
    leadLabels: Object.fromEntries(
      leads.map((lead) => {
        const id = String(lead.id ?? "");
        const friendlyName = String(lead.name ?? "").trim();
        const billName = String(lead.consumer_name ?? "").trim();
        return [id, billName && billName !== friendlyName ? `${billName} (${friendlyName})` : friendlyName || "Customer"];
      }).filter(([id]) => Boolean(id))
    ),
    organizationId: scope.organizationId,
    includeUnscopedRows: scope.includeUnscopedRows,
    horizonDays: expanded ? 365 : 90,
    limit: expanded ? 500 : 25,
  });
  return NextResponse.json(
    { ok: true, data: { ...data, generated_at: new Date().toISOString() } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
