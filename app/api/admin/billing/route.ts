import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequestAllowed } from "@/lib/admin-access";
import {
  adminAssignPlan,
  adminEndTrial,
  listOrganizationsWithBilling,
  listSubscriptionPlans,
} from "@/lib/billing";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  organizationId: z.string().uuid(),
  action: z.enum(["assign_plan", "end_trial", "start_trial"]),
  planCode: z.enum(["trial", "starter", "pro", "business"]).optional(),
  trialDays: z.number().int().min(1).max(90).optional(),
  actor: z.string().max(120).optional(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdminRequestAllowed(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [plans, organizations] = await Promise.all([
    listSubscriptionPlans(),
    listOrganizationsWithBilling(200),
  ]);

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
