import { NextRequest, NextResponse } from "next/server";
import { getCommandCenterPayload } from "@/lib/crm-command-center-store";
import { denyIfStrictUnauthenticated, resolveOrgScope } from "@/lib/auth/org-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const scope = await resolveOrgScope(req);
  const denied = denyIfStrictUnauthenticated(scope);
  if (denied) return denied;
  const data = await getCommandCenterPayload({
    organizationId: scope.organizationId,
    includeNullOrg: scope.includeUnscopedRows,
  });
  return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}
