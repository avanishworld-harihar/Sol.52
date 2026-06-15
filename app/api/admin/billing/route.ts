import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAllowed } from "@/lib/admin-access";
import {
  adminAssignPlan,
  adminEndTrial,
  adminGrantComplimentary,
  adminRevokeComplimentary,
  buildAdminOrgBillingSnapshot,
  listOrganizationsWithBilling,
  listSubscriptionPlans,
} from "@/lib/billing";

export const dynamic = "force-dynamic";

const basePatchSchema = z.object({
  organizationId: z.string().uuid(),
  action: z.enum([
    "assign_plan",
    "end_trial",
    "start_trial",
    "revoke_complimentary",
    "grant_complimentary",
  ]),
  planCode: z.enum(["trial", "starter", "pro", "business"]).optional(),
  trialDays: z.number().int().min(1).max(90).optional(),
  durationDays: z.union([z.literal(14), z.literal(30), z.literal(60)]).optional(),
  expiresAt: z.string().datetime().optional(),
  grantedReason: z.string().min(3).max(500).optional(),
  actor: z.string().max(120).optional(),
  reason: z.string().max(500).optional(),
});

const patchSchema = basePatchSchema.superRefine((body, ctx) => {
  if (body.action === "grant_complimentary") {
    if (!body.grantedReason?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "grantedReason is required.", path: ["grantedReason"] });
    }
    if (body.planCode && body.planCode === "trial") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Complimentary grant supports Starter, Pro, or Business only.", path: ["planCode"] });
    }
    if (!body.durationDays && !body.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide durationDays (14, 30, 60) or expiresAt.",
        path: ["durationDays"],
      });
    }
  }
});

export async function GET(req: NextRequest) {
  if (!(await isAdminRequestAllowed(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [plans, orgRows] = await Promise.all([
    listSubscriptionPlans(),
    listOrganizationsWithBilling(200),
  ]);

  const organizations = await Promise.all(
    orgRows.map(async (org) => {
      const snapshot = await buildAdminOrgBillingSnapshot(org.id);
      return { ...org, billing: snapshot };
    })
  );

  return NextResponse.json(
    { ok: true, plans, organizations },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequestAllowed(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = patchSchema.parse(await req.json());
    const actor = body.actor ?? "super_admin";

    if (body.action === "end_trial") {
      await adminEndTrial(body.organizationId, actor);
      return NextResponse.json({ ok: true, message: "Trial ended." });
    }

    if (body.action === "revoke_complimentary") {
      await adminRevokeComplimentary(body.organizationId, actor, body.reason);
      return NextResponse.json({ ok: true, message: "Complimentary access revoked." });
    }

    if (body.action === "grant_complimentary") {
      const planCode = (body.planCode === "starter" || body.planCode === "business"
        ? body.planCode
        : "pro") as "starter" | "pro" | "business";
      const sub = await adminGrantComplimentary({
        organizationId: body.organizationId,
        planCode,
        durationDays: body.durationDays,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        grantedBy: actor,
        grantedReason: body.grantedReason ?? "",
      });
      if (!sub) {
        return NextResponse.json({ ok: false, error: "Could not grant complimentary access." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, subscription: sub });
    }

    if (body.action === "start_trial" || body.action === "assign_plan") {
      const planCode = body.planCode ?? (body.action === "start_trial" ? "trial" : "starter");
      const sub = await adminAssignPlan({
        organizationId: body.organizationId,
        planCode,
        trialDays: body.trialDays,
        actor,
      });
      if (!sub) {
        return NextResponse.json({ ok: false, error: "Could not assign plan." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, subscription: sub });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (e) {
    const message = e instanceof z.ZodError ? e.message : e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
