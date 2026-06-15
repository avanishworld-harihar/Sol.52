import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertCanAddTeamMember,
  countOrgMembers,
  getOrgSubscription,
  isBillingEntitlementError,
  resolveOrgBilling,
} from "@/lib/billing";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { resolveDefaultOrgId } from "@/lib/project-store";

export const dynamic = "force-dynamic";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export async function GET() {
  try {
    const orgId = await resolveDefaultOrgId();
    if (!orgId) {
      return NextResponse.json({ ok: true, data: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const [memberCount, sub] = await Promise.all([
      countOrgMembers(orgId),
      getOrgSubscription(orgId),
    ]);

    const maxUsers = sub?.plan.max_users ?? sub?.plan.features.max_users ?? 1;
    const teamEnabled = sub?.plan.features.team_members_enabled === true;

    return NextResponse.json(
      {
        ok: true,
        data: {
          memberCount,
          maxUsers,
          teamEnabled,
          canAddMore: teamEnabled && memberCount < maxUsers,
          planCode: sub?.plan.code ?? null,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "team_fetch_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

const postSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["company_admin", "employee"]).default("employee"),
});

export async function POST(req: NextRequest) {
  try {
    const orgId = await resolveDefaultOrgId();
    if (!orgId) {
      return NextResponse.json({ ok: false, error: "No organization." }, { status: 400 });
    }

    const body = postSchema.parse(await req.json());
    const client = db();
    if (!client) {
      return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
    }

    const sub = await resolveOrgBilling(orgId);
    try {
      await assertCanAddTeamMember({ organizationId: orgId, sub });
    } catch (billingErr) {
      if (isBillingEntitlementError(billingErr)) {
        return NextResponse.json(
          {
            ok: false,
            error: billingErr.message,
            code: billingErr.code,
            details: billingErr.details ?? null,
          },
          { status: 402 }
        );
      }
      throw billingErr;
    }

    const { data, error } = await client
      .from("organization_members")
      .insert({
        organization_id: orgId,
        user_id: body.userId,
        role: body.role,
      })
      .select("id, organization_id, user_id, role, created_at")
      .single();

    if (error) {
      if (/duplicate key|organization_members_org_user_unique/i.test(error.message)) {
        return NextResponse.json({ ok: false, error: "User is already a team member." }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const memberCount = await countOrgMembers(orgId);
    return NextResponse.json({ ok: true, member: data, memberCount });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "team_add_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
