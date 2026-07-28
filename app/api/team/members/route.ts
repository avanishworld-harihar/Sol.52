import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyAdmin } from "@/lib/auth/roles";
import { resolveOrgIdForRequest } from "@/lib/auth/org-context";
import {
  cancelInvite,
  countPendingInvites,
  createPhoneInvite,
  listOrgMembers,
  listPendingInvites,
  removeOrgMember,
} from "@/lib/team/invites";
import { countOrgMembers, getOrgSubscription } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminSession = requireCompanyAdmin(req);
    if (!adminSession) {
      // Soft: if not signed in as admin, return summary-only for billing card OR 401
      const orgId = await resolveOrgIdForRequest(req);
      if (!orgId) {
        return NextResponse.json({ ok: true, data: null }, { headers: { "Cache-Control": "no-store" } });
      }
      const [memberCount, pendingCount, sub] = await Promise.all([
        countOrgMembers(orgId),
        countPendingInvites(orgId),
        getOrgSubscription(orgId),
      ]);
      const maxUsers = sub?.plan.max_users ?? sub?.plan.features.max_users ?? 1;
      const teamEnabled = sub?.plan.features.team_members_enabled === true;
      return NextResponse.json(
        {
          ok: true,
          data: {
            canManage: false,
            memberCount,
            pendingCount,
            maxUsers,
            teamEnabled,
            canAddMore: false,
            planCode: sub?.plan.code ?? null,
            members: [],
            invites: [],
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const orgId = adminSession.organizationId;
    const [members, invites, memberCount, pendingCount, sub] = await Promise.all([
      listOrgMembers(orgId),
      listPendingInvites(orgId),
      countOrgMembers(orgId),
      countPendingInvites(orgId),
      getOrgSubscription(orgId),
    ]);

    const maxUsers = sub?.plan.max_users ?? sub?.plan.features.max_users ?? 1;
    const teamEnabled = sub?.plan.features.team_members_enabled === true;

    return NextResponse.json(
      {
        ok: true,
        data: {
          canManage: true,
          memberCount,
          pendingCount,
          maxUsers,
          teamEnabled,
          canAddMore: teamEnabled && memberCount + pendingCount < maxUsers,
          planCode: sub?.plan.code ?? null,
          members,
          invites,
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
  phone: z.string().min(8).max(20),
  role: z.enum(["company_admin", "employee"]).default("employee"),
  note: z.string().max(200).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const adminSession = requireCompanyAdmin(req);
    if (!adminSession) {
      return NextResponse.json(
        { ok: false, error: "Only company admin can invite team members. Sign in first." },
        { status: 403 }
      );
    }

    const body = postSchema.parse(await req.json());
    const result = await createPhoneInvite({
      organizationId: adminSession.organizationId,
      phone: body.phone,
      role: body.role,
      invitedByUserId: adminSession.userId,
      note: body.note ?? null,
    });

    if ("error" in result) {
      return NextResponse.json(
        { ok: false, error: result.error, code: result.code ?? null },
        { status: result.status }
      );
    }

    const [memberCount, pendingCount] = await Promise.all([
      countOrgMembers(adminSession.organizationId),
      countPendingInvites(adminSession.organizationId),
    ]);

    return NextResponse.json({
      ok: true,
      invite: result.invite,
      memberCount,
      pendingCount,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "team_invite_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

const deleteSchema = z.object({
  memberId: z.string().uuid().optional(),
  inviteId: z.string().uuid().optional(),
});

export async function DELETE(req: NextRequest) {
  try {
    const adminSession = requireCompanyAdmin(req);
    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Only company admin can manage team." }, { status: 403 });
    }

    const body = deleteSchema.parse(await req.json());
    if (body.inviteId) {
      const result = await cancelInvite({
        organizationId: adminSession.organizationId,
        inviteId: body.inviteId,
      });
      if ("error" in result) {
        return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      }
      return NextResponse.json({ ok: true, cancelled: true });
    }

    if (body.memberId) {
      const result = await removeOrgMember({
        organizationId: adminSession.organizationId,
        memberId: body.memberId,
        actorUserId: adminSession.userId,
      });
      if ("error" in result) {
        return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
      }
      return NextResponse.json({ ok: true, removed: true });
    }

    return NextResponse.json({ ok: false, error: "Provide memberId or inviteId." }, { status: 400 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    const message = e instanceof Error ? e.message : "team_delete_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
